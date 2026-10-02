# Modelo de Transformación e Integración de Datos Geoespaciales aplicado a la Energía Hidráulica en España

Este proyecto se centra en la obtención, transformación e integración de datos espaciales y tabulares procedentes de diversas cuencas hidrográficas de España, con aplicación al análisis de energías renovables (hidráulica y solar).

## Tecnologías Utilizadas
* **Python**: Scripts principales para la obtención de datos mediante web scraping y geoprocesamiento espacial.
  * Librerías destacadas: `requests`, `BeautifulSoup`, `pandas`, `geopandas`, `selenium`, `sqlalchemy`.
* **FME (Feature Manipulation Engine)**: Flujos de trabajo (`.fmw`) para la integración y procesamiento de los datos espaciales.
* **Bases de Datos Espaciales**: Uso de SQLite, GeoPackage y PostgreSQL (PostGIS) para almacenar las geometrías de los embalses y sus atributos actualizados.
* **React & Vite**: Frontend y Plataforma Web Interactiva.
* **Leaflet & Recharts**: Librerías de visualización web (mapas interactivos y gráficas analíticas reactivas).

## Plataforma Web en Vivo
El resultado final de este proyecto (la integración ETL servida en un mapa analítico) está desplegado y accesible públicamente. Puedes visualizar la plataforma web directamente aquí:
**[Ver Plataforma Web de Energía Hidráulica ](https://delva889.github.io/ETL_geoespacial/)**

## Estructura del Proyecto

* `/src`: Contiene los scripts en Python (ETL espacial).
  * `scraping.py`: Extrae datos de embalses de España agrupados por cuenca y los almacena en PostgreSQL (si hay una instancia disponible) y CSV.
  * `descarga_saih.py`: Descarga caudales de las distintas confederaciones hidrográficas (SAIH) mediante técnicas avanzadas, manejando APIs y tokens.
  * `consolidate_caudales.py`: Unifica los ficheros heterogéneos que genera `descarga_saih.py` en un único `caudales.json` para la web.
  * `geom.py`: Combina los datos de `scraping.py` con las geometrías (Shapefile) mediante métricas de similitud textual y las exporta a PostGIS (requiere PostgreSQL + `ogr2ogr` locales). El cruce con las estimaciones energéticas (MWh, mercado estimado) y la capa de geometría definitiva del `data.geojson` publicado se realiza con los workspaces de `/fme_workspaces` (requiere FME, no está automatizado).
  * `actualizar_geojson.py`: Fusiona los niveles/variaciones recién descargados por `scraping.py` sobre el `dashboard/public/data.geojson` ya publicado, sin tocar la geometría ni las estimaciones energéticas, y escribe `dashboard/public/last_update.json`.
* `/fme_workspaces`: Espacios de trabajo de FME (`.fmw`) usados para el procesamiento avanzado (geocodificación, imágenes de satélite y estimación energética). No son ejecutables desde Python ni desde la automatización en CI.
* `/docs`: Memoria del proyecto en formato documento y manuales técnicos.
* `/dashboard`: Código fuente del Frontend interactivo . Construido con React, TypeScript, TailwindCSS y Vite.

## Actualización automática de la web
El workflow `.github/workflows/actualizar-datos.yml` se ejecuta semanalmente (lunes, también lanzable a mano desde la pestaña Actions) y:
1. Ejecuta `descarga_saih.py`, `scraping.py` y `consolidate_caudales.py` (cada fuente falla de forma aislada, sin bloquear al resto).
2. Ejecuta `actualizar_geojson.py` para refrescar los niveles/variaciones de `data.geojson` y generar `caudales.json` y `last_update.json` en `dashboard/public/`.
3. Commitea esos ficheros a `main` si han cambiado.
4. Compila el dashboard y publica el resultado en la rama `gh-pages`, que es la que sirve GitHub Pages.

Esto solo cubre los datos que pueden obtenerse por scraping/API (niveles de embalses y caudales). La geometría de los embalses y las estimaciones energéticas/de mercado (`mwh_conocidos`, `precio_actual`, etc.) se generan con los workspaces de FME de `/fme_workspaces`, que requieren FME de escritorio y **no** se ejecutan en CI; esos campos se conservan tal cual estén en el `data.geojson` publicado hasta que se vuelvan a regenerar manualmente con FME.

> El cron de GitHub Actions solo se dispara desde la rama por defecto del repositorio (`main`), así que la actualización semanal no arrancará hasta que esta rama se fusione en `main`.

## Ejecución de la Interfaz Visual (Plataforma Web)
La plataforma web se alimenta de los datos procesados en la etapa de ETL (`data.geojson`). Para iniciarlo en otro dispositivo:
1. Instala [Node.js](https://nodejs.org/).
2. Entra a la carpeta del frontend: `cd dashboard`
3. Instala las dependencias: `npm install`
4. Lanza el servidor en modo desarrollo: `npm run dev`
5. Abre en tu navegador la URL que devuelve la terminal (normalmente `http://localhost:5173/`).

## Ejecución del flujo de datos (Backend / ETL)
1. Copia `.env.example` a `.env` dentro de `/src` y rellena tus credenciales (`PGPASSWORD` es obligatorio aunque no tengas PostgreSQL local, ya que solo se usa si hay conexión disponible; `OGR2OGR_PATH` y `GUADIANA_JWT` son opcionales).
2. Instala las dependencias de Python: `pip install -r requirements.txt` (o `requests beautifulsoup4 pandas geopandas selenium psycopg2-binary rapidfuzz python-dotenv`).
3. Ejecutar `descarga_saih.py` y `scraping.py` para recolectar datos de los embalses y sistemas SAIH.
4. Ejecutar `consolidate_caudales.py` para generar `caudales.json` y `actualizar_geojson.py` para refrescar `dashboard/public/data.geojson` con los niveles nuevos (requiere que ya exista un `data.geojson` con geometría, generado previamente con `geom.py` + FME).
5. Si quieres regenerar la geometría o las estimaciones energéticas desde cero, ejecuta `geom.py` (cruce espacial + export a PostGIS) y después los workspaces de `/fme_workspaces` en FME para producir el `data.geojson` definitivo.

> **Nota sobre Base de Datos:** Los scripts que interactúan con PostgreSQL requieren que tengas una instancia local activa, con las credenciales configuradas en `/src/.env`. Si no la tienes, `scraping.py` sigue generando el CSV igualmente y solo avisa por consola de que no pudo escribir en PostgreSQL.

> Para ver cómo se ejecuta todo esto de forma automática y semanal, consulta la sección "Actualización automática de la web" más arriba.
