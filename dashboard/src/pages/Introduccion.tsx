export default function Introduccion() {
  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12">
      <div className="mb-10 border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4 uppercase tracking-wide">
          1. Introducción
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed">
          El contexto de la información geoespacial en España y los retos de interoperabilidad en la gestión de recursos hídricos.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-8 space-y-6 text-lg text-neutral-700 leading-relaxed">
          <p>
            En España, la información geoespacial es accesible para todo el público gracias a una sólida infraestructura de datos abiertos. Hoy en día, el verdadero desafío no está en la disponibilidad de los datos, sino en la complejidad de su transformación e integración para la obtención de resultados analíticos de alto valor.
          </p>
          <p>
            En el ámbito de la <strong>hidrología</strong>, esta dificultad se encuentra presente debido a que la información no se encuentra centralizada. En lugar de un sistema unificado, los datos están repartidos entre las distintas demarcaciones hidrográficas y confederaciones. A menudo, estas entidades carecen de estructuras o formatos normalizados compartidos, imposibilitando la interoperabilidad fluida entre organismos.
          </p>
          <p>
            Paralelamente, el sector de la energía se enfrenta a un escenario similar, donde la gestión aislada de la información por parte de cada nivel administrativo dificulta una visión de conjunto. Esta separación no solo complica el análisis técnico e hidrológico a nivel estatal, sino que puede generar ineficiencias analíticas al carecer de un repositorio unificado y estandarizado.
          </p>
        </div>
        
        <div className="md:col-span-4">
          <div className="bg-neutral-50 border-l-4 border-neutral-900 p-6 rounded-r">
            <p className="font-semibold italic text-neutral-800 text-lg leading-snug">
              "El verdadero desafío actual reside en transformar datos aislados en conocimiento integrado e interoperable a escala nacional."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
