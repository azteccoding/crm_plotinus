import { useCallback, useEffect, useMemo, useState } from 'react';
import { aInputFecha, aInputFechaHora, api, hora } from '../api.js';
import { TIPOS_CITA } from '../catalogos.js';
import { Boton, Campo, Encabezado, Icono, Modal, Pestanas, SelectorCliente, Vacio, useAviso, useClientes } from '../components/ui.jsx';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ESTADOS = { programada: 'Programada', realizada: 'Realizada', cancelada: 'Cancelada' };

function FormularioCita({ inicial, clientes, onCerrar, onGuardado }) {
  const avisar = useAviso();
  const [d, setD] = useState(() => ({
    titulo: '', tipo: 'Consulta', duracionMin: 60, lugar: '', notas: '', estado: 'programada',
    ...inicial,
    cliente: inicial.cliente?._id || inicial.cliente || '',
    inicio: aInputFechaHora(inicial.inicio),
  }));
  const [error, setError] = useState('');
  const cambiar = (campo) => (e) => setD({ ...d, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const cuerpo = { ...d, inicio: new Date(d.inicio).toISOString(), duracionMin: Number(d.duracionMin) || 60 };
      if (d._id) await api(`/citas/${d._id}`, { method: 'PUT', body: cuerpo });
      else await api('/citas', { method: 'POST', body: cuerpo });
      avisar(d._id ? 'Cita actualizada' : 'Cita agendada');
      onGuardado();
    } catch (er) { setError(er.message); }
  };

  const eliminar = async () => {
    if (!window.confirm('¿Eliminar esta cita?')) return;
    await api(`/citas/${d._id}`, { method: 'DELETE' });
    avisar('Cita eliminada');
    onGuardado();
  };

  return (
    <Modal titulo={d._id ? 'Editar cita' : 'Nueva cita'} onCerrar={onCerrar}
      pie={<>
        {d._id && <Boton variante="peligro" icono="borrar" onClick={eliminar} style={{ marginRight: 'auto' }}>Eliminar</Boton>}
        <Boton variante="borde" onClick={onCerrar}>Cancelar</Boton>
        <Boton type="submit" form="form-cita">Guardar</Boton>
      </>}>
      {error && <div className="error-caja">{error}</div>}
      <form id="form-cita" className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Asunto *" ancho="completo"><input value={d.titulo} onChange={cambiar('titulo')} required autoFocus placeholder="Ej. Primera consulta, audiencia de conciliación…" /></Campo>
        <Campo etiqueta="Cliente" ancho="completo"><SelectorCliente clientes={clientes} valor={d.cliente} onCambio={(v) => setD({ ...d, cliente: v })} opcional /></Campo>
        <Campo etiqueta="Fecha y hora *"><input type="datetime-local" value={d.inicio} onChange={cambiar('inicio')} required /></Campo>
        <Campo etiqueta="Duración">
          <select value={d.duracionMin} onChange={cambiar('duracionMin')}>
            {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Tipo" ancho="tercio"><select value={d.tipo} onChange={cambiar('tipo')}>{TIPOS_CITA.map((t) => <option key={t}>{t}</option>)}</select></Campo>
        <Campo etiqueta="Estado" ancho="tercio">
          <select value={d.estado} onChange={cambiar('estado')}>{Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Campo>
        <Campo etiqueta="Lugar" ancho="tercio"><input value={d.lugar} onChange={cambiar('lugar')} placeholder="Oficina, juzgado…" /></Campo>
        <Campo etiqueta="Notas" ancho="completo"><textarea value={d.notas} onChange={cambiar('notas')} rows={3} /></Campo>
      </form>
    </Modal>
  );
}

function Calendario({ mes, setMes, seleccion, setSeleccion, conCitas }) {
  const dias = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const inicio = new Date(primero);
    inicio.setDate(1 - ((primero.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d; });
  }, [mes]);
  const hoy = aInputFecha(new Date());
  const mover = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));
  return (
    <div className="tarjeta">
      <div className="calendario-cabeza">
        <button type="button" className="btn-icono" onClick={() => mover(-1)} aria-label="Mes anterior"><Icono nombre="izq" /></button>
        <strong>{mes.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" className="btn-icono" onClick={() => mover(1)} aria-label="Mes siguiente"><Icono nombre="der" /></button>
      </div>
      <div className="calendario">
        {DIAS.map((d) => <span key={d} className="dia-nombre">{d}</span>)}
        {dias.map((d) => {
          const clave = aInputFecha(d);
          const clases = [d.getMonth() !== mes.getMonth() && 'fuera', clave === hoy && 'hoy', clave === seleccion && 'sel'].filter(Boolean).join(' ');
          return (
            <button key={clave} type="button" className={clases} onClick={() => setSeleccion(clave === seleccion ? null : clave)}>
              {d.getDate()}{conCitas.has(clave) && <i />}
            </button>
          );
        })}
      </div>
      <p className="muted chico" style={{ marginBottom: 0 }}>Toque un día para ver solo sus citas.</p>
    </div>
  );
}

