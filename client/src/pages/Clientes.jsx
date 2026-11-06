import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { abrirWhatsApp, api, fecha, fechaHora, moneda, urlArchivo } from '../api.js';
import { MATERIAS, REGIMENES, USOS_CFDI } from '../catalogos.js';
import { Boton, Buscador, Campo, Encabezado, Icono, Modal, Vacio, useAviso } from '../components/ui.jsx';

const VACIO = { nombre: '', tipoPersona: 'fisica', telefono: '', email: '', materia: '', expediente: '', domicilio: '', curp: '', rfc: '', identificacion: '', ocupacion: '', notas: '', regimenFiscal: '', codigoPostal: '', usoCfdi: 'G03' };

export function FormularioCliente({ inicial, onCerrar, onGuardado }) {
  const avisar = useAviso();
  const [d, setD] = useState({ ...VACIO, ...inicial });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const cambiar = (campo) => (e) => setD({ ...d, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const res = d._id
        ? await api(`/clientes/${d._id}`, { method: 'PUT', body: d })
        : await api('/clientes', { method: 'POST', body: d });
      avisar(d._id ? 'Cliente actualizado' : 'Cliente registrado');
      onGuardado(res);
    } catch (er) {
      setError(er.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={d._id ? 'Editar cliente' : 'Nuevo cliente'} onCerrar={onCerrar} ancho="lg"
      pie={<><Boton variante="borde" onClick={onCerrar}>Cancelar</Boton><Boton type="submit" form="form-cliente" disabled={guardando}>Guardar</Boton></>}>
      {error && <div className="error-caja">{error}</div>}
      <form id="form-cliente" className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Nombre completo o razón social *" ancho="completo">
          <input value={d.nombre} onChange={cambiar('nombre')} required autoFocus />
        </Campo>
        <Campo etiqueta="Teléfono / WhatsApp" ancho="tercio"><input value={d.telefono} onChange={cambiar('telefono')} placeholder="477 123 4567" /></Campo>
        <Campo etiqueta="Correo electrónico" ancho="tercio"><input type="email" value={d.email} onChange={cambiar('email')} /></Campo>
        <Campo etiqueta="Tipo de persona" ancho="tercio">
          <select value={d.tipoPersona} onChange={cambiar('tipoPersona')}>
            <option value="fisica">Persona física</option>
            <option value="moral">Persona moral (empresa)</option>
          </select>
        </Campo>
        <Campo etiqueta="Materia del asunto" ancho="tercio">
          <select value={d.materia} onChange={cambiar('materia')}>
            <option value="">—</option>
            {MATERIAS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Número de expediente" ancho="tercio"><input value={d.expediente} onChange={cambiar('expediente')} /></Campo>
        <Campo etiqueta="Ocupación" ancho="tercio"><input value={d.ocupacion} onChange={cambiar('ocupacion')} /></Campo>
        <Campo etiqueta="Domicilio" ancho="completo"><input value={d.domicilio} onChange={cambiar('domicilio')} /></Campo>
        <Campo etiqueta="CURP" ancho="tercio"><input value={d.curp} onChange={cambiar('curp')} maxLength={18} /></Campo>
        <Campo etiqueta="RFC" ancho="tercio"><input value={d.rfc} onChange={cambiar('rfc')} maxLength={13} /></Campo>
        <Campo etiqueta="Identificación" ancho="tercio"><input value={d.identificacion} onChange={cambiar('identificacion')} placeholder="INE folio …" /></Campo>
        <Campo etiqueta="Régimen fiscal (para facturar)" ancho="tercio">
          <select value={d.regimenFiscal} onChange={cambiar('regimenFiscal')}>
            <option value="">—</option>
            {REGIMENES.map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="C.P. fiscal" ancho="tercio"><input value={d.codigoPostal} onChange={cambiar('codigoPostal')} maxLength={5} /></Campo>
        <Campo etiqueta="Uso de CFDI" ancho="tercio">
          <select value={d.usoCfdi} onChange={cambiar('usoCfdi')}>
            {USOS_CFDI.map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Notas" ancho="completo"><textarea value={d.notas} onChange={cambiar('notas')} rows={3} /></Campo>
      </form>
    </Modal>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [q, setQ] = useState('');
  const [editando, setEditando] = useState(null);
  const navegar = useNavigate();

  const cargar = useCallback(() => {
    api(`/clientes?q=${encodeURIComponent(q)}`).then(setClientes).catch(() => {});
  }, [q]);
  useEffect(() => { const t = setTimeout(cargar, 200); return () => clearTimeout(t); }, [cargar]);

  return (
    <>
      <Encabezado titulo="Clientes" subtitulo={`${clientes.length} cliente(s) registrados`}>
        <Boton icono="mas" onClick={() => setEditando({})}>Nuevo cliente</Boton>
      </Encabezado>
      <div className="barra"><Buscador valor={q} onCambio={setQ} placeholder="Buscar por nombre, teléfono, RFC o expediente…" /></div>
      {clientes.length === 0 ? (
        <div className="tarjeta"><Vacio icono="clientes" titulo={q ? 'Sin resultados' : 'Aún no hay clientes'}>{q ? 'Pruebe con otra búsqueda.' : 'Registre su primer cliente con el botón “Nuevo cliente”.'}</Vacio></div>
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Teléfono</th><th>Materia</th><th>Expediente</th><th>Registro</th><th /></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c._id}>
                  <td><Link to={`/clientes/${c._id}`}>{c.nombre}</Link>{c.email && <div className="muted chico">{c.email}</div>}</td>
                  <td>{c.telefono}</td>
                  <td>{c.materia && <span className="etiqueta">{c.materia}</span>}</td>
                  <td>{c.expediente}</td>
                  <td className="muted">{fecha(c.createdAt)}</td>
                  <td className="acc">
                    {c.telefono && <button type="button" className="btn-icono" title="WhatsApp" onClick={() => abrirWhatsApp(c.telefono)}><Icono nombre="whatsapp" tam={18} /></button>}
                    <button type="button" className="btn-icono" title="Editar" onClick={() => setEditando(c)}><Icono nombre="editar" tam={18} /></button>
                    <button type="button" className="btn-icono" title="Ver expediente" onClick={() => navegar(`/clientes/${c._id}`)}><Icono nombre="flecha" tam={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editando && <FormularioCliente inicial={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); cargar(); }} />}
    </>
  );
}

export function DetalleCliente() {
  const { id } = useParams();
  const navegar = useNavigate();
  const avisar = useAviso();
  const [c, setC] = useState(null);
  const [rel, setRel] = useState({ citas: [], documentos: [], contratos: [], facturas: [] });
  const [editando, setEditando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [cliente, citas, documentos, contratos, facturas] = await Promise.all([
        api(`/clientes/${id}`),
        api(`/citas?cliente=${id}&orden=desc`),
        api(`/documentos?cliente=${id}`),
        api(`/contratos?cliente=${id}`),
        api(`/facturas?cliente=${id}`),
      ]);
      setC(cliente);
      setRel({ citas, documentos, contratos, facturas });
    } catch (e) {
      avisar(e.message, 'error');
    }
  }, [id, avisar]);
  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar definitivamente a ${c.nombre}?`)) return;
    try {
      await api(`/clientes/${id}`, { method: 'DELETE' });
      avisar('Cliente eliminado');
      navegar('/clientes');
    } catch (e) {
      avisar(e.message, 'error');
    }
  };

  if (!c) return null;
  const dato = (t, v) => v ? <div><dt>{t}</dt><dd>{v}</dd></div> : null;

  return (
    <>
      <Encabezado titulo={c.nombre} subtitulo={[c.materia, c.expediente && `Exp. ${c.expediente}`].filter(Boolean).join(' · ')}>
        <Link to="/clientes" className="btn btn-borde"><Icono nombre="izq" tam={17} /><span>Clientes</span></Link>
        {c.telefono && <Boton icono="whatsapp" variante="borde" onClick={() => abrirWhatsApp(c.telefono)}>WhatsApp</Boton>}
        <Boton icono="editar" variante="oscuro" onClick={() => setEditando(true)}>Editar</Boton>
        <Boton icono="borrar" variante="peligro" onClick={eliminar} title="Eliminar cliente" />
      </Encabezado>

      <section className="tarjeta">
        <dl className="datos-lista">
          {dato('Teléfono', c.telefono)}{dato('Correo', c.email)}{dato('Tipo', c.tipoPersona === 'moral' ? 'Persona moral' : 'Persona física')}
          {dato('Domicilio', c.domicilio)}{dato('CURP', c.curp)}{dato('RFC', c.rfc)}{dato('Identificación', c.identificacion)}
          {dato('Ocupación', c.ocupacion)}{dato('Régimen fiscal', c.regimenFiscal)}{dato('C.P. fiscal', c.codigoPostal)}
          {dato('Cliente desde', fecha(c.createdAt))}
        </dl>
        {c.notas && <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}><strong>Notas:</strong> {c.notas}</p>}
      </section>

      <div className="rejilla-2" style={{ marginTop: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))' }}>
        <section className="tarjeta">
          <h2>Citas</h2>
          {rel.citas.length === 0 ? <p className="muted">Sin citas.</p> : (
            <table className="tabla"><tbody>
              {rel.citas.slice(0, 10).map((x) => (
                <tr key={x._id}><td className="muted">{fechaHora(x.inicio)}</td><td>{x.titulo}{x.notas && <div className="muted chico" style={{ whiteSpace: 'pre-wrap' }}>{x.notas}</div>}</td><td><span className="etiqueta">{x.estado}</span></td></tr>
              ))}
            </tbody></table>
          )}
          <Link to="/agenda" className="btn btn-borde btn-chico" style={{ marginTop: '1rem' }}>Ir a la agenda</Link>
        </section>
        <section className="tarjeta">
          <h2>Documentos</h2>
          {rel.documentos.length === 0 ? <p className="muted">Sin documentos.</p> : (
            <table className="tabla"><tbody>
              {rel.documentos.map((x) => (
                <tr key={x._id}>
                  <td><a href={urlArchivo(x._id)} target="_blank" rel="noreferrer">{x.titulo}</a><div className="muted chico">{x.tipo}{x.expediente ? ` · Exp. ${x.expediente}` : ''}</div></td>
                  <td className="muted">{fecha(x.fechaDocumento || x.createdAt)}</td>
                  <td className="acc"><a className="btn-icono" href={urlArchivo(x._id, true)} title="Descargar"><Icono nombre="descargar" tam={18} /></a></td>
                </tr>
              ))}
            </tbody></table>
          )}
          <Link to={`/documentos?cliente=${id}`} className="btn btn-borde btn-chico" style={{ marginTop: '1rem' }}>Subir documento</Link>
        </section>
        <section className="tarjeta">
          <h2>Contratos y escritos</h2>
          {rel.contratos.length === 0 ? <p className="muted">Sin documentos generados.</p> : (
            <table className="tabla"><tbody>
              {rel.contratos.map((x) => <tr key={x._id}><td>{x.titulo}</td><td className="muted">{fecha(x.fecha)}</td></tr>)}
            </tbody></table>
          )}
          <Link to={`/contratos?cliente=${id}`} className="btn btn-borde btn-chico" style={{ marginTop: '1rem' }}>Generar contrato</Link>
        </section>
        <section className="tarjeta">
          <h2>Facturas</h2>
          {rel.facturas.length === 0 ? <p className="muted">Sin facturas.</p> : (
            <table className="tabla"><tbody>
              {rel.facturas.map((x) => <tr key={x._id}><td>{x.serie}-{x.folio}</td><td className="muted">{fecha(x.fecha)}</td><td className="num">{moneda(x.total)}</td><td><span className="etiqueta">{x.estatus}</span></td></tr>)}
            </tbody></table>
          )}
          <Link to="/facturas" className="btn btn-borde btn-chico" style={{ marginTop: '1rem' }}>Ir a facturas</Link>
        </section>
      </div>
      {editando && <FormularioCliente inicial={c} onCerrar={() => setEditando(false)} onGuardado={() => { setEditando(false); cargar(); }} />}
    </>
  );
}
