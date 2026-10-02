import csv
import json
import time
from datetime import datetime

import requests
import urllib3
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from config import DATA_DIR, GUADIANA_JWT, chrome_options

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def descarga_jucar():
    url = "https://saih.chj.es/aforos"
    print("JÚCAR ->", url)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    ruta_html = DATA_DIR / "saih_jucar.html"
    ruta_html.write_bytes(resp.content)

    soup = BeautifulSoup(resp.content, "html.parser")
    rows = soup.find_all("tr")

    import pandas as pd

    datos = []
    for row in rows[1:]:
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 7:
            continue

        nombre = cols[0] if cols[0] else ""
        caudal = cols[2] if len(cols) > 2 and cols[2] else ""
        hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if nombre:
            datos.append((nombre, caudal, hora))

    df = pd.DataFrame(datos, columns=["nombre", "caudal_m3s", "hora"])
    df["id"] = range(1, len(df) + 1)
    df["caudal_m3s"] = (
        df["caudal_m3s"]
        .astype(str)
        .str.replace('"', '', regex=False)
        .str.strip()
        .replace("", None)
        .str.replace(",", ".", regex=False)
    )
    df["caudal_m3s"] = pd.to_numeric(df["caudal_m3s"], errors="coerce")
    df.to_csv(DATA_DIR / "saih_jucar.csv", index=False, encoding="utf-8")
    print(f"  [OK] {len(df)} registros guardados")


def descarga_ebro():
    url = "https://www.saihebro.com/api/mapa/getTablaCajetinesOrdenada?slug=mapa-aforos-HG-toda-la-cuenca&columna=estacion&orden=desc"
    print("EBRO ->", url)
    resp = requests.get(url, verify=False, timeout=30)
    resp.raise_for_status()
    (DATA_DIR / "saih_ebro.json").write_text(resp.text, encoding="utf-8")
    print("  [OK] respuesta guardada")


def descarga_segura():
    urls_segura = [
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=04L01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=03L01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=03R03&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=03E02&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=02C01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=02C02&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=01O01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=01C01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=01L01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=05C02&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=01E05&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07C03&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07A03&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07R01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07C06&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07C08&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=01C02&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07U01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07C10&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=05C01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=06L01&zona=*",
        "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07C07&zona=*",
    ]
    print("SEGURA -> procesando", len(urls_segura), "estaciones")

    registros = []
    for url in urls_segura:
        try:
            r = requests.get(url, timeout=15)
            r.raise_for_status()
        except Exception as e:
            print(f"  [ERROR] Error al obtener {url}: {e}")
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        csv_hidden = soup.find("input", {"id": "csv"})
        if not csv_hidden:
            print("  [AVISO] No se encontró input id=csv en", url)
            continue

        raw = csv_hidden.get("value", "")
        if "***" not in raw:
            print("  [AVISO] Valor csv sin separador *** en", url)
            continue

        _, filas_txt = raw.split("***", 1)
        filas = filas_txt.split("***")

        for fila in filas:
            fila = fila.strip()
            if not fila:
                continue

            partes = fila.split(";")
            if len(partes) < 5:
                continue

            codigo = partes[0].strip() if len(partes) > 0 else ""
            descripcion = partes[1].strip() if len(partes) > 1 else ""
            fecha = partes[2].strip() if len(partes) > 2 else ""
            valor = partes[3].strip() if len(partes) > 3 else ""
            uds = partes[4].strip() if len(partes) > 4 else ""

            if not codigo or codigo.upper().startswith("VARIABLE"):
                continue
            if not codigo.upper().startswith("Q"):
                continue

            registros.append({
                "codigo": codigo,
                "descripcion": descripcion,
                "fecha": fecha,
                "valor": valor,
                "uds": uds,
                "url": url,
            })

    salida = DATA_DIR / "saih_segura.csv"
    with open(salida, "w", newline="", encoding="utf-8") as f:
        campos = ["codigo", "descripcion", "fecha", "valor", "uds", "url"]
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(registros)
    print(f"  [OK] {len(registros)} registros guardados")


