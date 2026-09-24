import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import csv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

CUENCAS = [
    ("https://www.embalses.net/cuenca-17-cantabrico-occidental.html", "Cantábrico Occidental"),
    ("https://www.embalses.net/cuenca-16-cantabrico-oriental.html", "Cantábrico Oriental"),
    ("https://www.embalses.net/cuenca-11-cataluna-interna.html", "Cataluña Interna"),
    ("https://www.embalses.net/cuenca-2-duero.html", "Duero"),
    ("https://www.embalses.net/cuenca-5-ebro.html", "Ebro"),
    ("https://www.embalses.net/cuenca-10-galicia-costa.html", "Costa Galicia"),
    ("https://www.embalses.net/cuenca-19-guadalete-barbate.html", "Guadalete Barbate"),
    ("https://www.embalses.net/cuenca-4-guadalquivir.html", "Guadalquivir"),
    ("https://www.embalses.net/cuenca-6-guadiana.html", "Guadiana"),
    ("https://www.embalses.net/cuenca-7-jucar.html", "Júcar"),
    ("https://www.embalses.net/cuenca-9-med-andaluza.html", "Med. Andaluza"),
    ("https://www.embalses.net/cuenca-8-mino-sil.html", "Miño-Sil"),
    ("https://www.embalses.net/cuenca-12-pais-vasco-interna.html", "País Vasco"),
    ("https://www.embalses.net/cuenca-1-segura.html", "Segura"),
    ("https://www.embalses.net/cuenca-3-tajo.html", "Tajo"),
    ("https://www.embalses.net/cuenca-18-tinto-odiel-y-piedras.html", "Tinto, Odiel y Piedras"),
]

def normalizar_cuenca(cuenca_original):
    """Normaliza el nombre de la cuenca según la agrupación SAIH"""
    mapeo = {
        
        "Cantábrico Occidental": "Cantábrica",
        "Cantábrico Oriental": "Cantábrica",
        "Costa Galicia": "Cantábrica",
        "País Vasco": "Cantábrica",
        
        "Miño-Sil": "Miño-sil",
        
        "Duero": "Duero",
        
        "Tajo": "Tajo",
        
        "Guadiana": "Guadiana",
        
        "Guadalquivir": "Guadalquivir",
        "Med. Andaluza": "Guadalquivir",
        "Tinto, Odiel y Piedras": "Guadalquivir",
        "Guadalete Barbate": "Guadalquivir",
        
        "Segura": "Segura",
        
        "Júcar": "Júcar",
        "Cataluña Interna": "Júcar",
        
        "Ebro": "Ebro",
    }
    return mapeo.get(cuenca_original, cuenca_original)

def scrape_cuenca(url, nombre_cuenca):
    print(f"  Procesando: {nombre_cuenca}...")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    if resp.encoding is None or resp.encoding.lower() == "utf-8":
        resp.encoding = "cp1252"

    soup = BeautifulSoup(resp.text, "html.parser")

    tablas = soup.find_all("table", class_="Tabla")
    if not tablas:
        return []

    datos = []

    for tabla in tablas:
        for fila in tabla.find_all("tr")[2:]:  
            celdas = fila.find_all("td")
            if len(celdas) < 2:  
                continue
                
            pantano = celdas[0].get_text(strip=True)
            pantano = pantano.replace(" [+]", "").replace("[+]", "")
            
            pantano = pantano.encode("latin-1", errors="ignore").decode("utf-8", errors="ignore")
            
            if not pantano:
                continue

            capacidad = celdas[1].get_text(strip=True) if len(celdas) > 1 else ""

            embalsada = ""
            variacion = ""

            if len(celdas) >= 4:
                embalsada = celdas[2].get_text(strip=True) if len(celdas) > 2 else ""
                variacion = celdas[3].get_text(strip=True) if len(celdas) > 3 else ""
            
            elif len(celdas) >= 3:
                embalsada = celdas[2].get_text(strip=True)
                variacion = ""

            if not embalsada or embalsada == "-" or embalsada.lower() in ["n/d", "nd", "nodata", "sin dato", ""]:
                embalsada = "NoData"
            if not variacion or variacion == "-" or variacion.lower() in ["n/d", "nd", "nodata", "sin dato", ""]:
                variacion = "NoData"

            if not capacidad or capacidad == "-" or capacidad.strip() == "":
                capacidad = None
            else:
                
                try:
                    
                    capacidad_limpia = capacidad.replace(".", "").replace(",", ".").strip()
                    capacidad = int(float(capacidad_limpia)) if capacidad_limpia else None
                except (ValueError, AttributeError):
                    capacidad = None
            
            datos.append((nombre_cuenca, pantano, capacidad, embalsada, variacion))

    return datos

PG_CONN = dict(
    host="localhost",
    port=5432,
    dbname="TIIG",
    user="postgres",
    password="8806",
)

