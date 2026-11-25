"""Emparejamiento entre los embalses de embalses.net y el inventario de geometrías del MITECO.

Las dos fuentes no comparten identificador, así que se combinan tres pruebas:

1. Nombre normalizado: sin tildes, sin palabras genéricas ni paréntesis y con el artículo
   delante ("SERENA, LA" -> "LA SERENA").
2. Demarcación: solo se buscan candidatos en la demarcación que corresponde a la cuenca
   de embalses.net (columna DEMARC del inventario).
3. Capacidad: el inventario trae la capacidad a nivel máximo normal (NMN_CAPAC). Si ambas
   fuentes la tienen, un emparejamiento con capacidades muy distintas se rechaza.

Si no hay un candidato fiable, el embalse se queda sin geometría: es preferible no
dibujarlo a dibujarlo en el sitio de otro.
"""
from __future__ import annotations

import math
import re
import unicodedata

from rapidfuzz import fuzz

# Cuenca tal como la publica embalses.net -> demarcaciones del inventario donde buscar
CUENCA_A_DEMARC = {
    "EBRO": ["EBRO"],
    "TAJO": ["TAJO"],
    "GUADALQUIVIR": ["GUADALQUIVIR"],
    "GUADIANA": ["GUADIANA"],
    "DUERO": ["DUERO"],
    "MINO-SIL": ["MIÑO-SIL"],
    "JUCAR": ["JUCAR"],
    "SEGURA": ["SEGURA"],
    "MED. ANDALUZA": ["CUENCAS MEDITERRANEAS ANDALUZAS"],
    "TINTO, ODIEL Y PIEDRAS": ["TINTO, ODIEL Y PIEDRAS"],
    "CANTABRICO OCCIDENTAL": ["CANTABRICO OCCIDENTAL"],
    "CANTABRICO ORIENTAL": ["CANTABRICO ORIENTAL"],
    "PAIS VASCO": ["CANTABRICO ORIENTAL"],
    "COSTA GALICIA": ["GALICIA-COSTA"],
    "GUADALETE BARBATE": ["GUADALETE Y BARBATE"],
    "CATALUNA INTERNA": ["CUENCAS INTERNAS DE CATALUÑA"],
}

PALABRAS_GENERICAS = r"\b(EMBALSE|PANTANO|PRESA|AZUD|BALSA|CONTRAEMBALSE|DE REGULACION)\b"
ARTICULOS = ("LA", "EL", "LOS", "LAS", "LO")

UMBRAL_NOMBRE_SIN_CAPACIDAD = 90   # sin capacidad para contrastar, el nombre debe ser casi idéntico
UMBRAL_NOMBRE_CON_CAPACIDAD = 75   # con capacidad coherente se admiten variantes de nombre
RATIO_CAPACIDAD_MIN = 0.35         # min(cap)/max(cap) por debajo de esto se descarta


