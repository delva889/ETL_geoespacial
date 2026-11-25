import { useEffect, useState } from 'react';

export const REPO_URL = 'https://github.com/delva889/ETL_geoespacial';
export const MEMORIA_URL = `${REPO_URL}/blob/main/docs/Memoria_Tecnica_ETL_GIS.pdf`;
export const AUTHOR = 'Carlos del Valle';
export const AUTORES = 'Carlos del Valle';

export const PROYECTO = 'Modelo de transformación e integración de datos geoespaciales';
export const PROYECTO_AMBITO = 'aplicados a la energía hidráulica en España';

const BASE = import.meta.env.BASE_URL;

export interface EmbalseProperties {
  fid?: number;
  pantano: string;
  cuenca: string;
  cuenca_norm?: string;
  capacidad: number | string;
  embalsada: number | string;
  variacion: number | string;
  mwh_max?: number | string;
  mwh_conocidos?: number | string;
  precio_actual?: number | string;
  precio_max?: number | string;
  url_descarga?: string;
  centroide?: [number, number];
}

export interface EmbalseFeature {
  type: 'Feature';
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
  properties: EmbalseProperties;
}

export interface EmbalsesGeoJSON {
  type: 'FeatureCollection';
  features: EmbalseFeature[];
}

export interface CaudalEntry {
  nombre: string;
  cuenca: string;
  caudal: number;
}

export interface LastUpdateInfo {
  timestamp: string;
  total_geometrias?: number;
  embalses_con_datos?: number;
  embalses_sin_datos?: number;
  precio_omie_eur_mwh?: number;
  estaciones_caudal?: number;
}

export interface Embalse {
  id: string;
  nombre: string;
  cuenca: string;
  capacidad: number;
  embalsada: number | null;
  variacion: number;
  pct: number | null;
  mwh: number;
  mwhMax: number;
  valor: number;
  center: [number, number] | null;
  escena: SentinelScene | null;
  feature: EmbalseFeature;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

export const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export type Estado = 'critico' | 'alerta' | 'optimo' | 'excelente' | 'nodata';

export const ESTADOS: Record<Estado, { label: string; rango: string; color: string }> = {
  excelente: { label: 'Excelente', rango: '≥ 80 %', color: '#2f5bff' },
  optimo: { label: 'Óptimo', rango: '60–80 %', color: '#6fa3ff' },
  alerta: { label: 'Alerta', rango: '35–60 %', color: '#e9a10f' },
  critico: { label: 'Crítico', rango: '< 35 %', color: '#ef5130' },
  nodata: { label: 'Sin lectura', rango: '—', color: '#a3aab5' },
};

export const estadoDe = (pct: number | null): Estado => {
  if (pct === null) return 'nodata';
  if (pct < 35) return 'critico';
  if (pct < 60) return 'alerta';
  if (pct < 80) return 'optimo';
  return 'excelente';
};

export interface SentinelScene {
  url: string;
  satelite: string;
  tile: string;
  fecha: string;
}

export function parseSentinel(url?: string): SentinelScene | null {
  if (!url) return null;
  const m = url.match(/(S2[ABC])_(\d{2}[A-Z]{3})_(\d{4})(\d{2})(\d{2})_\d+_L2A/);
  if (!m) return null;
  return { url, satelite: `Sentinel-${m[1].slice(1)}`, tile: m[2], fecha: `${m[3]}-${m[4]}-${m[5]}` };
}

export function copernicusBrowserUrl(lat: number, lng: number, fecha?: string) {
  const p = new URLSearchParams({ zoom: '13', lat: lat.toFixed(5), lng: lng.toFixed(5), datasetId: 'S2_L2A_CDAS' });
  if (fecha) {
    p.set('fromTime', `${fecha}T00:00:00.000Z`);
    p.set('toTime', `${fecha}T23:59:59.999Z`);
  }
  return `https://browser.dataspace.copernicus.eu/?${p.toString()}`;
}

function bboxCenter(f: EmbalseFeature): [number, number] | null {
  const polys = f.geometry.type === 'MultiPolygon'
    ? (f.geometry.coordinates as number[][][][])
    : [f.geometry.coordinates as number[][][]];
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180, n = 0;
  for (const poly of polys) for (const [lng, lat] of poly[0] ?? []) {
    n++;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return n ? [(minLat + maxLat) / 2, (minLng + maxLng) / 2] : null;
}

export function normalizar(f: EmbalseFeature, i: number): Embalse {
  const p = f.properties;
  const capacidad = num(p.capacidad) ?? 0;
  const embalsada = num(p.embalsada);
  const pct = capacidad > 0 && embalsada !== null ? Math.min((embalsada / capacidad) * 100, 100) : null;
  return {
    id: String(p.fid ?? i),
    nombre: p.pantano,
    cuenca: p.cuenca_norm || p.cuenca || 'Sin cuenca',
    capacidad,
    embalsada,
    variacion: num(p.variacion) ?? 0,
    pct,
    mwh: num(p.mwh_conocidos) ?? 0,
    mwhMax: num(p.mwh_max) ?? 0,
    valor: num(p.precio_actual) ?? 0,
    center: bboxCenter(f) ?? (p.centroide ?? null),
    escena: parseSentinel(p.url_descarga),
    feature: f,
  };
}

async function getJSON<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}${file}`);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const loadEmbalses = () =>
  getJSON<EmbalsesGeoJSON>('data.lite.geojson').catch(() => getJSON<EmbalsesGeoJSON>('data.geojson'));

export const loadCaudales = () => getJSON<CaudalEntry[]>('caudales.json');

export function useLastUpdate() {
  const [info, setInfo] = useState<LastUpdateInfo | null>(null);
  useEffect(() => {
    getJSON<LastUpdateInfo>('last_update.json').then(setInfo).catch(() => setInfo(null));
  }, []);
  return info;
}

export const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
