import { Droplets, Leaf, Compass, Zap, Landmark } from 'lucide-react';

export default function Metodologia() {
  const dataSources = [
    {
      name: 'embalses.net',
      subtitle: 'Portal de Estado de Embalses',
      icon: <Droplets className="text-blue-500 mb-2" size={36} strokeWidth={1.5} />,
      color: 'border-blue-200 bg-blue-50/30'
    },
    {
      name: 'MITECO / SAIH',
      subtitle: 'Transición Ecológica',
      icon: <Leaf className="text-emerald-600 mb-2" size={36} strokeWidth={1.5} />,
      color: 'border-emerald-200 bg-emerald-50/30'
    },
    {
      name: 'IGN',
      subtitle: 'Instituto Geográfico Nacional',
      icon: <Compass className="text-rose-700 mb-2" size={36} strokeWidth={1.5} />,
      color: 'border-rose-200 bg-rose-50/30'
    },
    {
      name: 'OMIE',
      subtitle: 'Mercado Eléctrico Mayorista',
      icon: <Zap className="text-amber-500 mb-2" size={36} strokeWidth={1.5} />,
      color: 'border-amber-200 bg-amber-50/30'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-12 animate-fade-in">
      <div className="mb-10 border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4 uppercase tracking-wide">
          3. Datos y Fuentes Empleados
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed">
          Recopilación, tratamiento y procedencia de la información hidrológica en España.
        </p>
      </div>

      {/* SECCIÓN DE LOGOS SEGUROS (OPEN DATA / USO JUSTO) */}
      <div className="mb-12">
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Landmark size={16} /> Entidades de Origen de Datos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dataSources.map((source, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col items-center justify-center p-6 rounded-xl border ${source.color} hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default`}
            >
              {source.icon}
              <h3 className="text-lg font-black text-neutral-800 tracking-tight">{source.name}</h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider text-center mt-1 font-semibold">{source.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-12 bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
        <section>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4 border-l-4 border-neutral-800 pl-4">
            3.1 Ámbito de Hidrología
          </h2>
          <p className="text-neutral-700 leading-relaxed mb-6">
            La recopilación de datos hidrológicos se ha estructurado en dos ejes principales, atendiendo a la naturaleza de la información y a su disponibilidad en la red:
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Droplets className="text-blue-500" size={24} />
                <h3 className="font-bold text-neutral-900 text-lg">A. Infraestructura de Embalses</h3>
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                La información relativa al estado, capacidad y variación de los embalses se ha obtenido del portal <strong>embalses.net</strong>. Debido a que los datos se presentan en formato HTML y se encuentran separados por demarcaciones, el proceso ha requerido la descarga y tratamiento individualizado.
              </p>
              <div className="bg-white p-4 rounded border border-neutral-200 text-xs text-neutral-700 shadow-sm font-medium">
                <strong>Proceso aplicado:</strong> Extracción mediante algoritmos de parsing HTML (Web Scraping), normalización de campos numéricos (hm³) y consolidación de un registro único nacional.
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Leaf className="text-emerald-600" size={24} />
                <h3 className="font-bold text-neutral-900 text-lg">B. Red Fluvial y Caudales</h3>
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                Los datos relativos a los ríos proceden del <strong>Ministerio para la Transición Ecológica (MITECO)</strong> a través de los Sistemas Automáticos de Información Hidrológica (SAIH), los cuales controlan las cuencas de manera individualizada.
              </p>
              <div className="bg-white p-4 rounded border border-neutral-200 text-xs text-neutral-700 shadow-sm font-medium mt-auto">
                <strong>Formatos descentralizados:</strong> A pesar de la disparidad inicial en las confederaciones, se ha logrado mapear las variables clave hacia un formato interoperable GeoJSON.
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 border-t border-neutral-100">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4 border-l-4 border-neutral-800 pl-4">
            3.2 Modelado Espacial y Mercado
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Compass className="text-rose-700" size={24} />
                <h3 className="font-bold text-neutral-900 text-base">Modelado Geográfico (IGN)</h3>
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Para dotar a los datos de contexto geográfico, se emplean geometrías proporcionadas por entidades estatales (IGN) que definen el polígono y la localización exacta de las presas. La transformación de geometrías se ejecuta mediante herramientas ETL geoespaciales.
              </p>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-amber-500" size={24} />
                <h3 className="font-bold text-neutral-900 text-base">Mercado Energético (OMIE)</h3>
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Finalmente, se cruzan las métricas de capacidad (volumen embalsado) con las tasas de conversión energética y los precios de cotización del <strong>OMIE (Operador del Mercado Ibérico de Energía)</strong>, estimando el valor del recurso hídrico.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
