# Transformación e Integración de Datos Geoespaciales: Energía Hidráulica y Solar en España

Este proyecto se centra en la obtención, transformación e integración de datos espaciales y tabulares procedentes de diversas cuencas hidrográficas de España, con aplicación al análisis de energías renovables (hidráulica y solar).

## Tecnologías Utilizadas
* **Python**: Scripts principales para la obtención de datos mediante web scraping.
  * Librerías destacadas: `requests`, `BeautifulSoup`, `pandas`, `geopandas`, `selenium`.
* **FME (Feature Manipulation Engine)**: Flujos de trabajo (`.fmw`) para la integración y procesamiento de los datos espaciales.
* **Bases de Datos Espaciales**: Uso de SQLite, GeoPackage y PostgreSQL (PostGIS) para almacenar las geometrías de los embalses y sus atributos actualizados.

## Estructura del Proyecto

* `/src`: Contiene los scripts en Python.
  * `scraping.py`: Extrae datos de embalses de España agrupados por cuenca y los almacena en PostgreSQL y CSV.
  * `descarga_saih.py`: Descarga información de diferentes confederaciones hidrográficas (SAIH) mediante técnicas avanzadas, manejando APIs y tokens (Guadiana, Ebro, Tajo) o leyendo HTML/CSV directo.
  * `geom.py`: Combina los datos obtenidos con las geometrías (Shapefile) mediante métricas de similitud textual (`rapidfuzz`) y exporta capas GeoPackage y PostGIS actualizadas.
* `/fme_workspaces`: Espacios de trabajo de FME (`.fmw`) usados para el procesamiento espacial.
* `/docs`: Memoria del proyecto en formato documento y un pequeño manual en Markdown explicando los formatos de descarga.
* `/dataPH`: (No incluido en el repositorio por tamaño) Carpeta esperada en el flujo de trabajo para guardar las salidas CSV y GPKG temporales.

## Ejecución del flujo
1. Ejecutar `descarga_saih.py` y `scraping.py` para recolecir datos de los embalses y sistemas SAIH en la carpeta `dataPH/`.
2. Ejecutar `geom.py` para realizar un cruce espacial de los datos obtenidos con la capa de geometría base (`geometriaEmbalses.shp`).
3. (Opcional) Abrir los espacios de trabajo en FME para visualizar y adaptar las transformaciones ETL generadas.

> **Nota sobre Base de Datos:** Los scripts que interactúan con PostgreSQL requieren que tengas una instancia local activa. Por defecto conectan al puerto `5432`, base de datos `TIIG` con el usuario `postgres`. Se debe proveer la contraseña en las variables del código (marcado como `TU_PASSWORD_AQUI`).
