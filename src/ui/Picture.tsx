import type { Picture as PictureSpec } from '../content/types';

const TONES = { green: '#58cc02', blue: '#1cb0f6', orange: '#ff9600', purple: '#ce82ff' };

export function Picture({ spec }: { spec: PictureSpec }) {
  return <div className="pic" aria-hidden="true">{render(spec)}</div>;
}

function render(spec: PictureSpec) {
  switch (spec.type) {
    case 'bar': return <Bar spec={spec} />;
    case 'hundred': return <Hundred spec={spec} />;
    case 'compare': return <Compare spec={spec} />;
    case 'doubleLine': return <DoubleLine spec={spec} />;
    case 'pattern': return <Pattern spec={spec} />;
    case 'table': return <Table spec={spec} />;
    case 'numberLine': return <NumberLine spec={spec} />;
    case 'angles': return <Angles spec={spec} />;
    case 'parallel': return <Parallel spec={spec} />;
    case 'solid': return <Solid spec={spec} />;
    case 'triangleArea': return <TriangleArea spec={spec} />;
  }
}

function Bar({ spec }: { spec: Extract<PictureSpec, { type: 'bar' }> }) {
  const W = 320, H = 110, x0 = 10, y0 = 34, h = 44;
  const w = W - 20;
  const cell = w / spec.parts;
  const shadedW = Math.min(w, cell * spec.shaded);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {spec.totalLabel && <text x={x0 + w / 2} y={18} textAnchor="middle" fontSize="15" fontWeight="800" fill="#3c3c3c">{spec.totalLabel}</text>}
      <rect x={x0} y={y0} width={w} height={h} rx={8} fill="#fff" stroke="#e5e5e5" strokeWidth={3} />
      <rect x={x0} y={y0} width={shadedW} height={h} rx={8} fill="#58cc02" />
      {Array.from({ length: spec.parts - 1 }, (_, i) => (
        <line key={i} x1={x0 + cell * (i + 1)} y1={y0} x2={x0 + cell * (i + 1)} y2={y0 + h} stroke="#fff" strokeWidth={2} opacity={0.9} />
      ))}
      <rect x={x0} y={y0} width={w} height={h} rx={8} fill="none" stroke="#3c3c3c" strokeWidth={2} />
      {spec.shadedLabel && <text x={x0 + Math.max(shadedW / 2, 30)} y={y0 + h + 24} textAnchor="middle" fontSize="15" fontWeight="800" fill="#46a302">{spec.shadedLabel}</text>}
      {spec.partLabel && <text x={x0 + w - 4} y={y0 + h + 24} textAnchor="end" fontSize="13" fontWeight="700" fill="#777">{spec.partLabel}</text>}
    </svg>
  );
}

function Hundred({ spec }: { spec: Extract<PictureSpec, { type: 'hundred' }> }) {
  const S = 20, N = 10, W = S * N + 2;
  const cells = Array.from({ length: 100 }, (_, i) => i);
  const shaded = Math.round(Math.min(100, Math.max(0, spec.shaded)));
  return (
    <svg viewBox={`0 0 ${W} ${W + 26}`} width={W} height={W + 26}>
      {cells.map((i) => {
        const r = Math.floor(i / N), c = i % N;
        return <rect key={i} x={1 + c * S} y={1 + r * S} width={S} height={S} fill={i < shaded ? '#58cc02' : '#fff'} stroke="#cfcfcf" strokeWidth={1} />;
      })}
      {spec.label && <text x={W / 2} y={W + 18} textAnchor="middle" fontSize="14" fontWeight="800" fill="#3c3c3c">{spec.label}</text>}
    </svg>
  );
}

