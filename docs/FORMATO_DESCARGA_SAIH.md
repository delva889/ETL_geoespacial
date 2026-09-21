# Formato de Descarga de Datos SAIH por Cuenca

Este documento describe el formato en que se descarga cada cuenca desde internet en el script `descarga_saih.py`.

---

## 1. JÚCAR
- **URL**: `https://saih.chj.es/aforos`
- **Formato de descarga**: **HTML**
- **Método**: `requests.get()`
- **Procesamiento**:
  - Se guarda el HTML completo en `saih_jucar.html`
  - Se parsea con BeautifulSoup para extraer tablas HTML
  - Se extraen filas de la tabla `<tr>`
- **Datos extraídos**:
  - `nombre` (columna 0)
  - `caudal_m3s` (columna 2)
  - `hora` (timestamp de descarga)
- **Archivo de salida**: `saih_jucar.csv`
- **Columnas CSV**: `nombre`, `caudal_m3s`, `hora`, `id`

---

## 2. EBRO
- **URL**: `https://www.saihebro.com/api/mapa/getTablaCajetinesOrdenada?slug=mapa-aforos-HG-toda-la-cuenca&columna=estacion&orden=desc`
- **Formato de descarga**: **JSON** (API REST)
- **Método**: `requests.get()`
- **Procesamiento**:
  - Se descarga directamente como JSON desde la API
  - No se procesa, se guarda tal cual
- **Archivo de salida**: `saih_ebro.json`
- **Formato**: JSON sin procesar de la API

---

## 3. SEGURA
- **URLs**: Múltiples URLs (21 estaciones diferentes)
  - Formato: `https://saihweb.chsegura.es/apps/iVisor/sadder1.php?punto=XXYYY&zona=*`
- **Formato de descarga**: **HTML** con datos en campo oculto
- **Método**: `requests.get()` para cada URL
- **Procesamiento**:
  - Se busca un `<input>` con `id="csv"` en el HTML
  - El valor contiene datos CSV comprimidos separados por `***`
  - Se parsea el formato: `codigo;descripcion;fecha;valor;uds`
  - Solo se extraen códigos que empiezan por "Q" (caudales)
- **Datos extraídos**:
  - `codigo` (código de variable, empieza por Q)
  - `descripcion`
  - `fecha`
  - `valor`
  - `uds` (unidades)
  - `url` (URL de origen)
- **Archivo de salida**: `saih_segura.csv`
- **Columnas CSV**: `codigo`, `descripcion`, `fecha`, `valor`, `uds`, `url`

---

## 4. TAJO
- **URLs**: 21 URLs diferentes con parámetros codificados
  - Formato: `https://saihtajo.chtajo.es/index.php?w=get-estacion&x=[PARAMETROS]`
- **Formato de descarga**: **JSON** (API REST)
- **Método**: `requests.get()` para cada URL
- **Procesamiento**:
  - Cada URL devuelve un JSON con estructura: `{"response": {"senales": [...]}}`
  - Se filtran señales cuyo nombre contiene "CAUDAL" o "CANAL"
  - Se extrae el último valor de cada señal
- **Datos extraídos**:
  - `id` (tag de la señal)
  - `nombre` (nombre de la señal)
  - `valor` (último valor medido)
  - `fecha` (tiempo de la última medición)
- **Archivo de salida**: `saih_tajo.json`
- **Formato JSON**:
```json
{
  "fuente": "SAIH_TAJO",
  "hora_descarga": "YYYY-MM-DD HH:MM:SS",
  "data": [
    {
      "id": "...",
      "nombre": "...",
      "valor": "...",
      "fecha": "..."
    }
  ]
}
```

---

## 5. GUADIANA
- **URL**: `https://siraguadiana.com/backend/Visor/resourceByID`
- **Formato de descarga**: **JSON** (API REST con autenticación JWT)
- **Método**: `requests.post()` con token JWT
- **Autenticación**:
  - Se usa Selenium para obtener un token JWT automáticamente
  - El token se busca en localStorage, sessionStorage, cookies o headers de peticiones de red
  - Se hace una petición desde el navegador para generar/capturar el token
  - Se prueban diferentes variantes del header: `Authjwt`, `authjwt`, `Authorization: Bearer`
- **Payload POST**:
```json
{
  "id": "CR",
  "type": "ficha_redes_control"
}
```
- **Procesamiento**:
  - La respuesta es un JSON que puede contener `ult_res.valores` con los datos
- **Archivo de salida**: `saih_guadiana.json`
- **Formato**: JSON sin procesar de la API (puede contener error si el token no es válido)

---

## 6. GUADALQUIVIR
- **URL**: `https://www.chguadalquivir.es/saih/`
- **Formato de descarga**: **HTML**
- **Método**: `requests.get()`
- **Procesamiento**:
  - Se busca una tabla con `id="ContentPlaceHolder1_GVcaudal"`
  - Se extraen filas de la tabla