def descarga_tajo():
    url_tajo = [
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhR2fDEEEkMGI0AJBueEw5XIzwSsSEJ90pAnO9H1Jo%2F4drbHPYzyg%2B4Ba9wFrvPNJW7rtEmT4KbOb%2Bl8sbAkMu7M%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhcREvHLb1zIiK4kaKu1JXJFEz7BDYQ4%2FWDkqPYYrEU0wQ8lf3FJnM9Q%2F8rP9rFXoU7%2F%2BQxMx2BnZrC04WYYPwQE%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhZIXavf9h0V7BpnRNztV7hjmUGQP1FrrKWhFd4mR3r4phb%2BV201wnjfChkh626sFDHPq1%2Ft2mwRUecE8YTgQ6ro%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhVWO6TVkavlnaQfh92ZlcGdlk%2BCiiLEO9FDhXc%2FhP7tOcPxZupgIj2VUuXdDZs0hINuU2PplTCj41nD7fantKmA%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhaJBewGqfeZDPODJV8sVZaKXXE9DmBLv2UNvcJdwXBqJ0cp6QajBZSZpxcKQcJ7ltI4PEERZBYl1HRylMZP2LII%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhURmMjgkL4OKVdcwHlBgajKr%2FKl4slfKODctnCtfqd9gY1Z9tkGRczxUiFn3EtgI7VPkiSXdUDK%2BOmeUJoj0Xk4%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhXMrJdSP8Lr%2BMPyaAotfQHfLgAKj62%2B85stJDQ3KinHNsWLXjtRlAkfUA3QYMmATD%2B0lqWFq3Gjx7zi6tx2rPXg%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhfvCLSEeNDv9NN5WyETUX1L1eMT8%2Fob6J6AQsYmdY5LXoD5pbn97dFjJnZM8UG0CVq16GRWUe7FAylBh5Mko6gc%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2Fyxpbhd1ddKEoiYb05LUtuaZY9Xo2pxODT9BpyMQxzGOYVZ6FHt%2FF2yeS6ZtftMHw%2FwCND0YEYIh93r%2ByZoj3P95xd9w%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhcXJX1TsT9NAz8aawbKkORVshIDlK8LR5lVjX3z%2FE%2FS8LUfTuAbSU9512bOXfS8JOfc0q6Gfkj21AZRZvbqdcVs%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhdWbacoZiaLy8Sy%2FNt9c%2B04pwdIoISaJRHkqSi%2BERvR4edGj%2FLFfWRz0P5bJMf5WyftIOkPlIV0zZXB3C9ljjA0%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhZP%2BKgc11aOZw9Nmaebz%2BkFvKiiR6gaRUzYZs7GUanlFG6i%2BpNKCpWxWLmSbNsXdstTKtWp%2FUh5wIagcfd9N7WA%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhW4aLIGrEBW825ZFWfPXKbydf1I1O5LK%2BKhxAu7j1u%2Bnb4rMZWr4%2FK4QW8GEarP9PQchag%2FpSBdxsiEFvVY4XO0%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhbG5c0Wg2FXpNSlyEF216TtN%2FBQpgdNMW28zdn59fYbXnL52FOSpAw885VgVZnidw9jHXSjA94j%2BTWN%2Fczywwug%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhTF2Rq4ov0qB6zKOJEsMgqFYSPkeJbY6YfYFldTDi3QQyhLn5SR35ko6Jp01JkJSEejKDA57RH0hzVRkEx8EnmU%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbheCP33MQSmkneYV6fC59ajxobWhz72TpdZDun4UcUtJiZCHZc3TuBcY9Hl3ApUCcA9AKFmHXbAp8drd4WXpo0EM%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhQqf4IfbkFN6tkasvFLtpDef8%2FPjL%2F1Z6%2BX2TxZ4xRFcHcmON%2FNPaeIz8Z9jj%2BISIz57U6NUZxXPq4exAltsMUU%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhQqf4IfbkFN6tkasvFLtpDef8%2FPjL%2F1Z6%2BX2TxZ4xRFcHcmON%2FNPaeIz8Z9jj%2BISIz57U6NUZxXPq4exAltsMUU%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhcAqSAQxfYGDayxeGPpR0c0Cz%2BFX50TCobYUVlvPZGWuZ6nnyv9J%2BStZ3wbwI1tpRaC%2Bze5CuD16sBVGJP8njYw%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhZzdsH2TfSh672N1a4ZeesLu9c3d8Bu4QqL9hBedAhFpoV8vHYPbEV6VqxHWnRuMIQZ9%2FmjFjHg2%2BpxXNf2OuQY%3D",
        "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhTTuRIWWLIIMMtflYUWlvfgBXUi5NrP5j0CWkkdeCg9yOx1SEk7A%2BxYGKxcKO%2BEVmJqM%2B4vZGAjRLYpfGFmARyk%3D",
    ]

    salida = {
        "fuente": "SAIH_TAJO",
        "hora_descarga": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "data": [],
    }

    print("TAJO -> procesando", len(url_tajo), "estaciones")
    for url in url_tajo:
        try:
            r = requests.get(url, verify=False, timeout=10)
            r.raise_for_status()
            resp_data = r.json()

            if "response" not in resp_data:
                continue
            resp = resp_data["response"]
            if "senales" not in resp:
                continue

            for s in resp.get("senales", []):
                if not s or "nombre" not in s:
                    continue
                nombre = s.get("nombre", "").upper()
                if "CAUDAL" not in nombre and "CANAL" not in nombre:
                    continue
                last = s.get("last", {})
                if not last:
                    continue
                salida["data"].append({
                    "id": s.get("tag", ""),
                    "nombre": s.get("nombre", ""),
                    "valor": last.get("valor") if last.get("valor") is not None else "",
                    "fecha": last.get("tiempo") if last.get("tiempo") else "",
                })
        except Exception as e:
            print(f"  [ERROR] Error al procesar {url}: {e}")
            continue

    with open(DATA_DIR / "saih_tajo.json", "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {len(salida['data'])} señales guardadas")


