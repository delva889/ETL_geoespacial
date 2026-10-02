import { Droplets, Leaf, Compass, Zap, Waves, MapPin } from 'lucide-react';

export default function Metodologia() {
  const bgIcons = [
    { Icon: Droplets, top: '10%', left: '80%', size: 38, delay: 0, duration: 7 },
    { Icon: Waves, top: '65%', left: '90%', size: 44, delay: 1.1, duration: 8 },
    { Icon: Compass, top: '20%', left: '60%', size: 28, delay: 2, duration: 6.5 },
    { Icon: MapPin, top: '80%', left: '68%', size: 26, delay: 0.6, duration: 7.2 },
    { Icon: Zap, top: '45%', left: '85%', size: 24, delay: 1.7, duration: 6.8 },
  ];

  const dataSources = [
    {
      name: 'embalses.net',
      subtitle: 'Estado de embalses',
      icon: <Droplets size={22} strokeWidth={1.5} className="text-teal" />,
    },
    {
      name: 'MITECO / SAIH',
      subtitle: 'Transición ecológica',
      icon: <Leaf size={22} strokeWidth={1.5} className="text-teal" />,
    },
    {
      name: 'IGN',
      subtitle: 'Instituto Geográfico Nacional',
      icon: <Compass size={22} strokeWidth={1.5} className="text-teal" />,
    },
    {
      name: 'OMIE',
      subtitle: 'Mercado eléctrico mayorista',
      icon: <Zap size={22} strokeWidth={1.5} className="text-teal" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full">
      <style>{`
        @keyframes bgIconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-4deg); }
        }
      `}</style>

      <div className="mb-10 pb-6 border-b border-line relative overflow-hidden">
        <div className="lines-bg absolute inset-0 text-line opacity-60 pointer-events-none hidden sm:block" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
          {bgIcons.map(({ Icon, top, left, size, delay, duration }, i) => (
            <Icon
              key={i}
              size={size}
              strokeWidth={1.5}
              className="text-teal absolute"
              style={{
                top, left,
                opacity: 0.16,
                animation: `bgIconFloat ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <p className="font-data text-xs text-teal mb-2">Datos y fuentes</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Procedencia de la información
          </h1>
          <p className="text-base text-muted leading-relaxed mt-3 max-w-xl">
            Recopilación, tratamiento y procedencia de la información hidrológica en España.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 border border-line divide-x divide-y md:divide-y-0 divide-line mb-12">
        {dataSources.map((source) => (
          <div key={source.name} className="flex flex-col items-center justify-center text-center p-6 bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] hover:z-10 relative">
            {source.icon}
            <h3 className="font-display text-base font-semibold text-ink mt-3">{source.name}</h3>
            <p className="font-data text-[10px] text-muted mt-1">{source.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">
            3.1 — Ámbito de hidrología
          </h2>
          <p className="text-[15px] text-ink leading-relaxed mb-6 max-w-2xl">
            La recopilación de datos hidrológicos se ha estructurado en dos ejes principales, atendiendo a la naturaleza de la información y a su disponibilidad en la red.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="border border-line bg-surface p-6 border-t-2 border-t-teal transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] hover:z-10 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <Droplets size={18} className="text-teal" strokeWidth={1.5} />
                <h3 className="font-display font-semibold text-ink">Infraestructura de embalses</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4">
                La información relativa al estado, capacidad y variación de los embalses se ha obtenido del portal <strong className="text-ink font-medium">embalses.net</strong>. Debido a que los datos se presentan en formato HTML y se encuentran separados por demarcaciones, el proceso ha requerido descarga y tratamiento individualizado.
              </p>
              <div className="border-t border-line pt-3 text-xs text-muted leading-relaxed">
                <span className="text-ink font-medium">Proceso aplicado: </span>
                extracción mediante parsing HTML (web scraping), normalización de campos numéricos (hm³) y consolidación de un registro único nacional.
              </div>
            </div>

            <div className="border border-line bg-surface p-6 border-t-2 border-t-teal transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] hover:z-10 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <Leaf size={18} className="text-teal" strokeWidth={1.5} />
                <h3 className="font-display font-semibold text-ink">Red fluvial y caudales</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Los datos relativos a los ríos proceden del <strong className="text-ink font-medium">Ministerio para la Transición Ecológica (MITECO)</strong> a través de los Sistemas Automáticos de Información Hidrológica (SAIH), que controlan las cuencas de manera individualizada.
              </p>
              <div className="border-t border-line pt-3 text-xs text-muted leading-relaxed">
                <span className="text-ink font-medium">Formatos descentralizados: </span>
                a pesar de la disparidad inicial entre confederaciones, se ha logrado mapear las variables clave hacia un formato interoperable GeoJSON.
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 border-t border-line">
          <h2 className="font-display text-xl font-semibold text-ink mb-5">
            3.2 — Modelado espacial y mercado
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="border border-line bg-surface p-6 border-t-2 border-t-ochre transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] hover:z-10 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <Compass size={18} className="text-ochre" strokeWidth={1.5} />
                <h3 className="font-display font-semibold text-ink text-sm">Modelado geográfico (IGN)</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Para dotar a los datos de contexto geográfico se emplean geometrías proporcionadas por entidades estatales (IGN) que definen el polígono y la localización exacta de las presas. La transformación de geometrías se ejecuta mediante herramientas ETL geoespaciales.
              </p>
            </div>

            <div className="border border-line bg-surface p-6 border-t-2 border-t-ochre transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)] hover:z-10 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <Zap size={18} className="text-ochre" strokeWidth={1.5} />
                <h3 className="font-display font-semibold text-ink text-sm">Mercado energético (OMIE)</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Finalmente, se cruzan las métricas de capacidad (volumen embalsado) con las tasas de conversión energética y los precios de cotización del <strong className="text-ink font-medium">OMIE (Operador del Mercado Ibérico de Energía)</strong>, estimando el valor del recurso hídrico.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
