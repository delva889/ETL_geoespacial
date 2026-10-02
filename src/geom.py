import datetime
import subprocess
import unicodedata

import geopandas as gpd
import pandas as pd
import psycopg2
from rapidfuzz import fuzz, process

from config import DATA_DIR, OGR2OGR_PATH, PG_CONN

CSV_PATH = DATA_DIR / "embalses.csv"
INV_PATH = "geometriaEmbalses.shp"
SALIDA = DATA_DIR / "embalses_con_geom.gpkg"

COLUMNAS_DESEADAS = ["fid", "timestamp", "cuenca", "cuenca_norm", "pantano", "capacidad", "embalsada", "variacion", "geom"]


def normaliza(s):
    s = str(s).upper().strip()
    s = ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )
    for txt in [" EMBALSE", " PANTANO", " PRESA", "(AZUD)"]:
        s = s.replace(txt, "")
    return s


COLUMNAS_CUENCA_INV = ["CUENCA", "CUENCA_NOR", "DEMARCACIO", "DEMARCACION", "ORGANISMO", "PROVINCIA"]

BBOX_ESPANA_PENINSULAR = {"lat_min": 35.8, "lat_max": 43.9, "lon_min": -9.6, "lon_max": 4.4}

UMBRAL_MATCH = 60
UMBRAL_MATCH_CONFIABLE = 85
UMBRAL_MATCH_CUENCA = 70


def _cuencas_equivalentes(cuenca_csv, valores_inv_unicos, cache):
    if cuenca_csv in cache:
        return cache[cuenca_csv]
    aceptados = set()
    for valor_inv in valores_inv_unicos:
        score = max(
            fuzz.token_set_ratio(cuenca_csv, valor_inv),
            fuzz.partial_ratio(cuenca_csv, valor_inv),
        )
        if score >= UMBRAL_MATCH_CUENCA:
            aceptados.add(valor_inv)
    cache[cuenca_csv] = aceptados
    return aceptados


def _dentro_de_espana(geom):
    if geom is None or geom.is_empty:
        return False
    c = geom.centroid
    b = BBOX_ESPANA_PENINSULAR
    return b["lat_min"] <= c.y <= b["lat_max"] and b["lon_min"] <= c.x <= b["lon_max"]


