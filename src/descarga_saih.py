import requests
import os
from bs4 import BeautifulSoup
import pandas as pd
import csv
from datetime import datetime
import json
from pathlib import Path
from urllib.parse import urljoin
import re
import urllib3
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

url_jucar = "https://saih.chj.es/aforos"
print("JÃšCAR ->", url_jucar)
resp_jucar = requests.get(url_jucar)
resp_jucar.raise_for_status()

ruta_jucar = r"dataPH\saih_jucar.html"

with open(ruta_jucar, "wb") as f:
    f.write(resp_jucar.content)

with open(ruta_jucar, "rb") as f:
    html_jucar = f.read()

soup_jucar = BeautifulSoup(html_jucar, "html.parser") 
rows = soup_jucar.find_all("tr")

datosJucar = []
for row in rows[1:]:  
    cols = [td.get_text(strip=True) for td in row.find_all("td")]
    if len(cols) < 7:
        continue  

    nombre = cols[0] if cols[0] else ""          
    caudal = cols[2] if len(cols) > 2 and cols[2] else ""  
    hora   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")   

    if nombre:  
        datosJucar.append((nombre, caudal, hora))

df_jucar = pd.DataFrame(datosJucar, columns=["nombre", "caudal_m3s", "hora"])
df_jucar["id"] = range(1, len(df_jucar) + 1)
df_jucar["caudal_m3s"] = (
    df_jucar["caudal_m3s"]
      .astype(str)
      .str.replace('"', '', regex=False)   
      .str.strip()                         
      .replace("", None)                   
      .str.replace(",", ".", regex=False)  
)

df_jucar["caudal_m3s"] = pd.to_numeric(df_jucar["caudal_m3s"], errors='coerce')

df_jucar.to_csv(r"dataPH\saih_jucar.csv",
          index=False, encoding="utf-8")

url_ebro = "https://www.saihebro.com/api/mapa/getTablaCajetinesOrdenada?slug=mapa-aforos-HG-toda-la-cuenca&columna=estacion&orden=desc"
print("EBRO ->", url_ebro)
resp_ebro = requests.get(url_ebro, verify=False)
resp_ebro.raise_for_status()

with open(r"dataPH\saih_ebro.json", "w", encoding="utf-8") as f:
    f.write(resp_ebro.text)

urls_segura = [ "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=04L01&zona=*",
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
                "https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=07C07&zona=*"

              ]
registros_caudales = []
for url in urls_segura: 
    print("SEGURA ->", url)
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
    except Exception as e:
        print(f"  [ERROR] Error al obtener {url}: {e}")
        continue

    soup = BeautifulSoup(r.text, "html.parser")

    csv_hidden = soup.find("input", {"id": "csv"})
    if not csv_hidden:
        print("  [AVISO] No se encontrÃ³ input id=csv en", url)
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

        registros_caudales.append({
            "codigo": codigo,
            "descripcion": descripcion,
            "fecha": fecha,
            "valor": valor,
            "uds": uds,
            "url": url,
        })

salida_segura = r"dataPH\saih_segura.csv"

with open(salida_segura, "w", newline="", encoding="utf-8") as f:
    campos = ["codigo", "descripcion", "fecha", "valor", "uds", "url"]
    writer = csv.DictWriter(f, fieldnames=campos)
    writer.writeheader()
    writer.writerows(registros_caudales)

url_tajo = ["https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhR2fDEEEkMGI0AJBueEw5XIzwSsSEJ90pAnO9H1Jo%2F4drbHPYzyg%2B4Ba9wFrvPNJW7rtEmT4KbOb%2Bl8sbAkMu7M%3D",
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
            "https://saihtajo.chtajo.es/index.php?w=get-estacion&x=%2F4ZGs%2B6M%2BZWfvq6%2FyxpbhTTuRIWWLIIMMtflYUWlvfgBXUi5NrP5j0CWkkdeCg9yOx1SEk7A%2BxYGKxcKO%2BEVmJqM%2B4vZGAjRLYpfGFmARyk%3D"            
            ]
salida = {
    "fuente": "SAIH_TAJO",
    "hora_descarga": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": []          
}