def obtener_token_guadiana():
    try:
        options = chrome_options()
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})

        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        print("  [INFO] Abriendo navegador para obtener token...")
        driver.get("https://www.siraguadiana.com/")
        time.sleep(5)

        token = driver.execute_script("""
            return localStorage.getItem('authjwt') ||
                   sessionStorage.getItem('authjwt') ||
                   localStorage.getItem('token') ||
                   sessionStorage.getItem('token') ||
                   localStorage.getItem('jwt') ||
                   sessionStorage.getItem('jwt');
        """)

        if not token or not (len(token) > 50 and token.count('.') == 2):
            print("  [INFO] Haciendo petición real para capturar token...")
            time.sleep(3)
            driver.execute_script("""
                fetch('https://siraguadiana.com/backend/Visor/resourceByID', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': 'https://www.siraguadiana.com',
                        'Referer': 'https://www.siraguadiana.com/'
                    },
                    body: JSON.stringify({"id": "CR", "type": "ficha_redes_control"})
                }).catch(function(err) { console.log('Fetch error:', err); });
            """)
            time.sleep(6)

        token = None
        try:
            print("  [INFO] Buscando token en peticiones de red...")
            logs = driver.get_log('performance')
            for log in logs:
                try:
                    message_data = json.loads(log.get('message', '') or '{}')
                    message = message_data.get('message', {})
                    if message.get('method') != 'Network.requestWillBeSent':
                        continue
                    request = message.get('params', {}).get('request', {})
                    if 'resourceByID' not in request.get('url', ''):
                        continue
                    headers = request.get('headers', {})
                    for header_name, header_value in headers.items():
                        header_lower = header_name.lower()
                        if header_lower in ('authjwt', 'auth-jwt'):
                            candidate = str(header_value).strip()
                            if len(candidate) > 50 and candidate.count('.') == 2:
                                token = candidate
                                break
                        elif header_lower == 'authorization' and 'bearer' in str(header_value).lower():
                            candidate = str(header_value).split(' ')[-1]
                            if len(candidate) > 50 and candidate.count('.') == 2:
                                token = candidate
                                break
                    if token:
                        break
                except (json.JSONDecodeError, KeyError, TypeError, AttributeError):
                    continue
        except Exception as e:
            print(f"  [AVISO] Error al leer logs de performance: {e}")

        if not token:
            try:
                for cookie in driver.get_cookies():
                    name_lower = cookie.get('name', '').lower()
                    if any(k in name_lower for k in ('jwt', 'token', 'auth')):
                        candidate = cookie.get('value')
                        if candidate and len(candidate) > 50 and candidate.count('.') == 2:
                            token = candidate
                            break
            except Exception:
                pass

        driver.quit()

        if token and len(token) > 50 and token.count('.') == 2:
            print(f"  [OK] Token JWT obtenido automáticamente (longitud: {len(token)})")
            return token

        print("  [AVISO] No se pudo obtener un token válido automáticamente.")
        return None
    except Exception as e:
        print(f"  [ERROR] Error al obtener token automáticamente: {e}")
        return None


