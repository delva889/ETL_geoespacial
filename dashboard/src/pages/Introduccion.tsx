export default function Introduccion() {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <style>{`
        @keyframes flowLine {
          0% { background-position: 0% 0; }
          100% { background-position: 200px 0; }
        }
        .flow-divider {
          background-image: repeating-linear-gradient(
            90deg,
            var(--color-teal) 0px, var(--color-teal) 10px,
            transparent 10px, transparent 18px
          );
          background-size: 200px 2px;
          animation: flowLine 6s linear infinite;
        }
      `}</style>

      <div className="mb-10 pb-6 relative overflow-hidden">
        <div className="lines-bg absolute inset-0 text-line opacity-60 pointer-events-none hidden sm:block" aria-hidden="true" />
        <div className="relative">
          <p className="font-data text-xs text-teal mb-2">Introducción</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Datos abiertos, resultados dispersos
          </h1>
          <p className="text-base text-muted leading-relaxed mt-3 max-w-xl">
            El contexto de la información geoespacial en España y los retos de interoperabilidad en la gestión de recursos hídricos.
          </p>
          <div className="flow-divider h-[2px] w-full mt-6" />
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-7 space-y-5 text-[15px] text-ink leading-relaxed">
          <p>
            En España, la información geoespacial es accesible para todo el público gracias a una sólida infraestructura de datos abiertos. Hoy en día, el verdadero desafío no está en la disponibilidad de los datos, sino en la complejidad de su transformación e integración para la obtención de resultados analíticos de alto valor.
          </p>
          <p>
            En el ámbito de la <strong className="font-semibold text-ink">hidrología</strong>, esta dificultad se encuentra presente debido a que la información no se encuentra centralizada. En lugar de un sistema unificado, los datos están repartidos entre las distintas demarcaciones hidrográficas y confederaciones. A menudo, estas entidades carecen de estructuras o formatos normalizados compartidos, imposibilitando la interoperabilidad fluida entre organismos.
          </p>
          <p>
            Paralelamente, el sector de la energía se enfrenta a un escenario similar, donde la gestión aislada de la información por parte de cada nivel administrativo dificulta una visión de conjunto. Esta separación no solo complica el análisis técnico e hidrológico a nivel estatal, sino que puede generar ineficiencias analíticas al carecer de un repositorio unificado y estandarizado.
          </p>
        </div>

        <div className="md:col-span-5">
          <div className="border-l-2 border-teal pl-5 py-1">
            <p className="font-display text-xl text-ink leading-snug">
              El verdadero desafío actual reside en transformar datos aislados en conocimiento integrado e interoperable a escala nacional.
            </p>
          </div>

          <div className="mt-8 border border-line bg-surface p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(14,36,34,0.1)]">
            <div className="lines-bg-soft absolute inset-0 text-line opacity-60 pointer-events-none" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-[11px] text-muted mb-3">Este proyecto, en una frase</h2>
              <p className="text-sm text-ink leading-relaxed">
                Un pipeline que une niveles de embalse, caudales fluviales, geometría oficial y precios de mercado en un único modelo geoespacial, actualizado de forma automática.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
