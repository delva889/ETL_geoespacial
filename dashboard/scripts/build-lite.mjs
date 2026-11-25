import { readFileSync, writeFileSync } from 'node:fs';

const [input, output, tolArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('Uso: node scripts/build-lite.mjs <entrada> <salida> [tolerancia]');
  process.exit(1);
}
const TOL = Number(tolArg ?? 0.00012);
const TOL2 = TOL * TOL;
const round = (n) => Math.round(n * 1e5) / 1e5;

function segDist2(p, a, b) {
  let x = a[0], y = a[1];
  let dx = b[0] - x, dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p[0] - x; dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplify(points) {
  if (points.length <= 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = TOL2, idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segDist2(points[i], points[first], points[last]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (idx !== -1) {
      keep[idx] = 1;
      stack.push([first, idx], [idx, last]);
    }
  }
  const out = points.filter((_, i) => keep[i]);
  return out.length >= 4 ? out : points;
}

const simplifyPolygon = (poly) =>
  poly.map((ring, i) => (i === 0 ? simplify(ring) : ring.length > 20 ? simplify(ring) : ring))
      .map((ring) => ring.map(([x, y]) => [round(x), round(y)]));

const data = JSON.parse(readFileSync(input, 'utf8'));
let before = 0, after = 0;
for (const f of data.features) {
  const g = f.geometry;
  if (!g) continue;
  const count = (polys) => polys.reduce((s, p) => s + p.reduce((t, r) => t + r.length, 0), 0);
  if (g.type === 'Polygon') {
    before += count([g.coordinates]);
    g.coordinates = simplifyPolygon(g.coordinates);
    after += count([g.coordinates]);
  } else if (g.type === 'MultiPolygon') {
    before += count(g.coordinates);
    g.coordinates = g.coordinates.map(simplifyPolygon);
    after += count(g.coordinates);
  }
}
writeFileSync(output, JSON.stringify(data));
console.log(`data.lite.geojson: ${before} → ${after} vértices (${((after / before) * 100).toFixed(1)} %)`);
