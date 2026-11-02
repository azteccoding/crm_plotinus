import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SERVICIOS_EN_LINEA } from '../catalogos.js';

// Reparte las ligas en tres arcos concéntricos sin que las tarjetas (165 × 60 px) se encimen.
function posiciones(total) {
  const arcos = [[3, 140], [6, 280], [Math.max(total - 9, 0), 430]];
  const res = [];
  for (const [n, radio] of arcos) {
    for (let i = 0; i < n; i += 1) {
      const angulo = Math.PI - (Math.PI * (i + 0.5)) / n;
      res.push({ x: Math.cos(angulo) * radio * 1.2, y: -Math.sin(angulo) * radio });
    }
  }
  return res;
}

export default function AbanicoServicios({ onCerrar }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCerrar]);

  const pos = posiciones(SERVICIOS_EN_LINEA.length);

  return createPortal(
    <div className="abanico-fondo" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="abanico" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
        {SERVICIOS_EN_LINEA.map((s, i) => (
          <a key={s.url} className="abanico-hoja" href={s.url} target="_blank" rel="noreferrer" title={`${s.nombre} — ${s.detalle}`}
            style={{ '--x': `${pos[i].x}px`, '--y': `${pos[i].y}px`, animationDelay: `${i * 35}ms` }}>
            <strong>{s.nombre}</strong>
            <small>{s.detalle}</small>
          </a>
        ))}
        <button type="button" className="abanico-centro" onClick={onCerrar}>
          <div>
            <strong>Servicios en línea</strong>
            <span>Cerrar ✕</span>
          </div>
        </button>
      </div>
    </div>,
    document.body,
  );
}
