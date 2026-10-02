import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Raiz del repositorio, calculada a partir de la ubicacion de este archivo
# (src/config.py) en lugar del directorio de trabajo actual. Asi el resto
# de rutas (p.ej. dashboard/public) son correctas sin importar desde donde
# se ejecuten los scripts (python src/foo.py o cd src && python foo.py).
REPO_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.environ.get("DATA_DIR", "dataPH"))
if not DATA_DIR.is_absolute():
    DATA_DIR = REPO_ROOT / "src" / DATA_DIR
DATA_DIR.mkdir(parents=True, exist_ok=True)

PG_CONN = dict(
    host=os.environ.get("PGHOST", "localhost"),
    port=int(os.environ.get("PGPORT", "5432")),
    dbname=os.environ.get("PGDATABASE", "TIIG"),
    user=os.environ.get("PGUSER", "postgres"),
    password=os.environ.get("PGPASSWORD", ""),
)

OGR2OGR_PATH = os.environ.get("OGR2OGR_PATH", "ogr2ogr")
GUADIANA_JWT = os.environ.get("GUADIANA_JWT")
SELENIUM_HEADLESS = os.environ.get("SELENIUM_HEADLESS", "1") != "0"


def chrome_options():
    from selenium.webdriver.chrome.options import Options

    options = Options()
    if SELENIUM_HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    return options