def cruzar_geometrias():
    df = pd.read_csv(CSV_PATH)
    gdf_inv = gpd.read_file(INV_PATH)

    df["nombre_norm"] = df["pantano"].apply(normaliza)
    df["cuenca_norm_match"] = df["cuenca"].apply(normaliza)
    gdf_inv["nombre_norm"] = gdf_inv["NOMBRE"].apply(normaliza)

    columna_cuenca_inv = next((c for c in COLUMNAS_CUENCA_INV if c in gdf_inv.columns), None)
    if columna_cuenca_inv:
        gdf_inv["cuenca_norm_inv"] = gdf_inv[columna_cuenca_inv].apply(normaliza)
        print(f"Usando columna '{columna_cuenca_inv}' del inventario para restringir candidatos a la misma cuenca.")
    else:
        print("[AVISO] El inventario no tiene una columna de cuenca/provincia reconocible; "
              "se usará solo el filtro de bounding box como salvaguarda.")

    matches = []
    scores = []
    cache_cuencas_equivalentes = {}
    valores_inv_unicos = gdf_inv["cuenca_norm_inv"].unique().tolist() if columna_cuenca_inv else []

    for _, fila in df.iterrows():
        nom = fila["nombre_norm"]
        candidatos = gdf_inv
        if columna_cuenca_inv:
            cuencas_aceptadas = _cuencas_equivalentes(
                fila["cuenca_norm_match"], valores_inv_unicos, cache_cuencas_equivalentes
            )
            mismo_cuenca = gdf_inv[gdf_inv["cuenca_norm_inv"].isin(cuencas_aceptadas)]
            if len(mismo_cuenca) > 0:
                candidatos = mismo_cuenca

        lista_candidatos = candidatos["nombre_norm"].unique().tolist()
        if not lista_candidatos:
            matches.append(None)
            scores.append(0)
            continue

        mejor, score, _ = process.extractOne(nom, lista_candidatos, scorer=fuzz.ratio)
        if score >= UMBRAL_MATCH:
            matches.append(mejor)
            scores.append(score)
        else:
            matches.append(None)
            scores.append(score)

    df["match_norm"] = matches
    df["score_match"] = scores

    gdf_join = df.merge(
        gdf_inv[["nombre_norm", "geometry", "NOMBRE"]],
        left_on="match_norm",
        right_on="nombre_norm",
        how="left"
    )
    gdf_join = gpd.GeoDataFrame(gdf_join, geometry="geometry", crs=gdf_inv.crs)

    gdf_ok = gdf_join[gdf_join["geometry"].notna()].copy()

    dentro = gdf_ok["geometry"].apply(_dentro_de_espana)
    gdf_fuera = gdf_ok[~dentro]
    gdf_ok = gdf_ok[dentro].copy()

    gdf_dudosos = gdf_ok[gdf_ok["score_match"] < UMBRAL_MATCH_CONFIABLE]

    print("Filas totales en CSV:", len(df))
    print("Filas con geometría que se guardan:", len(gdf_ok))
    if len(gdf_fuera) > 0:
        print(f"[AVISO] {len(gdf_fuera)} emparejamientos descartados por caer fuera de España (revisar manualmente):")
        for _, r in gdf_fuera.iterrows():
            print(f"    {r['pantano']!r} ({r['cuenca']}) -> emparejado con {r['NOMBRE']!r}, score={r['score_match']}")
    if len(gdf_dudosos) > 0:
        ruta_dudosos = DATA_DIR / "geom_matches_dudosos.csv"
        gdf_dudosos[["pantano", "cuenca", "NOMBRE", "score_match"]].to_csv(ruta_dudosos, index=False)
        print(f"[AVISO] {len(gdf_dudosos)} emparejamientos con score < {UMBRAL_MATCH_CONFIABLE} guardados en "
              f"{ruta_dudosos} para revisión manual (se publican igualmente, pero conviene verificarlos).")

    gdf_ok["timestamp"] = datetime.datetime.now()

    columnas_finales = ["timestamp", "cuenca", "cuenca_norm", "pantano", "capacidad", "embalsada", "variacion", "geometry"]
    gdf_final = gdf_ok[columnas_finales].copy()
    gdf_final = gdf_final.rename_geometry("geom")

    gdf_final.to_file(SALIDA, layer="embalses", driver="GPKG")
    print(f"\nCapa guardada en: {SALIDA}")


def exportar_a_postgis():
    cmd = [
        OGR2OGR_PATH,
        "-f", "PostgreSQL",
        f"PG:host={PG_CONN['host']} port={PG_CONN['port']} "
        f"dbname={PG_CONN['dbname']} user={PG_CONN['user']} password={PG_CONN['password']}",
        str(SALIDA),
        "-nln", "embalses_geom",
        "-overwrite",
        "-lco", "GEOMETRY_NAME=geom",
        "-select", "timestamp,cuenca,cuenca_norm,pantano,capacidad,embalsada,variacion,geom",
    ]
    subprocess.run(cmd, check=True)
    print("Tabla embalses_geom actualizada en PostGIS.")


def limpiar_columnas_sobrantes():
    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()

    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'embalses_geom' AND table_schema = 'public'
    """)
    columnas_existentes = [col[0] for col in cur.fetchall()]
    columnas_a_eliminar = [col for col in columnas_existentes if col not in COLUMNAS_DESEADAS]

    for col in columnas_a_eliminar:
        try:
            cur.execute(f"ALTER TABLE embalses_geom DROP COLUMN IF EXISTS {col} CASCADE")
            print(f"  Columna '{col}' eliminada")
        except Exception as e:
            print(f"  [AVISO] No se pudo eliminar columna '{col}': {e}")

    conn.commit()
    cur.close()
    conn.close()


def actualizar_timestamp():
    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()
    cur.execute("UPDATE embalses_geom SET timestamp = NOW();")
    conn.commit()
    cur.close()
    conn.close()
    print("Columna timestamp actualizada en PostGIS a NOW().")


def main():
    cruzar_geometrias()
    exportar_a_postgis()
    limpiar_columnas_sobrantes()
    actualizar_timestamp()


if __name__ == "__main__":
    main()
