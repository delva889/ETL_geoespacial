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
  * `scraping.py`: Extrae datos de embalses de España agrupados por cuenca y los almacena en PostgreSQL y CSV.
  * `descarga_saih.py`: Descarga información de diferentes confederaciones hidrográficas (SAIH) mediante técnicas avanzadas, manejando APIs y tokens.
  * `geom.py`: Combina los datos obtenidos con las geometrías (Shapefile) mediante métricas de similitud textual y exporta capas en formato GeoJSON para consumo web.
* `/fme_workspaces`: Espacios de trabajo de FME (`.fmw`) usados para el procesamiento avanzado.
* `/docs`: Memoria del proyecto en formato documento y manuales técnicos.
* `/dashboard`: Código fuente del Frontend interactivo . Construido con React, TypeScript, TailwindCSS y Vite.

## Ejecución de la Interfaz Visual (Plataforma Web)
La plataforma web se alimenta de los datos procesados en la etapa de ETL (`data.geojson`). Para iniciarlo en otro dispositivo:
1. Instala [Node.js](https://nodejs.org/).
2. Entra a la carpeta del frontend: `cd dashboard`
3. Instala las dependencias: `npm install`
4. Lanza el servidor en modo desarrollo: `npm run dev`
5. Abre en tu navegador la URL que devuelve la terminal (normalmente `http://localhost:5173/`).

## Ejecución del flujo de datos (Backend / ETL)
1. Ejecutar `descarga_saih.py` y `scraping.py` para recolectar datos de los embalses y sistemas SAIH.
2. Ejecutar `geom.py` para realizar el cruce espacial de los datos obtenidos con la capa de geometría base (`geometriaEmbalses.shp`) y generar el fichero estático `data.geojson`.
3. Copiar/Mover el resultado de `data.geojson` a la carpeta `dashboard/public/`.

> **Nota sobre Base de Datos:** Los scripts que interactúan con PostgreSQL requieren que tengas una instancia local activa.
