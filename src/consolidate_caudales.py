import json
import math

import pandas as pd

from config import DATA_DIR, REPO_ROOT

OUTPUT_PATH = REPO_ROOT / "dashboard" / "public" / "caudales.json"


import re

def limpiar_nombre(nombre):
    if not nombre:
        return None
    nombre = str(nombre).strip()
    
    n_lower = nombre.lower()
    
    # Check for drops
    if n_lower.startswith('aportaci') or n_lower.startswith('nivel'):
        return None
        
    if n_lower.startswith('caudal'):
        if n_lower.startswith('caudal r'):
            nombre = re.sub(r'(?i)^caudal\s+', '', nombre)
        else:
            return None

    # Remove generic codes
    nombre = re.sub(r'^(?:EA\s+\d+|[A-Z]\d{2}\s+(?:CH|CR|EA)?)\s+', '', nombre, flags=re.IGNORECASE)
    nombre = re.sub(r'(?i)\bbde local\b', '', nombre).strip()
    
    # Capitalize
    nombre = ' '.join(word.capitalize() for word in nombre.split())
    
    return nombre

def to_float(v):


    try:
        if v is None:
            return None
        s = str(v).strip()
        if not s or s.upper() in ("N/D", "ND", "NODATA", "-", "NAN"):
            return None
        if s.upper().startswith("ERROR"):
            return None
        if "," in s and "." in s:
            s = s.replace(".", "").replace(",", ".")
        elif "," in s:
            s = s.replace(",", ".")
        f = float(s)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def desde_csv(nombre_archivo, cuenca, col_nombre, col_caudal):
    ruta = DATA_DIR / nombre_archivo
    if not ruta.exists():
        return []
    df = pd.read_csv(ruta)
    registros = []
    for _, row in df.iterrows():
        caudal = to_float(row.get(col_caudal))
        nombre = limpiar_nombre(row.get(col_nombre, ""))
        if caudal is None or not nombre or nombre.lower() == "nan":
            continue
        registros.append({"nombre": nombre, "cuenca": cuenca, "caudal": caudal})
    return registros


def desde_tajo():
    ruta = DATA_DIR / "saih_tajo.json"
    if not ruta.exists():
        return []
    contenido = json.loads(ruta.read_text(encoding="utf-8"))
    registros = []
    for item in contenido.get("data", []):
        caudal = to_float(item.get("valor"))
        nombre = limpiar_nombre(item.get("nombre", ""))
        if caudal is None or not nombre:
            continue
        registros.append({"nombre": nombre, "cuenca": "Tajo", "caudal": caudal})
    return registros


def desde_cantabrico():
    ruta = DATA_DIR / "saih_cantabrico.csv"
    if not ruta.exists():
        return []
    df = pd.read_csv(ruta)
    registros = []
    for _, row in df.iterrows():
        caudal = to_float(row.get("caudal_raw"))
        estacion = str(row.get("estacion", "")).strip()
        rio = str(row.get("rio", "")).strip()
        nombre = limpiar_nombre(f"{rio} - {estacion}".strip(" -") if rio and estacion else (estacion or rio))
        if caudal is None or not nombre or nombre.lower() == "nan":
            continue
        registros.append({"nombre": nombre, "cuenca": "Cantábrica", "caudal": caudal})
    return registros


def desde_json_generico(nombre_archivo, cuenca, claves_nombre, claves_caudal):
    ruta = DATA_DIR / nombre_archivo
    if not ruta.exists():
        return []
    try:
        contenido = json.loads(ruta.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return []

    registros = []
    vistos = set()

    def visitar(nodo):
        if isinstance(nodo, dict):
            nombre = None
            for k in claves_nombre:
                if k in nodo and nodo[k]:
                    nombre = limpiar_nombre(nodo[k])
                    break
            caudal = None
            for k in claves_caudal:
                if k in nodo:
                    caudal = to_float(nodo[k])
                    if caudal is not None:
                        break
            if nombre and caudal is not None:
                clave = (nombre, caudal)
                if clave not in vistos:
                    vistos.add(clave)
                    registros.append({"nombre": nombre, "cuenca": cuenca, "caudal": caudal})
            for v in nodo.values():
                visitar(v)
        elif isinstance(nodo, list):
            for v in nodo:
                visitar(v)

    visitar(contenido)
    return registros


def main():
    todos = []
    todos += desde_csv("saih_jucar.csv", "Júcar", "nombre", "caudal_m3s")
    todos += desde_csv("saih_guadalquivir.csv", "Guadalquivir", "nombre", "caudal_m3s")
    todos += desde_csv("saih_duero.csv", "Duero", "nombre", "caudal")
    todos += desde_csv("saih_mino.csv", "Miño-sil", "nombre", "valor")
    todos += desde_csv(
        "saih_segura.csv", "Segura", "descripcion", "valor"
    )
    todos += desde_tajo()
    todos += desde_cantabrico()
    todos += desde_json_generico(
        "saih_ebro.json", "Ebro",
        ["estacion", "nombre", "descripcion"],
        ["caudal", "valor", "dato", "ultimoValor"],
    )
    todos += desde_json_generico(
        "saih_guadiana.json", "Guadiana",
        ["estacion", "nombre", "descripcion"],
        ["caudal", "valor", "dato", "ultimoValor"],
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(todos, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[OK] {len(todos)} estaciones de caudal consolidadas en {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
