# Modelo de transformación e integración de datos geoespaciales aplicados a la energía hidráulica en España

**[Abrir la web](https://delva889.github.io/ETL_geoespacial/)** · [Memoria técnica (PDF)](docs/Memoria_Tecnica_ETL_GIS.pdf)

Cada semana, embalses.net publica el nivel de los embalses españoles, cada confederación hidrográfica publica sus caudales en su propio sistema SAIH y OMIE publica el precio de la electricidad. Son datos públicos, pero llegan en formatos distintos, con nombres que no coinciden de una fuente a otra y sin una geometría común.

Este proyecto los junta. Un proceso ETL los descarga, los limpia, cruza cada embalse con su polígono oficial del MITECO, le añade el relieve del IGN y una imagen Sentinel-2, estima cuánta energía podría generar el agua embalsada y lo publica todo en un mapa que se actualiza solo cada lunes.

## Qué hay en la web

- **Visor.** Es la página de inicio. Un mapa de España con los 777 embalses coloreados según su llenado. Se puede buscar un embalse, filtrar por cuenca y cambiar entre imagen de satélite y relieve. Al acercarse aparecen los polígonos reales. La ficha de cada embalse muestra su capacidad, su variación semanal, la energía estimada y un enlace a su escena Sentinel-2 en Copernicus Browser. Desde ahí también se consultan los caudales de las estaciones de aforo.
- **Proyecto.** Explica en pocos minutos el problema, el proceso en cinco pasos y las herramientas usadas.
- **Metodología.** Detalla las fuentes, qué se extrae de cada una y los flujos de FME y Pentaho con sus diagramas. También recoge las decisiones de diseño y los límites conocidos.

La web funciona en móvil, tablet y escritorio.

## Cómo funciona

```
Fuentes públicas ──► Scraping (Python) ──► Limpieza y cruce ──► Geoprocesamiento (FME + PostGIS) ──► GeoJSON ──► Web
embalses.net          requests, BS4,        pandas, Pentaho,      MDT200, Sentinel-2,                    React + Leaflet
SAIH, OMIE            Selenium              rapidfuzz             fórmula de energía                     GitHub Pages
```

1. **Scraping.** `scraping.py` lee la tabla de cada cuenca en embalses.net. `descarga_saih.py` obtiene los caudales de los SAIH: unos tienen API JSON, otros tablas HTML y otros solo se pueden leer abriendo la página con un navegador automatizado. El precio del mercado diario se descarga de OMIE.
2. **Limpieza y cruce.** `consolidate_caudales.py` unifica unidades y formatos de todas las confederaciones. `emparejamiento.py` une cada embalse con su polígono del inventario del MITECO por nombre normalizado, demarcación y capacidad. Si no encuentra un polígono fiable, el embalse se queda fuera del mapa en lugar de dibujarse en un sitio equivocado.
3. **Geoprocesamiento.** Los flujos de FME de `fme_workspaces/` cargan los polígonos en PostGIS, toman del MDT de 200 m la cota del embalse y la mínima de su entorno para calcular el salto, y geocodifican las estaciones de aforo.
4. **Satélite.** Otro flujo de FME consulta el catálogo STAC de Earth Search y guarda, para cada embalse, la escena Sentinel-2 L2A con menos nubes.
5. **Publicación.** Todo acaba en un `data.geojson` en EPSG:4326 que la web lee directamente, sin servidor. Al compilar se genera además una versión simplificada (Douglas-Peucker, unos 10 m de tolerancia) para que el mapa cargue rápido.

La energía se estima con `E = ρ·g·V·ΔH·η / 3,6·10⁹` (MWh) y se valora al precio OMIE del día. Es una cifra orientativa de vaciado completo, no un dato de explotación.

## Actualización automática

El workflow [`actualizar-datos.yml`](.github/workflows/actualizar-datos.yml) se ejecuta cada lunes a las 05:00 UTC (también se puede lanzar a mano desde *Actions*). Hace cinco cosas:

1. Descarga niveles, caudales y precio. Si una fuente falla, las demás siguen adelante.
2. Fusiona los datos nuevos en `dashboard/public/data.geojson` sin tocar la geometría ni el resto de campos.
3. Escribe `caudales.json` y `last_update.json`.
4. Hace commit de esos ficheros en `main`.
5. Compila la web y la publica en la rama `gh-pages`.

En Windows, `deploy.bat` hace lo mismo desde tu equipo con un doble clic. Es útil cuando los SAIH bloquean las peticiones que llegan desde fuera de España.

Los flujos de FME necesitan FME Desktop, así que no corren en CI. La geometría, las cotas y las escenas Sentinel-2 se regeneran a mano cuando hace falta.

## Estructura

```
├── src/                       Scripts de Python del ETL
│   ├── scraping.py            Niveles de embalses.net
│   ├── descarga_saih.py       Caudales de los SAIH de cada confederación
│   ├── consolidate_caudales.py
│   ├── actualizar_geojson.py  Fusiona los datos nuevos en el GeoJSON publicado
│   ├── emparejamiento.py      Reglas para unir cada embalse con su polígono
│   ├── corregir_geometrias.py Revisa todo el GeoJSON contra el inventario del MITECO
│   ├── geom.py                Cruce con el shapefile y carga en PostGIS
│   └── config.py              Rutas y variables de entorno
├── fme_workspaces/            Flujos de FME: geocodificación, satélite y energía
├── dashboard/                 Web (React, TypeScript, Vite, Tailwind, Leaflet, Recharts)
│   └── public/                data.geojson, caudales.json y last_update.json
├── docs/                      Memoria técnica y registro de revisión de geometrías
└── .github/workflows/         Actualización semanal y despliegue
```

## Ejecutarlo en local

### Web

Necesitas Node.js 18 o superior (en CI se usa la 20).

```bash
cd dashboard
npm install
npm run dev        # http://localhost:5173/
npm run build      # genera dashboard/dist
```

### ETL

Necesitas Python 3.11 o superior y Google Chrome, que Selenium usa para algunos SAIH.

```bash
pip install -r requirements.txt
cp .env.example .env               # rellena PGPASSWORD; el resto es opcional
cd src
python descarga_saih.py
python scraping.py
python consolidate_caudales.py
python actualizar_geojson.py
```

PostgreSQL es opcional para el ciclo semanal. Si no hay una base de datos disponible, o si `GUARDAR_EN_POSTGRES=0`, los scripts guardan CSV y JSON y siguen adelante. Sí hace falta PostGIS, junto con `ogr2ogr`, para `geom.py` y para los flujos de FME.

Para revisar las geometrías contra el inventario del MITECO:

```bash
python corregir_geometrias.py ruta/a/geometriaEmbalses.shp
```

El resultado de cada embalse queda registrado en `docs/revision_geometrias.csv`.

## Límites conocidos

- No todos los embalses publican su nivel todas las semanas. Los que no tienen lectura aparecen en gris y se pueden ocultar en el visor.
- Los SAIH del Júcar, el Ebro y el Guadiana no responden a peticiones desde fuera de España, así que desde GitHub Actions sus caudales pueden faltar alguna semana. El del Guadiana necesita además el secreto `GUADIANA_JWT`.
- La energía publicada usa un salto medio de 50 m (109 MWh por hm³) para todos los embalses. El cálculo con el salto de cada uno se hace en FME.

## Fuentes

embalses.net · SAIH de las confederaciones hidrográficas (MITECO) · OMIE · MDT200 del IGN · Inventario de presas y embalses del MITECO · Copernicus Sentinel-2 vía Earth Search (Element 84).

## Autor

Carlos del Valle. Proyecto de la asignatura *Transformación e Integración de la Información Geográfica* (UPM).
