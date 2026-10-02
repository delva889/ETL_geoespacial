@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: deploy.bat
:: Actualiza los datos (scraping + fusion), compila el dashboard
:: y lo publica en GitHub Pages para que cualquiera que entre al
:: repositorio vea la web actualizada.
:: Doble clic para ejecutarlo (o "deploy.bat" desde una terminal).
:: ============================================================

:: Colocarse en la carpeta donde esta este script (raiz del repo),
:: sea cual sea el sitio desde el que se ejecute.
cd /d "%~dp0"

echo.
echo === 1/8: Comprobando repositorio Git ===
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Esta carpeta no es un repositorio Git. Abortando.
    goto :fail
)

echo.
echo === 2/8: Sincronizando con origin/main ===
git fetch origin
if errorlevel 1 (
    echo [ERROR] No se pudo contactar con el remoto "origin". Revisa tu conexion.
    goto :fail
)
git pull --rebase origin main
if errorlevel 1 (
    echo [ERROR] "git pull --rebase" fallo. Resuelve los conflictos manualmente y vuelve a ejecutar el script.
    goto :fail
)

echo.
echo === 3/8: Actualizando datos (scraping SAIH, embalses y caudales) ===
where python >nul 2>&1
if errorlevel 1 (
    echo [AVISO] No se encontro Python en el PATH. Se omite la actualizacion de datos
    echo         y se publicara la web con los datos que ya hay en el repositorio.
    goto :skip_datos
)

echo Instalando dependencias Python...
python -m pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo [AVISO] No se pudieron instalar las dependencias Python. Se omite la actualizacion de datos.
    goto :skip_datos
)

:: PGPASSWORD es obligatoria para que config.py no falle al importarse,
:: aunque no haya una base de datos local: si no esta definida como
:: variable de entorno del sistema, se usa un valor de relleno y los
:: scripts simplemente siguen solo con el CSV/JSON si no logran conectar.
if "%PGPASSWORD%"=="" set "PGPASSWORD=no-configurado-local"

pushd src

echo   * Descargando caudales SAIH...
python descarga_saih.py
if errorlevel 1 echo [AVISO] descarga_saih.py fallo, se continua con el resto.

echo   * Descargando niveles de embalses...
python scraping.py
if errorlevel 1 echo [AVISO] scraping.py fallo, se continua con el resto.

echo   * Consolidando caudales para la web...
python consolidate_caudales.py
if errorlevel 1 echo [AVISO] consolidate_caudales.py fallo, se continua con el resto.

echo   * Fusionando niveles frescos en data.geojson...
python actualizar_geojson.py
if errorlevel 1 (
    echo [AVISO] actualizar_geojson.py fallo. Se publicara con los datos existentes.
)

popd

:skip_datos

echo.
echo === 4/8: Comprobando cambios para commitear ===
git status --porcelain > "%TEMP%\deploy_status.txt"
for /f %%A in ("%TEMP%\deploy_status.txt") do set STATUS_SIZE=%%~zA
if not "!STATUS_SIZE!"=="0" (
    echo Hay cambios sin commitear, se van a subir...
    git add -A
    git commit -m "chore(datos): actualizacion automatica de embalses y caudales (%date% %time%)"
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el commit. Abortando.
        goto :fail
    )
)
del "%TEMP%\deploy_status.txt" >nul 2>&1

echo.
echo === 5/8: Subiendo cambios a origin/main ===
git push origin main
if errorlevel 1 (
    echo [ERROR] No se pudo hacer push a origin/main. Abortando.
    goto :fail
)

echo.
echo === 6/8: Instalando dependencias del dashboard ===
if not exist "dashboard" (
    echo [ERROR] No se encuentra la carpeta "dashboard". Abortando.
    goto :fail
)
cd dashboard
if not exist "node_modules" (
    echo No existe node_modules, instalando desde cero con npm ci...
    call npm ci
) else (
    call npm install
)
if errorlevel 1 (
    echo [ERROR] "npm install" fallo. Revisa que Node.js este instalado y vuelve a intentarlo.
    goto :fail
)

echo.
echo === 7/8: Compilando el dashboard ===
call npm run build
if errorlevel 1 (
    echo [ERROR] La compilacion fallo. Revisa los errores de arriba.
    goto :fail
)

echo.
echo === 8/8: Publicando en GitHub Pages ===
call npx --yes gh-pages -d dist -m "Despliegue automatico %date% %time%"
if errorlevel 1 (
    echo [ERROR] La publicacion con gh-pages fallo.
    goto :fail
)

echo.
echo ================================================================
echo  LISTO. Datos actualizados (si Python estaba disponible) y web
echo  publicada correctamente. Puede tardar 1-2 minutos en verse
echo  reflejada en GitHub Pages:
echo  https://delva889.github.io/ETL_geoespacial/
echo ================================================================
echo.
pause
exit /b 0

:fail
echo.
echo ================================================================
echo  El despliegue NO se completo. Revisa el mensaje de error de arriba.
echo ================================================================
echo.
pause
exit /b 1
