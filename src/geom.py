import datetime
import subprocess

import geopandas as gpd
import pandas as pd
import psycopg2

from config import DATA_DIR, OGR2OGR_PATH, PG_CONN
from emparejamiento import mejor_candidato, prepara_inventario

CSV_PATH = DATA_DIR / "embalses.csv"
INV_PATH = "geometriaEmbalses.shp"
SALIDA = DATA_DIR / "embalses_con_geom.gpkg"

COLUMNAS_DESEADAS = ["fid", "timestamp", "cuenca", "cuenca_norm", "pantano", "capacidad", "embalsada", "variacion", "geom"]


def cruzar_geometrias():
    """Une cada embalse de embalses.net con su polígono del inventario del MITECO.

    El emparejamiento (nombre normalizado + demarcación + capacidad) vive en
    emparejamiento.py y es el mismo que usa corregir_geometrias.py.
    """
    df = pd.read_csv(CSV_PATH)
    gdf_inv = gpd.read_file(INV_PATH)
    inventario = prepara_inventario(gdf_inv)

    filas, revisar, sin_match = [], [], []
    usados = {}
    for _, fila in df.iterrows():
        cand = mejor_candidato(fila["pantano"], fila["cuenca"], fila.get("capacidad"), inventario)
        if cand is None:
            sin_match.append(fila["pantano"])
            continue
        idx, score, ratio, dudoso = cand
        if idx in usados:  # dos filas para el mismo polígono: se queda la que tiene lectura
            if pd.notna(fila.get("embalsada")) and pd.isna(filas[usados[idx]].get("embalsada")):
                filas[usados[idx]] = None
            else:
                continue
        registro = fila.to_dict()
        registro["geometry"] = gdf_inv.at[idx, "geometry"]
        registro["NOMBRE_INVENTARIO"] = gdf_inv.at[idx, "NOMBRE"]
        usados[idx] = len(filas)
        filas.append(registro)
        if dudoso:
            revisar.append((fila["pantano"], fila["cuenca"], gdf_inv.at[idx, "NOMBRE"], round(score), ratio))

    filas = [f for f in filas if f is not None]
    gdf_ok = gpd.GeoDataFrame(filas, geometry="geometry", crs=gdf_inv.crs)

    print("Filas totales en CSV:", len(df))
    print("Filas con geometría que se guardan:", len(gdf_ok))
    if sin_match:
        print(f"[AVISO] {len(sin_match)} embalses sin polígono fiable (no se publican): {', '.join(map(str, sin_match))}")
    if revisar:
        ruta = DATA_DIR / "geom_matches_revisar.csv"
        pd.DataFrame(revisar, columns=["pantano", "cuenca", "NOMBRE", "score", "ratio_capacidad"]).to_csv(ruta, index=False)
        print(f"[AVISO] {len(revisar)} emparejamientos aceptados con dudas guardados en {ruta}")

    gdf_ok["timestamp"] = datetime.datetime.now()
    columnas_finales = ["timestamp", "cuenca", "cuenca_norm", "pantano", "capacidad", "embalsada", "variacion", "geometry"]
    gdf_final = gdf_ok[[c for c in columnas_finales if c in gdf_ok.columns]].copy()
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
