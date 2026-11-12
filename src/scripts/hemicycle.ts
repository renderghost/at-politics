const NS = 'http://www.w3.org/2000/svg';

export interface Seat { x: number; y: number; angle: number }

/**
 * Lay out `total` seats in `rows` concentric semicircular rows, seats per row proportional to radius.
 * Returned left to right (by angle). Pure geometry, so it can be unit-tested without a DOM.
 */
export function hemicycleSeats(total = 720, rows = 14, cx = 500, cy = 500, r0 = 180, r1 = 470): Seat[] {
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((r1 - r0) * i) / (rows - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.floor((total * r) / sum));
  let remainder = total - counts.reduce((a, b) => a + b, 0);
  for (let k = rows - 1; remainder > 0; k = (k - 1 + rows) % rows, remainder--) counts[k]! += 1;
  const seats: Seat[] = [];
  radii.forEach((r, row) => {
    const n = counts[row]!;
    for (let j = 0; j < n; j++) {
      const angle = Math.PI - (Math.PI * (j + 0.5)) / n;
      seats.push({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle), angle });
    }
  });
  return seats.sort((a, b) => b.angle - a.angle);
}

function el(name: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

export function drawHemicycle(svg: SVGSVGElement, total = 720, rows = 14): void {
  const seats = hemicycleSeats(total, rows);
  const radius = Math.min(9, ((470 - 180) / (rows - 1)) * 0.36);
  const yourIndex = Math.round(total * 0.62);
  const frag = document.createDocumentFragment();
  seats.forEach((s, i) => {
    frag.appendChild(el('circle', { cx: s.x.toFixed(1), cy: s.y.toFixed(1), r: radius.toFixed(1), class: i === yourIndex ? 'seat lit' : 'seat' }));
  });
  const you = seats[yourIndex]!;
  frag.appendChild(el('circle', { cx: you.x.toFixed(1), cy: you.y.toFixed(1), r: (radius * 2.4).toFixed(1), class: 'you-ring' }));
  const label = el('text', { x: (you.x + radius * 3.2).toFixed(1), y: (you.y - radius * 2.6).toFixed(1) });
  label.textContent = 'Your seat';
  frag.appendChild(label);
  frag.appendChild(el('rect', { x: 466, y: 460, width: 68, height: 30, rx: 4, fill: '#2337C6' }));
  svg.appendChild(frag);
}