function Compare({ spec }: { spec: Extract<PictureSpec, { type: 'compare' }> }) {
  const W = 320, rowH = 40, labelW = 0, pad = 10;
  const max = spec.max ?? Math.max(...spec.rows.map((r) => r.value)) * 1.05;
  const H = spec.rows.length * rowH + 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {spec.rows.map((r, i) => {
        const w = Math.max(6, ((W - pad * 2 - labelW) * r.value) / max);
        const y = i * rowH + 6;
        return (
          <g key={i}>
            <rect x={pad} y={y} width={W - pad * 2} height={rowH - 12} rx={8} fill="#fff" stroke="#e5e5e5" strokeWidth={2} />
            <rect x={pad} y={y} width={w} height={rowH - 12} rx={8} fill={TONES[r.tone ?? 'blue']} />
            <text x={pad + 10} y={y + (rowH - 12) / 2 + 5} fontSize="14" fontWeight="800" fill="#3c3c3c">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DoubleLine({ spec }: { spec: Extract<PictureSpec, { type: 'doubleLine' }> }) {
  const W = 320, H = 90, x0 = 20, x1 = W - 20;
  const n = spec.top.values.length;
  const step = n > 1 ? (x1 - x0) / (n - 1) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {[{ y: 30, s: spec.top, c: '#1cb0f6' }, { y: 65, s: spec.bottom, c: '#58cc02' }].map(({ y, s, c }, k) => (
        <g key={k}>
          <line x1={x0} y1={y} x2={x1} y2={y} stroke={c} strokeWidth={3} />
          {s.values.map((v, i) => (
            <g key={i}>
              <circle cx={x0 + i * step} cy={y} r={4} fill={c} />
              <text x={x0 + i * step} y={k === 0 ? y - 10 : y + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill="#3c3c3c">{v}</text>
            </g>
          ))}
          <text x={x0} y={k === 0 ? y - 10 : y + 20} textAnchor="end" dx={-8} fontSize="11" fill="#777">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Pattern({ spec }: { spec: Extract<PictureSpec, { type: 'pattern' }> }) {
  const groups = spec.terms.map((count, gi) => ({ count, gi }));
  const unit = 22;
  const gap = 28;
  let x = 10;
  const items: JSX.Element[] = [];
  const labels: JSX.Element[] = [];
  for (const { count, gi } of groups) {
    const start = x;
    if (spec.shape === 'squares') {
      // row of `count` squares sharing sides (matchsticks)
      for (let i = 0; i < count; i++) {
        items.push(<rect key={`${gi}-${i}`} x={x} y={20} width={unit} height={unit} fill="#ddf4ff" stroke="#1cb0f6" strokeWidth={3} />);
        x += unit;
      }
    } else if (spec.shape === 'triangles') {
      for (let i = 0; i < count; i++) {
        const pts = i % 2 === 0 ? `${x},${42} ${x + unit},${42} ${x + unit / 2},${22}` : `${x},${22} ${x + unit},${22} ${x + unit / 2},${42}`;
        items.push(<polygon key={`${gi}-${i}`} points={pts} fill="#f1e3ff" stroke="#ce82ff" strokeWidth={3} strokeLinejoin="round" />);
        x += unit / 2 + 2;
      }
      x += unit / 2;
    } else if (spec.shape === 'dots') {
      const cols = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        items.push(<circle key={`${gi}-${i}`} cx={x + c * 14 + 7} cy={14 + r * 14 + 7} r={5} fill="#58cc02" />);
      }
      x += cols * 14;
    } else {
      // tiles: an L / cross shape grows by adding tiles
      for (let i = 0; i < count; i++) {
        const r = i % 2, c = Math.floor(i / 2);
        items.push(<rect key={`${gi}-${i}`} x={x + c * 16} y={18 + r * 16} width={15} height={15} rx={2} fill="#ffe8c2" stroke="#ff9600" strokeWidth={2} />);
      }
      x += Math.ceil(count / 2) * 16;
    }
    labels.push(<text key={gi} x={(start + x) / 2} y={70} textAnchor="middle" fontSize="13" fontWeight="800" fill="#3c3c3c">{spec.labels?.[gi] ?? `Shape ${gi + 1}`}</text>);
    x += gap;
  }
  const W = Math.max(320, x);
  return <svg viewBox={`0 0 ${W} 80`} width={Math.min(W, 340)} height={80 * Math.min(W, 340) / W}>{items}{labels}</svg>;
}

function Table({ spec }: { spec: Extract<PictureSpec, { type: 'table' }> }) {
  const cols = spec.headers.length;
  const cw = Math.min(70, 320 / cols);
  const W = cw * cols + 2, rh = 30;
  const H = rh * (spec.rows.length + 1) + 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {spec.headers.map((h, c) => (
        <g key={`h${c}`}>
          <rect x={1 + c * cw} y={1} width={cw} height={rh} fill="#ddf4ff" stroke="#1cb0f6" strokeWidth={2} />
          <text x={1 + c * cw + cw / 2} y={1 + rh / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1899d6">{h}</text>
        </g>
      ))}
      {spec.rows.map((row, r) => row.map((cell, c) => (
        <g key={`${r}-${c}`}>
          <rect x={1 + c * cw} y={1 + (r + 1) * rh} width={cw} height={rh} fill="#fff" stroke="#cfcfcf" strokeWidth={1.5} />
          <text x={1 + c * cw + cw / 2} y={1 + (r + 1) * rh + rh / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#3c3c3c">{cell}</text>
        </g>
      )))}
    </svg>
  );
}

function NumberLine({ spec }: { spec: Extract<PictureSpec, { type: 'numberLine' }> }) {
  const W = 320, H = 70, x0 = 16, x1 = W - 16, y = 40;
  const span = spec.max - spec.min || 1;
  const px = (v: number) => x0 + ((v - spec.min) / span) * (x1 - x0);
  const ticks: number[] = [];
  const step = span > 20 ? 5 : span > 12 ? 2 : 1;
  for (let v = spec.min; v <= spec.max; v += step) ticks.push(v);
  const marks = new Set(spec.marks ?? []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <line x1={x0 - 8} y1={y} x2={x1 + 8} y2={y} stroke="#3c3c3c" strokeWidth={2} />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={px(v)} y1={y - 6} x2={px(v)} y2={y + 6} stroke="#3c3c3c" strokeWidth={2} />
          <text x={px(v)} y={y + 22} textAnchor="middle" fontSize="12" fontWeight={marks.has(v) ? 900 : 600} fill={marks.has(v) ? '#1899d6' : '#3c3c3c'}>{v}</text>
        </g>
      ))}
      {[...marks].map((v) => <circle key={`m${v}`} cx={px(v)} cy={y} r={6} fill="#1cb0f6" />)}
      {spec.arrow && (
        <path d={`M ${px(spec.arrow.from)} ${y - 4} Q ${(px(spec.arrow.from) + px(spec.arrow.to)) / 2} ${y - 34} ${px(spec.arrow.to)} ${y - 4}`} fill="none" stroke="#ff9600" strokeWidth={3} markerEnd="url(#arrowhead)" />
      )}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ff9600" /></marker>
      </defs>
    </svg>
  );
}

const INK = '#3c3c3c';
const deg = (v: number | string) => (typeof v === 'number' ? `${v}°` : v);

function Angles({ spec }: { spec: Extract<PictureSpec, { type: 'angles' }> }) {
  const W = 320, H = 170;
  if (spec.kind === 'triangle') {
    const A = [40, 150], B = [280, 150], C = [150, 30];
    const mid = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const la = mid(A, mid(B, C, 0.5), 0.14), lb = mid(B, mid(A, C, 0.5), 0.14), lc = mid(C, mid(A, B, 0.5), 0.16);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <polygon points={`${A} ${B} ${C}`} fill="#ddf4ff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <text x={la[0]} y={la[1] + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>{deg(spec.values[0])}</text>
        <text x={lb[0]} y={lb[1] + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>{deg(spec.values[1])}</text>
        <text x={lc[0]} y={lc[1] + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>{deg(spec.values[2])}</text>
      </svg>
    );
  }
  const cx = 160, cy = spec.kind === 'line' ? 140 : 90, R = 110;
  const total = spec.kind === 'line' ? 180 : 360;
  const degrees = spec.degrees ?? spec.values.map(() => total / spec.values.length);
  const rays: number[] = [0];
  degrees.forEach((d) => rays.push(rays[rays.length - 1] + d));
  const pt = (a: number, r = R) => [cx + r * Math.cos((Math.PI * a) / 180), cy - r * Math.sin((Math.PI * a) / 180)];
  const colors = ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff'];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {degrees.map((d, i) => {
        const a0 = rays[i], a1 = rays[i + 1];
        const p0 = pt(a0, 40), p1 = pt(a1, 40);
        const mid = pt((a0 + a1) / 2, 62);
        return (
          <g key={i}>
            <path d={`M ${cx} ${cy} L ${p0[0]} ${p0[1]} A 40 40 0 ${d > 180 ? 1 : 0} 0 ${p1[0]} ${p1[1]} Z`} fill={colors[i % colors.length]} opacity={0.35} />
            <text x={mid[0]} y={mid[1] + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>{deg(spec.values[i])}</text>
          </g>
        );
      })}
      {spec.kind === 'line'
        ? <line x1={cx - R - 20} y1={cy} x2={cx + R + 20} y2={cy} stroke={INK} strokeWidth={3} />
        : null}
      {rays.slice(0, spec.kind === 'line' ? rays.length : rays.length - 1).map((a, i) => {
        const p = pt(a);
        return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke={INK} strokeWidth={3} strokeLinecap="round" />;
      })}
      <circle cx={cx} cy={cy} r={4} fill={INK} />
    </svg>
  );
}

function Parallel({ spec }: { spec: Extract<PictureSpec, { type: 'parallel' }> }) {
  const W = 320, H = 190, yTop = 55, yBot = 135;
  const xAt = (y: number) => 160 + (95 - y) * 0.9; // transversal from bottom-left to top-right
  const pos = (at: 'top' | 'bottom', q: string) => {
    const y = at === 'top' ? yTop : yBot, x = xAt(y);
    const dx = q.endsWith('R') ? 30 : -30, dy = q.startsWith('U') ? -16 : 24;
    return [x + dx, y + dy];
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <line x1={20} y1={yTop} x2={300} y2={yTop} stroke={INK} strokeWidth={3} />
      <line x1={20} y1={yBot} x2={300} y2={yBot} stroke={INK} strokeWidth={3} />
      <polygon points={`${155},${yTop - 6} ${165},${yTop - 6} ${160},${yTop}`} fill={INK} />
      <polygon points={`${155},${yBot - 6} ${165},${yBot - 6} ${160},${yBot}`} fill={INK} />
      <line x1={xAt(175)} y1={175} x2={xAt(15)} y2={15} stroke="#1cb0f6" strokeWidth={3} />
      {spec.labels.map((l, i) => {
        const [x, y] = pos(l.at, l.q);
        return <text key={i} x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>{l.text}</text>;
      })}
    </svg>
  );
}

function Solid({ spec }: { spec: Extract<PictureSpec, { type: 'solid' }> }) {
  const [l, w, h] = spec.dims;
  const u = spec.unit ?? 'cm';
  const W = 320, H = 180, x = 70, y = 60, L = 150, D = 60, Hh = 80;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <polygon points={`${x},${y} ${x + L},${y} ${x + L},${y + Hh} ${x},${y + Hh}`} fill="#ddf4ff" stroke={INK} strokeWidth={3} />
      <polygon points={`${x},${y} ${x + D},${y - D / 2} ${x + L + D},${y - D / 2} ${x + L},${y}`} fill="#bfe6fb" stroke={INK} strokeWidth={3} />
      <polygon points={`${x + L},${y} ${x + L + D},${y - D / 2} ${x + L + D},${y + Hh - D / 2} ${x + L},${y + Hh}`} fill="#9fd9f8" stroke={INK} strokeWidth={3} />
      <text x={x + L / 2} y={y + Hh + 22} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>{l} {u}</text>
      <text x={x + L + D + 8} y={y + Hh / 2 - D / 4} fontSize="15" fontWeight="800" fill={INK}>{h} {u}</text>
      <text x={x + L + D / 2 + 14} y={y + Hh + 4} fontSize="15" fontWeight="800" fill={INK}>{w} {u}</text>
      {spec.kind === 'cube' && <text x={x} y={y - D / 2 - 10} fontSize="13" fontWeight="700" fill="#777">cube: all edges {l} {u}</text>}
    </svg>
  );
}

function TriangleArea({ spec }: { spec: Extract<PictureSpec, { type: 'triangleArea' }> }) {
  const u = spec.unit ?? 'cm';
  const W = 320, H = 170, A = [40, 140], B = [280, 140], C = [190, 30];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <polygon points={`${A} ${B} ${C}`} fill="#d7ffb8" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <line x1={C[0]} y1={C[1]} x2={C[0]} y2={A[1]} stroke="#ff9600" strokeWidth={3} strokeDasharray="6 5" />
      <rect x={C[0] - 10} y={A[1] - 10} width={10} height={10} fill="none" stroke={INK} strokeWidth={2} />
      <text x={(A[0] + B[0]) / 2} y={A[1] + 22} textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>base {spec.base ? `${spec.base} ${u}` : '?'}</text>
      <text x={C[0] + 8} y={(C[1] + A[1]) / 2} fontSize="15" fontWeight="800" fill="#e08600">h = {spec.height ? `${spec.height} ${u}` : '?'}</text>
    </svg>
  );
}