export default function Agenda() {
  const [clientes] = useClientes();
  const [vista, setVista] = useState('proximas');
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [seleccion, setSeleccion] = useState(null);
  const [citasMes, setCitasMes] = useState([]);
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    const desdeMes = new Date(mes.getFullYear(), mes.getMonth() - 1, 20);
    const hastaMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 12);
    api(`/citas?desde=${desdeMes.toISOString()}&hasta=${hastaMes.toISOString()}`).then(setCitasMes).catch(() => {});
    let ruta;
    if (seleccion) {
      const d = new Date(`${seleccion}T00:00`);
      const h = new Date(d); h.setDate(h.getDate() + 1);
      ruta = `/citas?desde=${d.toISOString()}&hasta=${h.toISOString()}`;
    } else if (vista === 'proximas') {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      ruta = `/citas?desde=${d.toISOString()}`;
    } else {
      ruta = `/citas?hasta=${new Date().toISOString()}&orden=desc`;
    }
    api(ruta).then(setLista).catch(() => {});
  }, [mes, seleccion, vista]);
  useEffect(() => { cargar(); }, [cargar]);

  const conCitas = useMemo(() => new Set(citasMes.filter((c) => c.estado !== 'cancelada').map((c) => aInputFecha(c.inicio))), [citasMes]);
  const grupos = useMemo(() => {
    const m = new Map();
    for (const c of lista) {
      const k = aInputFecha(c.inicio);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    }
    return [...m.entries()];
  }, [lista]);

  const nueva = () => {
    const base = seleccion ? new Date(`${seleccion}T10:00`) : new Date();
    if (!seleccion) { base.setMinutes(0, 0, 0); base.setHours(base.getHours() + 1); }
    setEditando({ inicio: base });
  };

  const marcar = async (c, estado) => {
    await api(`/citas/${c._id}`, { method: 'PUT', body: { estado } });
    cargar();
  };

  return (
    <>
      <Encabezado titulo="Agenda del abogado" subtitulo="Las citas programadas aparecen como alertas en el inicio.">
        <Boton icono="mas" onClick={nueva}>Nueva cita</Boton>
      </Encabezado>
      <div className="agenda">
        <Calendario mes={mes} setMes={setMes} seleccion={seleccion} setSeleccion={setSeleccion} conCitas={conCitas} />
        <div>
          {seleccion ? (
            <div className="barra">
              <strong style={{ textTransform: 'capitalize' }}>{new Date(`${seleccion}T00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
              <Boton variante="borde" className="btn-chico" onClick={() => setSeleccion(null)}>Ver todas</Boton>
            </div>
          ) : (
            <Pestanas valor={vista} onCambio={setVista} opciones={[['proximas', 'Próximas'], ['pasadas', 'Pasadas']]} />
          )}
          {grupos.length === 0 ? (
            <div className="tarjeta"><Vacio icono="agenda" titulo="Sin citas">Use “Nueva cita” para agendar.</Vacio></div>
          ) : grupos.map(([dia, citas]) => (
            <div key={dia} className="dia-grupo">
              <h3>{new Date(`${dia}T00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
              {citas.map((c) => (
                <div key={c._id} className={`cita-fila ${c.estado}`}>
                  <span className="cita-hora">{hora(c.inicio)}</span>
                  <div>
                    <strong>{c.titulo}</strong>{c.cliente?.nombre && <span> — {c.cliente.nombre}</span>}
                    <div className="muted chico">{c.tipo}{c.lugar ? ` · ${c.lugar}` : ''} · {c.duracionMin} min · {ESTADOS[c.estado]}</div>
                  </div>
                  <div className="acc">
                    {c.estado === 'programada' && <button type="button" className="btn btn-borde btn-chico" onClick={() => marcar(c, 'realizada')}>Realizada</button>}
                    <button type="button" className="btn-icono" title="Editar" onClick={() => setEditando(c)}><Icono nombre="editar" tam={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {editando && <FormularioCita inicial={editando} clientes={clientes} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); cargar(); }} />}
    </>
  );
}