for url in url_tajo:
    print("TAJO ->", url)
    try:
        r = requests.get(url, verify=False, timeout=10)
        r.raise_for_status()
        resp_data = r.json()
        
        if "response" not in resp_data:
            print(f"  [AVISO] No se encontrÃ³ 'response' en la respuesta")
            continue
            
        resp = resp_data["response"]
        
        if "senales" not in resp:
            print(f"  [AVISO] No se encontrÃ³ 'senales' en la respuesta")
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
                
            registro = {
                "id": s.get("tag", ""),
                "nombre": s.get("nombre", ""),
                "valor": last.get("valor") if last.get("valor") is not None else "",
                "fecha": last.get("tiempo") if last.get("tiempo") else ""
            }
            salida["data"].append(registro)
    except Exception as e:
        print(f"  [ERROR] Error al procesar {url}: {e}")
        continue

with open(
    r"dataPH\saih_tajo.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(salida, f, ensure_ascii=False, indent=2)

def obtener_token_guadiana():
    """Obtiene un token JWT vÃ¡lido desde la pÃ¡gina principal de siraguadiana.com"""
    try:
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

        options = Options()
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        caps = DesiredCapabilities.CHROME
        caps['goog:loggingPrefs'] = {'performance': 'ALL'}
        options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
        
        driver_guadiana = webdriver.Chrome(options=options)
        print("  [INFO] Abriendo navegador para obtener token...")

        driver_guadiana.get("https://www.siraguadiana.com/")

        time.sleep(5)

        try:
            driver_guadiana.get_log('performance')
        except:
            pass

        token = driver_guadiana.execute_script("""
            return localStorage.getItem('authjwt') || 
                   sessionStorage.getItem('authjwt') ||
                   localStorage.getItem('token') ||
                   sessionStorage.getItem('token') ||
                   localStorage.getItem('jwt') ||
                   sessionStorage.getItem('jwt');
        """)

        if not token or not (len(token) > 50 and token.count('.') == 2):
            print("  [INFO] Haciendo peticiÃ³n real para capturar token...")
            
            time.sleep(3)

            try:
                driver_guadiana.get_log('performance')
            except:
                pass

            driver_guadiana.execute_script("""
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
            logs = driver_guadiana.get_log('performance')

            for log in logs:
                try:
                    log_message = log.get('message', '')
                    if not log_message:
                        continue
                    
                    message_data = json.loads(log_message)
                    message = message_data.get('message', {})
                    method = message.get('method', '')
                    params = message.get('params', {})

                    if method == 'Network.requestWillBeSent':
                        request = params.get('request', {})
                        url_request = request.get('url', '')

                        if 'resourceByID' in url_request:
                            headers = request.get('headers', {})

                            for header_name, header_value in headers.items():
                                header_lower = header_name.lower()
                                
                                if header_lower == 'authjwt' or header_lower == 'auth-jwt':
                                    if header_value and len(str(header_value)) > 50:
                                        token = str(header_value).strip()
                                        if token and len(token) > 50 and token.count('.') == 2:
                                            print(f"  [OK] Token encontrado en header: {header_name}")
                                            break
                                
                                elif header_lower == 'authorization' and 'bearer' in str(header_value).lower():
                                    token_candidate = str(header_value).split(' ')[-1] if ' ' in str(header_value) else str(header_value)
                                    if token_candidate and len(token_candidate) > 50 and token_candidate.count('.') == 2:
                                        token = token_candidate
                                        print(f"  [OK] Token encontrado en header: {header_name}")
                                        break
                            
                            if token:
                                break
                except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
                    continue
        except Exception as e:
            print(f"  [AVISO] Error al leer logs de performance: {e}")

        if not token:
            try:
                cookies = driver_guadiana.get_cookies()
                for cookie in cookies:
                    name_lower = cookie.get('name', '').lower()
                    if 'jwt' in name_lower or 'token' in name_lower or 'auth' in name_lower:
                        token_candidate = cookie.get('value')
                        if token_candidate and len(token_candidate) > 50 and token_candidate.count('.') == 2:
                            token = token_candidate
                            print(f"  [OK] Token encontrado en cookie: {cookie.get('name')}")
                            break
            except:
                pass

        if not token:
            try:
                token = driver_guadiana.execute_script("""
                    return localStorage.getItem('authjwt') || 
                           sessionStorage.getItem('authjwt') ||
                           localStorage.getItem('token') ||
                           sessionStorage.getItem('token') ||
                           localStorage.getItem('jwt') ||
                           sessionStorage.getItem('jwt');
                """)
                if token and len(token) > 50 and token.count('.') == 2:
                    print(f"  [OK] Token encontrado en storage")
            except:
                pass
        
        driver_guadiana.quit()
        
        if token and len(token) > 50 and token.count('.') == 2:
            print(f"  [OK] Token JWT obtenido automÃ¡ticamente (longitud: {len(token)})")
            return token
        else:
            print("  [AVISO] No se pudo obtener un token vÃ¡lido automÃ¡ticamente.")
            return None
    except Exception as e:
        print(f"  [ERROR] Error al obtener token automÃ¡ticamente: {e}")
        import traceback
        traceback.print_exc()
        return None

url = "https://siraguadiana.com/backend/Visor/resourceByID"
print("GUADIANA ->", url)

token_jwt = None
max_intentos = 3
for intento in range(1, max_intentos + 1):
    print(f"  [INFO] Intento {intento}/{max_intentos} de obtener token...")
    token_jwt = obtener_token_guadiana()
    
    if token_jwt and token_jwt.count('.') == 2:
        
        payload_test = {"id": "CR", "type": "ficha_redes_control"}
        headers_test = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
            "authjwt": token_jwt,  
            "Origin": "https://www.siraguadiana.com",
            "Referer": "https://www.siraguadiana.com/"
        }
        try:
            resp_test = requests.post(url, json=payload_test, headers=headers_test, verify=False, timeout=10)
            resp_test_json = resp_test.json()
            if resp_test_json.get("status") != "false" and "error" not in resp_test_json:
                print(f"  [OK] Token verificado y funcionando correctamente")
                break
            else:
                error_msg = resp_test_json.get('error', 'Error desconocido')
                print(f"  [AVISO] Token obtenido pero no vÃ¡lido: {error_msg}")
                token_jwt = None
        except Exception as e:
            print(f"  [AVISO] Error al verificar token: {e}")
            token_jwt = None
    
    if token_jwt:
        break
    
    if intento < max_intentos:
        print(f"  [INFO] Esperando 3 segundos antes del siguiente intento...")
        time.sleep(3)

if not token_jwt:
    token_jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwdWJsaWMiLCJzZ2kiOjAsInRva2VuX3R5cGUiOiJhY2Nlc3MiLCJyZWZyZXNoIjoiZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LmV5SnpkV0lpT2lKd2RXSnNhV01pTENKeloya2lPakFzSW5SdmEyVnVYM1I1Y0dVaU9pSnlaV1p5WlhOb0lpd2laWGh3SWpveE56WTVNREkzTlRrd0xDSnBZWFFpT2pFM05qZzVOREV4T1RBc0ltcDBhU0k2SWpJM1JVWkdRVU13TUVNeU4wUkJPVEJETURSQkluMC5MTVFKZkM3ejNWVzRySmlMbFNhNGY1YjVMMHlMaXMxbEd0TGZBLXU4YV9rIiwiZXhwIjoxNzY5MDI3NTkwLCJpYXQiOjE3Njg5NDExOTAsImp0aSI6IkFENjIxRDUyODFBMDYzNzU4OTY4In0.6zVld1ocbQgAUi-kVIa9AH-h5YpVd9Ri8Uy2ihpqy6Q"
    print("  [AVISO] Usando token por defecto (puede estar expirado)")
    
    if token_jwt and token_jwt.count('.') == 2:
        payload_test = {"id": "CR", "type": "ficha_redes_control"}
        headers_test = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
            "authjwt": token_jwt,  
            "Origin": "https://www.siraguadiana.com",
            "Referer": "https://www.siraguadiana.com/"
        }
        try:
            resp_test = requests.post(url, json=payload_test, headers=headers_test, verify=False, timeout=10)
            resp_test_json = resp_test.json()
            if resp_test_json.get("status") == "false" or "error" in resp_test_json:
                error_msg = resp_test_json.get('error', 'Error desconocido')
                print(f"  [ERROR] El token por defecto no es vÃ¡lido: {error_msg}")
                print(f"  [INFO] El script intentarÃ¡ usar el token de todas formas, pero puede fallar")
        except Exception as e:
            print(f"  [AVISO] No se pudo verificar el token por defecto: {e}")

if token_jwt and token_jwt.count('.') == 2:
    print(f"  [INFO] Token JWT vÃ¡lido (formato correcto, longitud: {len(token_jwt)} caracteres)")
else:
    print(f"  [ERROR] El token no tiene formato JWT correcto (debe tener 3 partes separadas por puntos)")
    if token_jwt:
        print(f"  [DEBUG] Token recibido: {token_jwt[:50]}... (longitud: {len(token_jwt)})")

payload = {
    "id": "CR",
    "type": "ficha_redes_control"
}

headers_variants = [
    {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "authjwt": token_jwt,  
        "Origin": "https://www.siraguadiana.com",
        "Referer": "https://www.siraguadiana.com/"
    },
    {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Authjwt": token_jwt,  
        "Origin": "https://www.siraguadiana.com",
        "Referer": "https://www.siraguadiana.com/"
    },
    {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Authorization": f"Bearer {token_jwt}",
        "Origin": "https://www.siraguadiana.com",
        "Referer": "https://www.siraguadiana.com/"
    }
]

headers = headers_variants[0]  

resp = None

for idx, header_variant in enumerate(headers_variants):
    try:
        header_name = [k for k in header_variant.keys() if k.lower() in ['authjwt', 'authorization']][0] if any(k.lower() in ['authjwt', 'authorization'] for k in header_variant.keys()) else 'unknown'
        print(f"  [INFO] Intentando peticiÃ³n con header: {header_name}")
        resp = requests.post(url, json=payload, headers=header_variant, verify=False, timeout=30)
        resp.raise_for_status()

        try:
            resp_json = resp.json()
            if resp_json.get("status") != "false" and "error" not in resp_json:
                print(f"  [OK] PeticiÃ³n exitosa con header: {header_name}")
                break
            else:
                error_msg = resp_json.get('error', 'Error desconocido')
                print(f"  [AVISO] PeticiÃ³n con {header_name} fallÃ³: {error_msg}")
                resp = None
        except json.JSONDecodeError:
            print(f"  [AVISO] Respuesta no es JSON vÃ¡lido con {header_name}")
            resp = None
    except requests.exceptions.RequestException as e:
        print(f"  [AVISO] Error de conexiÃ³n con {header_name}: {e}")
        resp = None
        continue

if resp is None:
    try:
        print(f"  [INFO] Ãšltimo intento con header authjwt (minÃºsculas)...")
        resp = requests.post(url, json=payload, headers=headers_variants[0], verify=False, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"  [ERROR] No se pudo realizar la peticiÃ³n: {e}")
        resp = None

if resp:
    
    try:
        resp_json = resp.json()

        if resp_json.get("status") == "false" or "error" in resp_json:
            error_msg = resp_json.get('error', 'Error desconocido')
            print(f"  [ERROR] Error en la respuesta de Guadiana: {error_msg}")
            if "permisos" in error_msg.lower() or "token" in error_msg.lower() or "expirado" in error_msg.lower():
                print("  [INFO] El token JWT ha expirado o no tiene permisos.")
                print("  [SOLUCIÃ“N] El script intentarÃ¡ obtener un nuevo token automÃ¡ticamente en la prÃ³xima ejecuciÃ³n.")
                print("  [MANUAL] Si el problema persiste, obtÃ©n un token nuevo:")
                print("           1. Abre https://www.siraguadiana.com/ en Chrome")
                print("           2. Abre DevTools (F12) â†’ Network")
                print("           3. Recarga la pÃ¡gina y busca una peticiÃ³n a 'resourceByID'")
                print("           4. Copia el valor del header 'authjwt' (en minÃºsculas)")
                print("           5. ReemplÃ¡zalo en la lÃ­nea 462 del archivo descarga_saih.py")
                print(f"  [DEBUG] Token actual usado (primeros 50 caracteres): {token_jwt[:50]}...")
        else:
            
            if "ult_res" in resp_json and "valores" in resp_json["ult_res"]:
                num_registros = len(resp_json["ult_res"]["valores"])
                print(f"  [OK] Guadiana: {num_registros} registros obtenidos correctamente")
            else:
                print("  [AVISO] La respuesta no contiene datos esperados")
                print(f"  [DEBUG] Claves en respuesta: {list(resp_json.keys())}")
    except json.JSONDecodeError:
        print(f"  [ERROR] La respuesta no es JSON vÃ¡lido. Status code: {resp.status_code}")
        print(f"  [DEBUG] Primeros 500 caracteres de la respuesta: {resp.text[:500]}")
    except Exception as e:
        print(f"  [ERROR] Error al procesar respuesta: {e}")
        if resp:
            print(f"  [DEBUG] Status code: {resp.status_code}")
            print(f"  [DEBUG] Respuesta: {resp.text[:500]}")
else:
    print(f"  [ERROR] No se recibiÃ³ respuesta del servidor")
    print(f"  [INFO] Verifica que el token JWT sea vÃ¡lido y no estÃ© expirado")
    print(f"  [INFO] Token usado (primeros 50 caracteres): {token_jwt[:50] if token_jwt else 'N/A'}...")

salida = r"dataPH\saih_guadiana.json"
if resp is not None:
    try:
        with open(salida, "wb") as f:
            f.write(resp.content)
        print(f"  [INFO] Respuesta guardada en {salida}")
    except Exception as e:
        print(f"  [ERROR] No se pudo guardar la respuesta: {e}")
else:
    print(f"  [ERROR] No se recibiÃ³ respuesta del servidor")

url_guadalquivir = "https://www.chguadalquivir.es/saih/"
print("GUADALQUIVIR ->", url_guadalquivir)

resp_guadalquivir = requests.get(url_guadalquivir, verify=False)  
resp_guadalquivir.raise_for_status()

html_guadalquivir = resp_guadalquivir.content
soup = BeautifulSoup(html_guadalquivir, "html.parser")

tabla_caudal = soup.find("table", id="ContentPlaceHolder1_GVcaudal")
if not tabla_caudal:
    print("  [ERROR] No se encontrÃ³ la tabla de caudales")
    datos_guadalquivir = []
else:
    rows = tabla_caudal.find_all("tr")
    datos_guadalquivir = []

    for row in rows[1:]:  
        cols = [td.get_text(strip=True) for td in row.find_all("td")]

        if len(cols) < 5:
            continue

        nombre = cols[0] if cols[0] else ""        
        caudal = cols[2] if len(cols) > 2 and cols[2] else ""        
        hora   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if nombre:  
            datos_guadalquivir.append((nombre, caudal, hora))

df_guadalquivir = pd.DataFrame(
    datos_guadalquivir,
    columns=["nombre", "caudal_m3s", "hora"]
)

if len(df_guadalquivir) > 0:
    df_guadalquivir["caudal_m3s"] = (
        df_guadalquivir["caudal_m3s"]
          .astype(str)
          .str.replace('"', '', regex=False)
          .str.strip()
          .replace("", None)
          .str.replace(",", ".", regex=False)
    )
    
    df_guadalquivir["caudal_m3s"] = pd.to_numeric(df_guadalquivir["caudal_m3s"], errors='coerce')

df_guadalquivir.to_csv(
    r"dataPH\saih_guadalquivir.csv",
    index=False,
    encoding="utf-8"
)

BASE = "https://www.saihduero.es"
print("DUERO ->", BASE)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
              "image/avif,image/webp,*/*;q=0.8",
    "Referer": f"{BASE}/datos-tiempo-real/risr",
}

def obtener_estaciones(tipo="EA"):
    url = f"{BASE}/resultados-risr?q=&tipo={tipo}"
    r = requests.get(url, headers=HEADERS, verify=False, timeout=15)
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
    url = f"{BASE}/risr/{codigo}"
    try:
        time.sleep(2)  
        r = requests.get(url, headers=HEADERS, verify=False, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        caudal = "N/D"
        fecha_hora = "N/D"

        h = soup.find(
            lambda tag: tag.name and tag.name.startswith("h")
            and "Datos en tiempo real" in tag.get_text()
        )
        if not h:
            return caudal, fecha_hora

        tabla = h.find_next("table")
        if not tabla:
            return caudal, fecha_hora

        for tr in tabla.find_all("tr"):
            celdas = tr.find_all("td")
            if len(celdas) < 3:
                continue
            variable = celdas[0].get_text(strip=True)
            if variable.lower().startswith("caudal"):
                caudal = celdas[1].get_text(strip=True) if len(celdas) > 1 else "N/D"
                fecha_hora = celdas[2].get_text(strip=True) if len(celdas) > 2 else "N/D"
                break

        return caudal, fecha_hora

    except requests.exceptions.Timeout:
        return "Error_timeout", "Error_timeout"
    except requests.exceptions.RequestException:
        return "Error_conexion", "Error_conexion"
    except Exception:
        return "Error_parseo", "Error_parseo"

def main():
    print("DUERO -> Obteniendo lista de estaciones...")
    estaciones = obtener_estaciones()
    print(f"DUERO -> {len(estaciones)} estaciones encontradas")

    ruta_csv = r"dataPH\saih_duero.csv"
    with open(ruta_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["codigo", "nombre", "caudal", "fecha_hora", "ts_descarga"])

        total = len(estaciones)
        for i, est in enumerate(estaciones, 1):
            if i % 10 == 0 or i == 1:  
                print(f"DUERO -> Procesando estaciÃ³n {i}/{total}: {est['nombre']}")
            caudal, fecha_hora = obtener_datos_caudal(est["codigo"])
            w.writerow([
                est["codigo"],
                est["nombre"],
                caudal,
                fecha_hora,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ])
    
    print(f"DUERO -> Completado: {total} estaciones procesadas")

main()

driver = webdriver.Chrome()

try:
    
    driver.get("https://saih.chminosil.es/index.php?url=/datos/mapas/mapaH1/areaHID/acc1")  

    enlace = WebDriverWait(driver, 20).until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "div.boton_tabla a.icono_boton")
        )
    )
    enlace.click()
    print("MIÃ‘O-SIL ->", enlace)
    
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.TAG_NAME, "table"))
    )

    filas = []

    tablas = driver.find_elements(By.CSS_SELECTOR, "table.tabla")
    for tabla in tablas:
        for tr in tabla.find_elements(By.TAG_NAME, "tr"):
            tds = tr.find_elements(By.TAG_NAME, "td")
            if len(tds) < 5:
                continue

            unidad = tds[4].text.strip()
            if "mÂ³/s" not in unidad and "m3/s" not in unidad:
                continue  

            fecha = tds[1].text.strip()
            if "/" not in fecha:
                continue  

            nombre = tds[0].text.strip()
            valor = tds[3].text.strip().replace(".", "").replace(",", ".")

            filas.append([nombre, fecha, valor, unidad])

finally:
    driver.quit()

ruta_csv = r"dataPH\saih_mino.csv"
with open(ruta_csv, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["nombre", "fecha", "valor", "unidad"])
    writer.writerows(filas)

url_cantabria = "https://visor.saichcantabrico.es/"
print("CANTABRICO->", url_cantabria)
driver = webdriver.Chrome()
wait = WebDriverWait(driver, 25)

driver.get(url_cantabria)

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

tabla = wait.until(
    EC.presence_of_element_located(("css selector", "table#tabla-datos"))
)
wait.until(
    EC.presence_of_element_located(
        ("css selector", "table#tabla-datos tbody tr"))
)
filas = tabla.find_elements(By.CSS_SELECTOR, "tbody tr")
print("filas capturadas:", len(filas))

registros = []

for fila in filas:
    celdas = fila.find_elements(By.TAG_NAME, "td")
    if len(celdas) < 8:
        continue

    zona   = celdas[0].text.strip()
    codigo = celdas[1].text.strip()
    rio    = celdas[2].text.strip()
    est    = celdas[3].text.strip()
    nivel_raw  = celdas[4].text.strip()
    caudal_raw = celdas[5].text.strip()
    act    = celdas[7].text.strip()

    if nivel_raw == "-" or not nivel_raw:
        nivel_raw = ""
    if caudal_raw == "-" or not caudal_raw:
        caudal_raw = ""
    if act == "-" or not act:
        act = ""

    registros.append({
        "zona_hidrologica": zona,
        "codigo":           codigo,
        "rio":              rio,
        "estacion":         est,
        "nivel_raw":        nivel_raw,
        "caudal_raw":       caudal_raw,
        "actualizacion":    act,
    })

driver.quit()

ruta = r"dataPH\saih_cantabrico.csv"
with open(ruta, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["zona_hidrologica", "codigo", "rio", "estacion", "nivel_raw", "caudal_raw", "actualizacion"])
    writer.writeheader()
    writer.writerows(registros)

print(f"CANTABRICO -> {len(registros)} registros guardados en {ruta}")

