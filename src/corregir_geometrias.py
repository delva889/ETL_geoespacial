"""Revisa y corrige la geometría de cada embalse publicado en dashboard/public/data.geojson.

Vuelve a emparejar cada embalse con el inventario de geometrías del MITECO usando
`emparejamiento.py` (nombre normalizado + demarcación + capacidad) y:

- conserva la geometría si ya era la correcta;
- la sustituye si el polígono publicado pertenecía a otro embalse (en ese caso se borra
  también el enlace a la escena Sentinel-2, que se eligió con el polígono equivocado);
- retira el embalse del mapa si no hay ningún polígono fiable para él.

Escribe un informe CSV con cada decisión para poder revisarlas.

Uso:
    python corregir_geometrias.py ruta/a/geometriaEmbalses.shp [--informe docs/revision_geometrias.csv]
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import mapping, shape

from emparejamiento import mejor_candidato, normaliza_nombre, prepara_inventario

REPO_ROOT = Path(__file__).resolve().parent.parent
GEOJSON_PATH = REPO_ROOT / "dashboard" / "public" / "data.geojson"


def redondea(geom_dict: dict, dec: int = 5) -> dict:
    def r(c):
        return [r(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], dec), round(c[1], dec)]
    return {"type": geom_dict["type"], "coordinates": r(geom_dict["coordinates"])}


def a_multipoligono(g):
    return {"type": "MultiPolygon", "coordinates": [g["coordinates"]]} if g["type"] == "Polygon" else g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inventario", help="geometriaEmbalses.shp del MITECO")
    ap.add_argument("--informe", default=str(REPO_ROOT / "docs" / "revision_geometrias.csv"))
    ap.add_argument("--geojson", default=str(GEOJSON_PATH))
    args = ap.parse_args()

    inv = gpd.read_file(args.inventario).to_crs(4326)
    inv_lista = prepara_inventario(inv)
    sindex = inv.sindex

    datos = json.loads(Path(args.geojson).read_text(encoding="utf-8"))
    nuevas, informe = [], []
    usados: dict[int, dict] = {}

    for f in datos["features"]:
        p = f["properties"]
        actual = shape(f["geometry"])
        hit = list(sindex.query(actual.representative_point(), predicate="intersects"))
        idx_actual = inv.index[hit[0]] if hit else None

        cand = mejor_candidato(p.get("pantano"), p.get("cuenca"), p.get("capacidad"), inv_lista, preferido=idx_actual)
        fila = {
            "pantano": p.get("pantano"), "cuenca": p.get("cuenca"), "capacidad": p.get("capacidad"),
            "antes": inv.at[idx_actual, "NOMBRE"] if idx_actual is not None else "",
        }
        if cand is None:
            fila.update(decision="retirado", despues="", nombre_score="", ratio_capacidad="", revisar="")
            informe.append(fila)
            continue

        idx, ns, rc, revisar = cand
        fila.update(despues=inv.at[idx, "NOMBRE"], nombre_score=round(ns), ratio_capacidad="" if rc is None else round(rc, 2),
                    revisar="sí" if revisar else "")

        # Dos filas de embalses.net para el mismo polígono (p. ej. "Armiñan" y "Armiñán"): se queda la que tiene lectura
        if idx in usados:
            previa = usados[idx]
            lectura = lambda props: isinstance(props.get("embalsada"), (int, float))
            if lectura(p) and not lectura(previa["properties"]):
                nuevas.remove(previa)
                for r in informe:
                    if r.get("_feature") is previa:
                        r["decision"] = "duplicado"
            else:
                fila["decision"] = "duplicado"
                informe.append(fila)
                continue

        if idx == idx_actual:
            fila["decision"] = "correcta"
        else:
            geom = inv.loc[idx].geometry
            f["geometry"] = redondea(a_multipoligono(mapping(geom)))
            c = geom.representative_point()
            p["centroide"] = [round(c.y, 5), round(c.x, 5)]
            p["url_descarga"] = None  # la escena se eligió con el polígono equivocado
            fila["decision"] = "corregida"
        usados[idx] = f
        fila["_feature"] = f
        nuevas.append(f)
        informe.append(fila)

    datos["features"] = nuevas
    Path(args.geojson).write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    Path(args.informe).parent.mkdir(parents=True, exist_ok=True)
    with open(args.informe, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["decision", "revisar", "pantano", "cuenca", "capacidad", "antes", "despues", "nombre_score", "ratio_capacidad"])
        w.writeheader()
        for r in informe:
            r.pop("_feature", None)
        w.writerows(sorted(informe, key=lambda r: (r["decision"], str(r["cuenca"]), str(r["pantano"]))))

    from collections import Counter
    resumen = Counter(r["decision"] for r in informe)
    print(f"[OK] {len(nuevas)} embalses publicados. Decisiones: {dict(resumen)}")
    print(f"[OK] Informe en {args.informe}")


if __name__ == "__main__":
    main()