def descarga_guadiana():
    url = "https://siraguadiana.com/backend/Visor/resourceByID"
    print("GUADIANA ->", url)

    token_jwt = GUADIANA_JWT
    max_intentos = 3
    if not token_jwt:
        for intento in range(1, max_intentos + 1):
            print(f"  [INFO] Intento {intento}/{max_intentos} de obtener token...")
            token_jwt = obtener_token_guadiana()
            if token_jwt:
                break
            if intento < max_intentos:
                time.sleep(3)

    if not token_jwt:
        print("  [ERROR] No se pudo obtener un token JWT válido, se omite Guadiana en esta ejecución.")
        return

    payload = {"id": "CR", "type": "ficha_redes_control"}
    headers_variants = [
        {"Content-Type": "application/json", "authjwt": token_jwt,
         "Origin": "https://www.siraguadiana.com", "Referer": "https://www.siraguadiana.com/"},
        {"Content-Type": "application/json", "Authjwt": token_jwt,
         "Origin": "https://www.siraguadiana.com", "Referer": "https://www.siraguadiana.com/"},
        {"Content-Type": "application/json", "Authorization": f"Bearer {token_jwt}",
         "Origin": "https://www.siraguadiana.com", "Referer": "https://www.siraguadiana.com/"},
    ]

    resp = None
    for header_variant in headers_variants:
        try:
            resp = requests.post(url, json=payload, headers=header_variant, verify=False, timeout=30)
            resp.raise_for_status()
            resp_json = resp.json()
            if resp_json.get("status") != "false" and "error" not in resp_json:
                break
            resp = None
        except (requests.exceptions.RequestException, json.JSONDecodeError):
            resp = None
            continue

    if resp is None:
        print("  [ERROR] No se pudo obtener una respuesta válida de Guadiana")
        return

    salida = DATA_DIR / "saih_guadiana.json"
    salida.write_bytes(resp.content)
    print(f"  [OK] Respuesta guardada en {salida}")


