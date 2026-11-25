import { useMemo, useState } from 'react';
import { CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import { ESTADOS, estadoDe, fmt, type Embalse } from '../lib/data';

interface Props {
  embalses: Embalse[];
  selectedId: string | null;
  onSelect: (e: Embalse) => void;
}

export default function Puntos({ embalses, selectedId, onSelect }: Props) {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const [zoom, setZoom] = useState(() => map.getZoom());

  const ordenados = useMemo(
    () => embalses.filter((e) => e.center).sort((a, b) => b.capacidad - a.capacidad),
    [embalses],
  );

  const escala = zoom <= 5 ? 0.75 : zoom === 6 ? 1 : zoom === 7 ? 1.3 : 1.6;

  return (
    <>
      {ordenados.map((e) => {
        const estado = estadoDe(e.pct);
        const sel = e.id === selectedId;
        const base = estado === 'nodata' ? 2.5 : Math.min(10, 3 + Math.sqrt(e.capacidad) * 0.16);
        const radius = base * escala;
        return (
          <CircleMarker
            key={e.id}
            center={e.center!}
            radius={sel ? radius + 3 : radius}
            pathOptions={{
              fillColor: ESTADOS[estado].color,
              fillOpacity: estado === 'nodata' ? 0.55 : 0.9,
              color: sel ? '#0b1220' : '#ffffff',
              weight: sel ? 2.5 : 1,
            }}
            eventHandlers={{ click: () => onSelect(e) }}
          >
            <Tooltip className="embalse-tip" direction="top" offset={[0, -radius]}>
              {e.nombre}  {e.pct !== null ? `${fmt(e.pct, 1)} %` : 'sin lectura'}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