- **Datos extraídos**:
  - `nombre` (columna 0 - Punto)
  - `caudal_m3s` (columna 2 - Instantáneo)
  - `hora` (timestamp de descarga)
- **Archivo de salida**: `saih_guadalquivir.csv`
- **Columnas CSV**: `nombre`, `caudal_m3s`, `hora`

---

## 7. DUERO
- **URL Base**: `https://www.saihduero.es`
- **Formato de descarga**: **HTML** (scraping de múltiples páginas)
- **Método**: 
  1. `requests.get()` para obtener lista de estaciones: `/resultados-risr?q=&tipo=EA`
  2. `requests.get()` para cada estación: `/risr/{codigo}`
- **Procesamiento**:
  - Primero se obtiene la lista de estaciones desde una tabla HTML
  - Para cada estación, se accede a su página individual
  - Se busca un heading "Datos en tiempo real" y la tabla siguiente
  - Se busca la fila con variable "Caudal"
- **Datos extraídos**:
  - `codigo` (código de estación)
  - `nombre` (nombre de estación)
  - `caudal` (valor del caudal)
  - `fecha_hora` (fecha y hora de la medición)
  - `ts_descarga` (timestamp de descarga)
- **Archivo de salida**: `saih_duero.csv`
- **Columnas CSV**: `codigo`, `nombre`, `caudal`, `fecha_hora`, `ts_descarga`

---

## 8. MIÑO-SIL
- **URL**: `https://saih.chminosil.es/index.php?url=/datos/mapas/mapaH1/areaHID/acc1`
- **Formato de descarga**: **HTML dinámico** (requiere JavaScript)
- **Método**: **Selenium WebDriver**
- **Procesamiento**:
  1. Se abre la página con Selenium
  2. Se hace clic en el icono de tabla (`div.boton_tabla a.icono_boton`)
  3. Se espera a que carguen las tablas
  4. Se buscan tablas con clase `table.tabla`
  5. Se filtran solo filas con unidad "m³/s" o "m3/s"
- **Datos extraídos**:
  - `nombre` (columna 0)
  - `fecha` (columna 1)
  - `valor` (columna 3, con conversión de formato español)
  - `unidad` (columna 4)
- **Archivo de salida**: `saih_mino.csv`
- **Columnas CSV**: `nombre`, `fecha`, `valor`, `unidad`

---

## 9. CANTÁBRICO
- **URL**: `https://visor.saichcantabrico.es/`
- **Formato de descarga**: **HTML dinámico** (requiere JavaScript)
- **Método**: **Selenium WebDriver**
- **Procesamiento**:
  1. Se abre la página con Selenium
  2. Se aceptan cookies (si aparecen)
  3. Se hace clic en el menú "Caudal" (`div#menu-caudal a#caudal`)
  4. Se hace clic en el icono de tabla (`div.icono-tabla`)
  5. Se espera a que cargue la tabla (`table#tabla-datos`)
  6. Se extraen las filas de la tabla
- **Datos extraídos**:
  - `zona_hidrologica` (columna 0)
  - `codigo` (columna 1)
  - `rio` (columna 2)
  - `estacion` (columna 3)
  - `nivel_raw` (columna 4)
  - `caudal_raw` (columna 5)
  - `actualizacion` (columna 7)
- **Archivo de salida**: `saih_cantabrico.csv`
- **Columnas CSV**: `zona_hidrologica`, `codigo`, `rio`, `estacion`, `nivel_raw`, `caudal_raw`, `actualizacion`

---

## Resumen de Formatos

| Cuenca | Formato Original | Método | Archivo Salida | Extensión |
|--------|------------------|--------|----------------|-----------|
| Júcar | HTML | requests | saih_jucar.csv | CSV |
| Ebro | JSON (API) | requests | saih_ebro.json | JSON |
| Segura | HTML (campo oculto CSV) | requests | saih_segura.csv | CSV |
| Tajo | JSON (API) | requests | saih_tajo.json | JSON |
| Guadiana | JSON (API con JWT) | requests + Selenium | saih_guadiana.json | JSON |
| Guadalquivir | HTML | requests | saih_guadalquivir.csv | CSV |
| Duero | HTML (múltiples páginas) | requests | saih_duero.csv | CSV |
| Miño-Sil | HTML dinámico | Selenium | saih_mino.csv | CSV |
| Cantábrico | HTML dinámico | Selenium | saih_cantabrico.csv | CSV |

---

## Notas Importantes

1. **Autenticación requerida**: Solo Guadiana requiere token JWT que se obtiene automáticamente con Selenium
2. **JavaScript necesario**: Miño-Sil y Cantábrico requieren Selenium porque el contenido se carga dinámicamente
3. **Múltiples URLs**: Segura y Tajo hacen múltiples peticiones a diferentes URLs
4. **Duero**: Hace scraping de múltiples páginas individuales (una por estación)