def descarga_guadalquivir():
    url = "https://www.chguadalquivir.es/saih/"
    print("GUADALQUIVIR ->", url)

    import pandas as pd

    resp = requests.get(url, verify=False, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.content, "html.parser")
    tabla = soup.find("table", id="ContentPlaceHolder1_GVcaudal")
    if not tabla:
        print("  [ERROR] No se encontró la tabla de caudales")
        datos = []
    else:
        datos = []
        for row in tabla.find_all("tr")[1:]:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 5:
                continue
            nombre = cols[0] if cols[0] else ""
            caudal = cols[2] if len(cols) > 2 and cols[2] else ""
            hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if nombre:
                datos.append((nombre, caudal, hora))

    df = pd.DataFrame(datos, columns=["nombre", "caudal_m3s", "hora"])
    if len(df) > 0:
        df["caudal_m3s"] = (
            df["caudal_m3s"]
            .astype(str)
            .str.replace('"', '', regex=False)
            .str.strip()
            .replace("", None)
            .str.replace(",", ".", regex=False)
        )
        df["caudal_m3s"] = pd.to_numeric(df["caudal_m3s"], errors="coerce")

    df.to_csv(DATA_DIR / "saih_guadalquivir.csv", index=False, encoding="utf-8")
    print(f"  [OK] {len(df)} registros guardados")


def descarga_duero():
    base = "https://www.saihduero.es"
    print("DUERO ->", base)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
                  "image/avif,image/webp,*/*;q=0.8",
        "Referer": f"{base}/datos-tiempo-real/risr",
    }

    def obtener_estaciones(tipo="EA"):
        url = f"{base}/resultados-risr?q=&tipo={tipo}"
        r = requests.get(url, headers=headers, verify=False, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        filas = soup.select("table#table-estaciones-pagination tbody tr")
        estaciones = []
        for tr in filas:
            a = tr.find("a", href=True)
            if not a:
                continue
            codigo = a["href"].split("/")[-1]
            nombre = a.get_text(strip=True)
            estaciones.append({"codigo": codigo, "nombre": nombre})
        return estaciones

    def obtener_datos_caudal(codigo):
        url = f"{base}/risr/{codigo}"
        try:
            time.sleep(2)
            r = requests.get(url, headers=headers, verify=False, timeout=15)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "html.parser")

            h = soup.find(
                lambda tag: tag.name and tag.name.startswith("h")
                and "Datos en tiempo real" in tag.get_text()
            )
            if not h:
                return "N/D", "N/D"

            tabla = h.find_next("table")
            if not tabla:
                return "N/D", "N/D"

            for tr in tabla.find_all("tr"):
                celdas = tr.find_all("td")
                if len(celdas) < 3:
                    continue
                variable = celdas[0].get_text(strip=True)
                if variable.lower().startswith("caudal"):
                    caudal = celdas[1].get_text(strip=True) if len(celdas) > 1 else "N/D"
                    fecha_hora = celdas[2].get_text(strip=True) if len(celdas) > 2 else "N/D"
                    return caudal, fecha_hora

            return "N/D", "N/D"
        except requests.exceptions.Timeout:
            return "Error_timeout", "Error_timeout"
        except requests.exceptions.RequestException:
            return "Error_conexion", "Error_conexion"
        except Exception:
            return "Error_parseo", "Error_parseo"

    print("DUERO -> Obteniendo lista de estaciones...")
    estaciones = obtener_estaciones()
    print(f"DUERO -> {len(estaciones)} estaciones encontradas")

    ruta_csv = DATA_DIR / "saih_duero.csv"
    with open(ruta_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["codigo", "nombre", "caudal", "fecha_hora", "ts_descarga"])
        total = len(estaciones)
        for i, est in enumerate(estaciones, 1):
            if i % 10 == 0 or i == 1:
                print(f"DUERO -> Procesando estación {i}/{total}: {est['nombre']}")
            caudal, fecha_hora = obtener_datos_caudal(est["codigo"])
            w.writerow([
                est["codigo"], est["nombre"], caudal, fecha_hora,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ])

    print(f"DUERO -> Completado: {total} estaciones procesadas")


