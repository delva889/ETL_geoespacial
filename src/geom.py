import geopandas as gpd
import pandas as pd
import unicodedata
from rapidfuzz import process, fuzz
import subprocess
import psycopg2
import datetime

CSV_PATH = r"dataPH\embalses.csv"
INV_PATH = r"geometriaEmbalses.shp"
SALIDA   = r"dataPH\embalses_con_geom.gpkg"

PG_CONN = dict(
    host="localhost",
    port=5432,
    dbname="TIIG",
    user="postgres",
    password="TU_PASSWORD_AQUI",
)

df = pd.read_csv(CSV_PATH)
gdf_inv = gpd.read_file(INV_PATH)

def normaliza(s):
    s = str(s).upper().strip()
    s = ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )
    for txt in [" EMBALSE", " PANTANO", " PRESA", "(AZUD)"]:
        s = s.replace(txt, "")
    return s

df["nombre_norm"] = df["pantano"].apply(normaliza)
gdf_inv["nombre_norm"] = gdf_inv["NOMBRE"].apply(normaliza)

lista_inv = gdf_inv["nombre_norm"].unique().tolist()
matches = []
scores = []

for nom in df["nombre_norm"]:
    mejor, score, _ = process.extractOne(
        nom, lista_inv, scorer=fuzz.ratio
    )
    if score >= 60:
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

print("Filas totales en CSV:", len(df))
print("Filas con geometría que se guardan:", len(gdf_ok))

gdf_ok["timestamp"] = datetime.datetime.now()

columnas_finales = ["timestamp", "cuenca", "cuenca_norm", "pantano", "capacidad", "embalsada", "variacion", "geometry"]
gdf_final = gdf_ok[columnas_finales].copy()

gdf_final = gdf_final.rename_geometry("geom")

gdf_final.to_file(SALIDA, layer="embalses", driver="GPKG")
print(f"\nCapa guardada en: {SALIDA}")

import os
dashboard_path = r"dashboard\public\data.geojson"
try:
    gdf_web = gdf_final.to_crs(epsg=4326)
    gdf_web.to_file(dashboard_path, driver="GeoJSON")
    print(f"Capa exportada para el Dashboard web en: {dashboard_path}")
except Exception as e:
    print(f"[AVISO] No se pudo guardar el GeoJSON: {e}")

cmd = [
    r"C:\Program Files\QGIS 3.40.11\bin\ogr2ogr.exe",
    "-f", "PostgreSQL",
    f"PG:host={PG_CONN['host']} port={PG_CONN['port']} "
    f"dbname={PG_CONN['dbname']} user={PG_CONN['user']} password={PG_CONN['password']}",
    SALIDA,
    "-nln", "embalses_geom",
    "-overwrite",
    "-lco", "GEOMETRY_NAME=geom",
    "-select", "timestamp,cuenca,cuenca_norm,pantano,capacidad,embalsada,variacion,geom",  
]

subprocess.run(cmd, check=True)
print("Tabla embalses_geom actualizada en PostGIS.")

conn = psycopg2.connect(**PG_CONN)
cur = conn.cursor()

columnas_deseadas = ['fid', 'timestamp', 'cuenca', 'cuenca_norm', 'pantano', 'capacidad', 'embalsada', 'variacion', 'geom']

cur.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'embalses_geom' AND table_schema = 'public'
""")
columnas_existentes = [col[0] for col in cur.fetchall()]

columnas_a_eliminar = [col for col in columnas_existentes if col not in columnas_deseadas]

for col in columnas_a_eliminar:
    try:
        cur.execute(f"ALTER TABLE embalses_geom DROP COLUMN IF EXISTS {col} CASCADE")
        print(f"  Columna '{col}' eliminada")
    except Exception as e:
        print(f"  [AVISO] No se pudo eliminar columna '{col}': {e}")

conn.commit()
cur.close()
conn.close()

conn = psycopg2.connect(**PG_CONN)
cur = conn.cursor()
cur.execute("""
    UPDATE embalses_geom
    SET timestamp = NOW();
""")
conn.commit()
cur.close()
conn.close()
print("Columna timestamp actualizada en PostGIS a NOW().")
