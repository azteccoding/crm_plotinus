import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aInputFecha, api, fecha, tamanoArchivo, urlArchivo } from '../api.js';
import { TIPOS_DOCUMENTO } from '../catalogos.js';
import { Boton, Buscador, Campo, Encabezado, Icono, Modal, SelectorCliente, Vacio, useAviso, useClientes } from '../components/ui.jsx';

function FormularioDocumento({ inicial, clientes, onCerrar, onGuardado }) {
  const avisar = useAviso();
  const editar = Boolean(inicial._id);
  const [d, setD] = useState({
    titulo: '', tipo: 'Acuerdo', expediente: '', juzgado: '', notas: '', ...inicial,
    cliente: inicial.cliente?._id || inicial.cliente || '',
    fechaDocumento: aInputFecha(inicial.fechaDocumento),
  });
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const input = useRef();
  const cambiar = (campo) => (e) => setD({ ...d, [campo]: e.target.value });

  const elegir = (f) => {
    if (!f) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) { setError('Solo se permiten archivos PDF, JPG o PNG.'); return; }
    setError('');
    setArchivo(f);
    if (!d.titulo) setD((x) => ({ ...x, titulo: f.name.replace(/\.[^.]+$/, '') }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!d.cliente) { setError('Seleccione el cliente.'); return; }
    setSubiendo(true);
    setError('');
    try {
      if (editar) {
        await api(`/documentos/${d._id}`, { method: 'PUT', body: d });
      } else {
        if (!archivo) throw new Error('Seleccione el archivo PDF.');
        const form = new FormData();
        for (const k of ['cliente', 'titulo', 'tipo', 'expediente', 'juzgado', 'fechaDocumento', 'notas']) form.append(k, d[k] || '');
        form.append('archivo', archivo);
        await api('/documentos', { method: 'POST', form });
      }
      avisar(editar ? 'Documento actualizado' : 'Documento guardado');
      onGuardado();
    } catch (er) { setError(er.message); } finally { setSubiendo(false); }
  };

  return (
    <Modal titulo={editar ? 'Editar documento' : 'Subir documento'} onCerrar={onCerrar}
      pie={<><Boton variante="borde" onClick={onCerrar}>Cancelar</Boton><Boton type="submit" form="form-doc" disabled={subiendo}>{subiendo ? 'Guardando…' : 'Guardar'}</Boton></>}>
      {error && <div className="error-caja">{error}</div>}
      <form id="form-doc" className="formulario" onSubmit={guardar}>
        {!editar && (
          <div className="campo campo-completo">
            <div className={`zona-archivo ${arrastrando ? 'activa' : ''}`} role="button" tabIndex={0}
              onClick={() => input.current.click()}
              onKeyDown={(e) => e.key === 'Enter' && input.current.click()}
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastrando(false); elegir(e.dataTransfer.files[0]); }}>
              <Icono nombre="subir" tam={28} />
              <strong>{archivo ? archivo.name : 'Arrastre aquí el PDF o haga clic para buscarlo'}</strong>
              <span className="chico">{archivo ? tamanoArchivo(archivo.size) : 'PDF, JPG o PNG · máximo 40 MB'}</span>
            </div>
            <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" hidden onChange={(e) => elegir(e.target.files[0])} />
          </div>
        )}
        <Campo etiqueta="Cliente *" ancho="completo"><SelectorCliente clientes={clientes} valor={d.cliente} onCambio={(v) => setD({ ...d, cliente: v })} /></Campo>
        <Campo etiqueta="Título" ancho="completo"><input value={d.titulo} onChange={cambiar('titulo')} placeholder="Ej. Acuerdo de admisión de demanda" /></Campo>
        <Campo etiqueta="Tipo" ancho="tercio"><select value={d.tipo} onChange={cambiar('tipo')}>{TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}</select></Campo>
        <Campo etiqueta="Expediente" ancho="tercio"><input value={d.expediente} onChange={cambiar('expediente')} /></Campo>
        <Campo etiqueta="Fecha del documento" ancho="tercio"><input type="date" value={d.fechaDocumento} onChange={cambiar('fechaDocumento')} /></Campo>
        <Campo etiqueta="Juzgado / autoridad" ancho="completo"><input value={d.juzgado} onChange={cambiar('juzgado')} /></Campo>
        <Campo etiqueta="Notas" ancho="completo"><textarea value={d.notas} onChange={cambiar('notas')} rows={2} /></Campo>
      </form>
    </Modal>
  );
}

export default function Documentos() {
  const avisar = useAviso();
  const [params, setParams] = useSearchParams();
  const [clientes] = useClientes();
  const [docs, setDocs] = useState([]);
  const [q, setQ] = useState('');
  const [editando, setEditando] = useState(null);
  const cliente = params.get('cliente') || '';

  const cargar = useCallback(() => {
    api(`/documentos?cliente=${cliente}&q=${encodeURIComponent(q)}`).then(setDocs).catch(() => {});
  }, [cliente, q]);
  useEffect(() => { const t = setTimeout(cargar, 200); return () => clearTimeout(t); }, [cargar]);

  const eliminar = async (doc) => {
    if (!window.confirm(`¿Eliminar “${doc.titulo}”? El archivo se borrará del sistema.`)) return;
    await api(`/documentos/${doc._id}`, { method: 'DELETE' });
    avisar('Documento eliminado');
    cargar();
  };

  return (
    <>
      <Encabezado titulo="Documentos" subtitulo="Acuerdos, demandas y demás PDF de cada cliente.">
        <Boton icono="subir" onClick={() => setEditando({ cliente })}>Subir documento</Boton>
      </Encabezado>
      <div className="barra">
        <select className="control" value={cliente} onChange={(e) => setParams(e.target.value ? { cliente: e.target.value } : {})}>
          <option value="">Todos los clientes</option>
          {clientes.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
        <Buscador valor={q} onCambio={setQ} placeholder="Buscar por título, expediente o juzgado…" />
      </div>
      {docs.length === 0 ? (
        <div className="tarjeta"><Vacio titulo="No hay documentos">Use “Subir documento” para guardar el PDF descargado del juzgado.</Vacio></div>
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Documento</th><th>Cliente</th><th>Expediente</th><th>Fecha</th><th className="num">Tamaño</th><th /></tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d._id}>
                  <td>
                    <a href={urlArchivo(d._id)} target="_blank" rel="noreferrer">{d.titulo}</a>
                    <div className="muted chico"><span className="etiqueta">{d.tipo}</span>{d.juzgado ? ` ${d.juzgado}` : ''}</div>
                  </td>
                  <td>{d.cliente?.nombre}</td>
                  <td>{d.expediente}</td>
                  <td className="muted">{fecha(d.fechaDocumento || d.createdAt)}</td>
                  <td className="num muted">{tamanoArchivo(d.tamano)}</td>
                  <td className="acc">
                    <a className="btn-icono" href={urlArchivo(d._id)} target="_blank" rel="noreferrer" title="Ver"><Icono nombre="ver" tam={18} /></a>
                    <a className="btn-icono" href={urlArchivo(d._id, true)} title="Descargar"><Icono nombre="descargar" tam={18} /></a>
                    <button type="button" className="btn-icono" title="Editar datos" onClick={() => setEditando(d)}><Icono nombre="editar" tam={18} /></button>
                    <button type="button" className="btn-icono" title="Eliminar" onClick={() => eliminar(d)}><Icono nombre="borrar" tam={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editando && <FormularioDocumento inicial={editando} clientes={clientes} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); cargar(); }} />}
    </>
  );
}