def descarga_mino_sil():
    print("MIÑO-SIL -> iniciando")
    driver = webdriver.Chrome(options=chrome_options())
    driver.set_page_load_timeout(30)
    filas = []
    try:
        driver.get("https://saih.chminosil.es/index.php?url=/datos/mapas/mapaH1/areaHID/acc1")

        enlace = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "div.boton_tabla a.icono_boton")
            )
        )
        enlace.click()

        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "table"))
        )

        tablas = driver.find_elements(By.CSS_SELECTOR, "table.tabla")
        for tabla in tablas:
            for tr in tabla.find_elements(By.TAG_NAME, "tr"):
                tds = tr.find_elements(By.TAG_NAME, "td")
                if len(tds) < 5:
                    continue

                unidad = tds[4].text.strip()
                if "m³/s" not in unidad and "m3/s" not in unidad:
                    continue

                fecha = tds[1].text.strip()
                if "/" not in fecha:
                    continue

                nombre = tds[0].text.strip()
                valor = tds[3].text.strip().replace(".", "").replace(",", ".")

                filas.append([nombre, fecha, valor, unidad])
    finally:
        driver.quit()

    ruta_csv = DATA_DIR / "saih_mino.csv"
    with open(ruta_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["nombre", "fecha", "valor", "unidad"])
        writer.writerows(filas)
    print(f"MIÑO-SIL -> {len(filas)} registros guardados")


def descarga_cantabrico():
    url = "https://visor.saichcantabrico.es/"
    print("CANTÁBRICO ->", url)
    driver = webdriver.Chrome(options=chrome_options())
    driver.set_page_load_timeout(30)
    wait = WebDriverWait(driver, 25)
    registros = []

    try:
        driver.get(url)

        try:
            btn_cookies = wait.until(
                EC.element_to_be_clickable(
                    ("xpath", "//button[contains(., 'Aceptar') or contains(., 'ACEPTAR')]")
                )
            )
            btn_cookies.click()
        except Exception:
            pass

        wait.until(
            EC.element_to_be_clickable(("css selector", "div#menu-caudal a#caudal"))
        ).click()

        wait.until(
            EC.element_to_be_clickable(("css selector", "div.icono-tabla"))
        ).click()

        wait.until(
            EC.presence_of_element_located(("css selector", "table#tabla-datos"))
        )
        wait.until(
            EC.presence_of_element_located(("css selector", "table#tabla-datos tbody tr"))
        )
        filas = driver.find_elements(By.CSS_SELECTOR, "table#tabla-datos tbody tr")
        print("filas capturadas:", len(filas))

        for fila in filas:
            celdas = fila.find_elements(By.TAG_NAME, "td")
            if len(celdas) < 8:
                continue

            def limpia(v):
                return "" if (v == "-" or not v) else v

            registros.append({
                "zona_hidrologica": celdas[0].text.strip(),
                "codigo": celdas[1].text.strip(),
                "rio": celdas[2].text.strip(),
                "estacion": celdas[3].text.strip(),
                "nivel_raw": limpia(celdas[4].text.strip()),
                "caudal_raw": limpia(celdas[5].text.strip()),
                "actualizacion": limpia(celdas[7].text.strip()),
            })
    finally:
        driver.quit()

    ruta = DATA_DIR / "saih_cantabrico.csv"
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["zona_hidrologica", "codigo", "rio", "estacion", "nivel_raw", "caudal_raw", "actualizacion"])
        writer.writeheader()
        writer.writerows(registros)

    print(f"CANTÁBRICO -> {len(registros)} registros guardados en {ruta}")


FUENTES = [
    ("JÚCAR", descarga_jucar),
    ("EBRO", descarga_ebro),
    ("SEGURA", descarga_segura),
    ("TAJO", descarga_tajo),
    ("GUADIANA", descarga_guadiana),
    ("GUADALQUIVIR", descarga_guadalquivir),
    ("DUERO", descarga_duero),
    ("MIÑO-SIL", descarga_mino_sil),
    ("CANTÁBRICO", descarga_cantabrico),
]


def main():
    for nombre, funcion in FUENTES:
        try:
            funcion()
        except Exception as e:
            print(f"[ERROR] Fallo al descargar {nombre}: {e}")
        print()


if __name__ == "__main__":
    main()
