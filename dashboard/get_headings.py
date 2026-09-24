import docx
doc = docx.Document('c:/Users/carlo/Desktop/UPM/3º/1 cuatrimetre/Transformación e Integración de la Información Geografica/hidrología/Memoria_Tecnica_ETL_GIS.docx')
headings = [p.text for p in doc.paragraphs if p.style.name.startswith('Heading')]
for h in headings:
    print(h)