def guardar_en_postgres(registros, timestamp_actual):
    try:
        print(f"  Conectando a PostgreSQL: {PG_CONN['host']}:{PG_CONN['port']}/{PG_CONN['dbname']}")
        conn = psycopg2.connect(**PG_CONN)
        cur = conn.cursor()

        print("  Creando tabla 'embalses_geom' si no existe...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS embalses_geom (
                fid SERIAL PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE,
                cuenca VARCHAR(255),
                cuenca_norm VARCHAR(255),
                pantano VARCHAR(255),
                capacidad BIGINT,
                embalsada VARCHAR(255),
                variacion VARCHAR(255)
            )
        """)
        conn.commit()
        print("  Tabla 'embalses_geom' creada/verificada")

        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'embalses_geom' AND table_schema = 'public'
        """)
        columnas = [col[0] for col in cur.fetchall()]
        print(f"  Columnas en la tabla: {columnas}")
        if "cuenca_norm" not in columnas:
            print("  Añadiendo columna 'cuenca_norm' a la tabla existente...")
            cur.execute("ALTER TABLE embalses_geom ADD COLUMN cuenca_norm VARCHAR(255)")
            conn.commit()
            print("  Columna 'cuenca_norm' añadida")
        
        conn.commit()

        if registros:
            print(f"  Actualizando/insertando {len(registros)} registros...")
            actualizados = 0
            insertados = 0
            
            for registro in registros:
                timestamp_pg, cuenca, cuenca_norm, pantano, capacidad, embalsada, variacion = registro

                cur.execute("""
                    UPDATE embalses_geom 
                    SET timestamp = %s,
                        cuenca = %s,
                        cuenca_norm = %s,
                        capacidad = %s,
                        embalsada = %s,
                        variacion = %s
                    WHERE pantano = %s AND cuenca = %s
                """, (timestamp_pg, cuenca, cuenca_norm, capacidad, embalsada, variacion, pantano, cuenca))
                
                if cur.rowcount > 0:
                    actualizados += 1
                else:
                    
                    cur.execute("""
                        INSERT INTO embalses_geom (timestamp, cuenca, cuenca_norm, pantano, capacidad, embalsada, variacion)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, registro)
                    insertados += 1
            
            conn.commit()
            print(f"  [OK] Actualizados {actualizados} registros existentes")
            print(f"  [OK] Insertados {insertados} nuevos registros")
            print(f"  [OK] Total procesados: {len(registros)} registros")

            cur.execute("SELECT COUNT(*) FROM embalses_geom")
            total = cur.fetchone()[0]
            print(f"  Total de registros en la base de datos: {total}")
        else:
            print("  [AVISO] No hay registros para insertar")
        
        cur.close()
        conn.close()
        print(f"  [OK] Base de datos PostgreSQL actualizada correctamente")
        
    except Exception as e:
        print(f"  [ERROR] Error al guardar en base de datos: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    todos = []
    ahora = datetime.now().isoformat(timespec="seconds")
    
    print(f"Iniciando scraping de {len(CUENCAS)} cuencas...")
    print(f"Timestamp: {ahora}\n")

    for i, (url, nombre) in enumerate(CUENCAS, 1):
        try:
            print(f"[{i}/{len(CUENCAS)}] {nombre}")
            datos_cuenca = scrape_cuenca(url, nombre)
            print(f"  -> {len(datos_cuenca)} embalses encontrados")
            
            for cuenca, pantano, capacidad, embalsada, variacion in datos_cuenca:
                cuenca_norm = normalizar_cuenca(cuenca)

                timestamp_pg = datetime.fromisoformat(ahora)
                registro = (timestamp_pg, cuenca, cuenca_norm, pantano, capacidad, embalsada, variacion)
                todos.append(registro)
        except requests.exceptions.Timeout:
            print(f"  [ERROR] Timeout al descargar {nombre}")
        except requests.exceptions.RequestException as e:
            print(f"  [ERROR] Error de conexión en {nombre}: {e}")
        except Exception as e:
            print(f"  [ERROR] Error inesperado en {nombre}: {e}")
        print()

    print(f"\nTotal de registros: {len(todos)}")
    print("Guardando en base de datos PostgreSQL...")
    guardar_en_postgres(todos, ahora)
    print("Guardando en CSV...")
    with open(r"dataPH\embalses.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "cuenca", "cuenca_norm", "pantano", "capacidad", "embalsada", "variacion"])
        
        for registro in todos:
            timestamp_pg, cuenca, cuenca_norm, pantano, capacidad, embalsada, variacion = registro
            timestamp_str = timestamp_pg.isoformat() if isinstance(timestamp_pg, datetime) else str(timestamp_pg)
            
            capacidad_str = str(capacidad) if capacidad is not None else ""
            writer.writerow([timestamp_str, cuenca, cuenca_norm, pantano, capacidad_str, embalsada, variacion])
    print("¡Completado!")