def sin_tildes(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


ABREVIATURAS = {r"\bN[ªA]\.?\s*S[ªA]\.?": "NUESTRA SEÑORA", r"\bSTA\.?\s": "SANTA ", r"\bSTO\.?\s": "SANTO "}
CALIFICADORES = ("DIQUE", "CONTRAEMBALSE", "RTO", "BALSA", "AZUD", "DEPOSITO", "CANAL", "COLA")


def normaliza_nombre(s) -> str:
    s = str(s or "").upper().strip()
    for patron, sust in ABREVIATURAS.items():
        s = re.sub(patron, sust, s)
    s = sin_tildes(s)
    s = re.sub(r"\(.*?\)", " ", s)                 # "(BALSA)", "(AZUD)", "(Tajo - Tiétar)"...
    m = re.match(r"^(.*),\s*(LA|EL|LOS|LAS|LO)$", s)  # "SERENA, LA" -> "LA SERENA"
    if m:
        s = f"{m.group(2)} {m.group(1)}"
    s = re.sub(PALABRAS_GENERICAS, " ", s)
    s = re.sub(r"[-_/.,]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def variantes_nombre(s) -> list[str]:
    """Nombres alternativos: "Porma (Juan Benet)", "Tremp o Talarn", "Cáceres - Guadiloba"."""
    bruto = str(s or "")
    vs = {normaliza_nombre(bruto)}
    for interior in re.findall(r"\((.*?)\)", bruto):
        vs.add(normaliza_nombre(interior))
    for trozo in re.split(r"\s+[-/]\s+|\s+o\s+|\s*/\s*", re.sub(r"\(.*?\)", "", bruto)):
        if len(trozo.strip()) > 3:
            vs.add(normaliza_nombre(trozo))
    return [v for v in vs if v]


def es_calificado(nombre_inventario) -> bool:
    """Nombres del inventario como "FERNANDINA (CONTRAEMBALSE)" o "VALDECABALLEROS (DIQUE DE COLA)"."""
    dentro = " ".join(re.findall(r"\((.*?)\)", sin_tildes(str(nombre_inventario or "")).upper()))
    return any(c in dentro for c in CALIFICADORES)


def sin_articulo(s: str) -> str:
    partes = s.split(" ", 1)
    return partes[1] if len(partes) == 2 and partes[0] in ARTICULOS else s


def normaliza_cuenca(s) -> str:
    return sin_tildes(str(s or "")).upper().strip()


def capacidad_inventario(v) -> float | None:
    """NMN_CAPAC viene en hm³, salvo algunos registros guardados en m³."""
    try:
        v = float(v)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(v) or v <= 0:
        return None
    if v > 1e5:      # algunos registros vienen escalados por 10⁹ (p. ej. TERRADETS = 33 191 000 000)
        v = v / 1e9
    return v if v < 5000 else None   # ningún embalse español supera los ~3300 hm³


def puntuacion_nombre(a: str, b: str) -> float:
    a2, b2 = sin_articulo(a), sin_articulo(b)
    return max(fuzz.ratio(a, b), fuzz.token_sort_ratio(a, b), fuzz.ratio(a2, b2))


def ratio_capacidad(c1, c2) -> float | None:
    if not c1 or not c2:
        return None
    return min(c1, c2) / max(c1, c2)


def mejor_candidato(nombre: str, cuenca: str, capacidad, inventario: list[dict], preferido=None):
    """Devuelve (indice_inventario, nombre_score, ratio_cap, revisar) o None si no hay candidato fiable.

    `inventario` es una lista de dicts con: idx, nombre_norm, demarc, capacidad, presa, calificado.
    `preferido` es el índice que ya tenía el embalse: se conserva si sigue siendo válido y casi tan bueno.
    """
    variantes = variantes_nombre(nombre)
    demarcs = CUENCA_A_DEMARC.get(normaliza_cuenca(cuenca))
    try:
        cap = float(capacidad) if float(capacidad) > 0 else None
    except (TypeError, ValueError):
        cap = None

    def puntua(c):
        rc = ratio_capacidad(cap, c["capacidad"])
        ns = max(puntuacion_nombre(v, c["nombre_norm"]) for v in variantes)
        if rc is not None and rc >= 0.6:  # con capacidad coherente se admite un nombre contenido en el otro
            ns = max(ns, 0.95 * max(fuzz.token_set_ratio(v, c["nombre_norm"]) for v in variantes))
        return ns, rc

    def evaluar(candidatos):
        validos = []
        for c in candidatos:
            ns, rc = puntua(c)
            if ns < UMBRAL_NOMBRE_CON_CAPACIDAD:
                continue
            if rc is not None and rc < RATIO_CAPACIDAD_MIN:
                continue
            if rc is None and ns < UMBRAL_NOMBRE_SIN_CAPACIDAD:
                continue
            if rc is not None and rc < 0.6 and ns < 88:  # capacidad dudosa: el nombre tiene que ser muy parecido
                continue
            total = ns + (25 * rc if rc is not None else 0) + (3 if c["presa"] else 0) - (6 if c["calificado"] else 0)
            validos.append((total, c["idx"], ns, rc))
        return validos

    en_demarc = [c for c in inventario if demarcs and c["demarc"] in demarcs]
    validos = evaluar(en_demarc)
    revisar = False

    if not validos and en_demarc:
        # Nombre idéntico y único en la demarcación aunque las capacidades no cuadren: se acepta y se marca
        exactos = [c for c in en_demarc if any(c["nombre_norm"] == v for v in variantes)]
        if len(exactos) == 1:
            c = exactos[0]
            validos = [(100, c["idx"], 100, ratio_capacidad(cap, c["capacidad"]))]
            revisar = True

    if not validos and cap is not None:
        # Fuera de la demarcación solo con nombre casi idéntico y capacidad muy coherente
        validos = [v for v in evaluar(inventario) if v[2] >= UMBRAL_NOMBRE_SIN_CAPACIDAD and v[3] is not None and v[3] >= 0.6]
        revisar = bool(validos)

    if not validos and cap is None:
        # Sin capacidad ni candidato en la demarcación: solo un nombre idéntico y único en todo el inventario
        exactos = [c for c in inventario if any(c["nombre_norm"] == v for v in variantes)]
        if len(exactos) == 1:
            validos = [(100, exactos[0]["idx"], 100, None)]
            revisar = True

    if not validos:
        return None
    validos.sort(key=lambda v: -v[0])
    elegido = validos[0]
    if preferido is not None:
        actual = next((v for v in validos if v[1] == preferido), None)
        if actual and actual[0] >= elegido[0] - 5:
            elegido = actual
    _, idx, ns, rc = elegido
    return idx, ns, rc, revisar


def prepara_inventario(gdf) -> list[dict]:
    """Convierte el GeoDataFrame del inventario en la lista que usa `mejor_candidato`."""
    salida = []
    for idx, fila in gdf.iterrows():
        salida.append({
            "idx": idx,
            "nombre_norm": normaliza_nombre(fila.get("NOMBRE")),
            "demarc": str(fila.get("DEMARC") or "").split("\n")[0].strip().upper(),
            "capacidad": capacidad_inventario(fila.get("NMN_CAPAC")),
            "presa": str(fila.get("TIPO_EMBAL") or "").lower().endswith("presa"),
            "calificado": es_calificado(fila.get("NOMBRE")),
        })
    return salida
