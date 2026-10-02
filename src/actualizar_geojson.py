import json
import unicodedata
from datetime import datetime, timezone
import urllib.request
import pandas as pd
from config import DATA_DIR, REPO_ROOT

CSV_PATH = DATA_DIR / 'embalses.csv'
PUBLIC_DIR = REPO_ROOT / 'dashboard' / 'public'
GEOJSON_PATH = PUBLIC_DIR / 'data.geojson'
LAST_UPDATE_PATH = PUBLIC_DIR / 'last_update.json'


def normaliza(s):
    s = str(s).upper().strip()
    s = ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )
    for txt in [' EMBALSE', ' PANTANO', ' PRESA', '(AZUD)']:
        s = s.replace(txt, '')
    return s


def get_omie_price():
    d = datetime.now()
    url = f'https://www.omie.es/es/file-download?parents%5B0%5D=marginalpdbc&filename=marginalpdbc_{d.strftime("%Y%m%d")}.1'
    print("[INFO] Fetching OMIE:", url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        content = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        lines = content.split('\n')
        prices = []
        for line in lines[1:]:
            parts = line.split(';')
            if len(parts) >= 6:
                try:
                    prices.append(float(parts[4].replace(',', '.')))
                    prices.append(float(parts[5].replace(',', '.')))
                except ValueError:
                    pass
        if not prices: return 95.5
        return round(sum(prices) / len(prices), 2)
    except Exception as e:
        print("[ERROR] OMIE:", e)
        return 95.5


def main():
    if not CSV_PATH.exists():
        print(f'[ERROR] No se encuentra {CSV_PATH}')
        return
    if not GEOJSON_PATH.exists():
        print(f'[ERROR] No se encuentra {GEOJSON_PATH}')
        return

    print("[INFO] Cargando precios OMIE...")
    precio_omie = get_omie_price()
    print(f"[INFO] Precio OMIE (hoy): {precio_omie} EUR/MWh")

    df = pd.read_csv(CSV_PATH)
    frescos = {}
    for _, row in df.iterrows():
        nombre = normaliza(row.get('pantano', ''))
        cuenca = normaliza(row.get('cuenca', ''))
        clave = nombre + '|' + cuenca
        
        cap = row.get('capacidad', None)
        emb = row.get('embalsada', None)
        var = row.get('variacion', None)
        
        # Keep precision but convert strictly to floats if they are valid
        frescos[clave] = {
            'capacidad': cap if pd.notna(cap) else None,
            'embalsada': emb if pd.notna(emb) else 'NoData',
            'variacion': var if pd.notna(var) else 'NoData',
            'timestamp': row.get('timestamp')
        }

    geojson = json.loads(GEOJSON_PATH.read_text(encoding='utf-8'))
    
    total_geometrias = len(geojson.get('features', []))
    embalses_con_datos = 0
    
    for feature in geojson.get('features', []):
        props = feature.get('properties', {})
        clave = normaliza(props.get('pantano', '')) + '|' + normaliza(props.get('cuenca', ''))
        dato = frescos.get(clave)
        if not dato:
            continue

        if dato['capacidad'] is not None:
            props['capacidad'] = dato['capacidad']
            
        embalsada = dato['embalsada']
        if embalsada != 'NoData':
            props['embalsada'] = round(float(embalsada), 2)
            embalses_con_datos += 1
            
            # Recalculate metrics based on 109.0 constant
            props['mwh_conocidos'] = round(props['embalsada'] * 109.0, 2)
            props['precio_actual'] = round(props['mwh_conocidos'] * precio_omie, 2)
        else:
            props['embalsada'] = 'NoData'
            
        if props.get('capacidad'):
            props['mwh_max'] = round(float(props['capacidad']) * 109.0, 2)
            props['precio_max'] = round(props['mwh_max'] * precio_omie, 2)

        if dato['variacion'] != 'NoData':
            props['variacion'] = round(float(dato['variacion']), 2)
        
        if dato['timestamp'] is not None:
            props['timestamp'] = dato['timestamp']

        feature['properties'] = props

    GEOJSON_PATH.write_text(json.dumps(geojson, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f"[OK] {embalses_con_datos}/{total_geometrias} embalses cruzados en {GEOJSON_PATH}")

    estaciones_caudal = 0
    caudales_path = PUBLIC_DIR / 'caudales.json'
    if caudales_path.exists():
        try:
            estaciones_caudal = len(json.loads(caudales_path.read_text(encoding='utf-8')))
        except (json.JSONDecodeError, UnicodeDecodeError):
            estaciones_caudal = 0

    resumen = {
        'timestamp': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'total_geometrias': total_geometrias,
        'embalses_con_datos': embalses_con_datos,
        'embalses_sin_datos': total_geometrias - embalses_con_datos,
        'precio_omie_eur_mwh': precio_omie,
        'estaciones_caudal': estaciones_caudal,
    }
    LAST_UPDATE_PATH.write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"[OK] Resumen de actualización guardado en {LAST_UPDATE_PATH}")


if __name__ == '__main__':
    main()
