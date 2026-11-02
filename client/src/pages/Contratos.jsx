import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, fecha, fechaLarga } from '../api.js';
import { Boton, Campo, Encabezado, Icono, Membrete, Modal, Pestanas, SelectorCliente, Vacio, useAviso, useClientes, useConfig, useImprimir } from '../components/ui.jsx';

const RX_VARIABLE = /\{\{\s*([\w.]+)\s*\}\}/g;

const VARIABLES_AUTOMATICAS = {
  'cliente.nombre': 'Nombre del cliente',
  'cliente.domicilio': 'Domicilio del cliente',
  'cliente.rfc': 'RFC del cliente',
  'cliente.curp': 'CURP del cliente',
  'cliente.identificacion': 'Identificación del cliente',
  'cliente.telefono': 'Teléfono del cliente',
  'cliente.email': 'Correo del cliente',
  'despacho.nombre': 'Nombre del despacho',
  'despacho.abogado': 'Abogado responsable',
  'despacho.cedula': 'Cédula profesional',
  'despacho.domicilio': 'Domicilio del despacho',
  'despacho.ciudad': 'Ciudad',
  'despacho.rfc': 'RFC del despacho',
  fecha: 'Fecha de hoy (con letra)',
};

const humanizar = (v) => v.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function variablesDe(cuerpo) {
  return [...new Set([...cuerpo.matchAll(RX_VARIABLE)].map((m) => m[1]))];
}

function valoresAutomaticos(cliente, config) {
  return {
    'cliente.nombre': cliente?.nombre, 'cliente.domicilio': cliente?.domicilio, 'cliente.rfc': cliente?.rfc,
    'cliente.curp': cliente?.curp, 'cliente.identificacion': cliente?.identificacion,
    'cliente.telefono': cliente?.telefono, 'cliente.email': cliente?.email,
    'despacho.nombre': config.nombreDespacho, 'despacho.abogado': config.abogado, 'despacho.cedula': config.cedula,
    'despacho.domicilio': config.domicilio, 'despacho.ciudad': config.ciudad, 'despacho.rfc': config.rfc,
    fecha: fechaLarga(),
  };
}

function rellenar(cuerpo, valores) {
  return cuerpo.replace(RX_VARIABLE, (_, v) => (valores[v] ? valores[v] : '________________'));
}

function VistaPrevia({ cuerpo, valores }) {
  const partes = cuerpo.split(RX_VARIABLE);
  return (
    <div className="vista-previa">
      {partes.map((p, i) => (i % 2 === 1
        ? <mark key={i}>{valores[p] || `[${humanizar(p)}]`}</mark>
        : p))}
    </div>
  );
}

export function HojaContrato({ contenido }) {
  return (
    <>
      <Membrete />
      <div className="texto-legal">{contenido}</div>
    </>
  );
}

function Generador({ plantillas, clientes, clienteInicial, onGuardado }) {
  const { config } = useConfig();
  const avisar = useAviso();
  const imprimir = useImprimir();
  const [plantillaId, setPlantillaId] = useState('');
  const [clienteId, setClienteId] = useState(clienteInicial || '');
  const [extras, setExtras] = useState({});
  const [editandoTexto, setEditandoTexto] = useState(null);

  const plantilla = plantillas.find((p) => p._id === plantillaId);
  const cliente = clientes.find((c) => c._id === clienteId);
  const automaticos = useMemo(() => valoresAutomaticos(cliente, config), [cliente, config]);
  const variables = plantilla ? variablesDe(plantilla.cuerpo) : [];
  const libres = variables.filter((v) => !(v in VARIABLES_AUTOMATICAS));
  const valores = { ...automaticos, ...extras };

  const elegirPlantilla = (id) => { setPlantillaId(id); setEditandoTexto(null); };

  const guardarEImprimir = async () => {
    const contenido = editandoTexto ?? rellenar(plantilla.cuerpo, valores);
    try {
      await api('/contratos', {
        method: 'POST',
        body: {
          plantilla: plantilla._id, titulo: `${plantilla.nombre}${cliente ? ` — ${cliente.nombre}` : ''}`,
          cliente: clienteId || null, valores: extras, contenido,
        },
      });
      imprimir(<HojaContrato contenido={contenido} />);
      avisar('Documento guardado');
      onGuardado();
    } catch (e) { avisar(e.message, 'error'); }
  };

  return (
    <>
      <section className="tarjeta">
        <h2>Elija el tipo de documento</h2>
        <div className="plantillas-lista">
          {plantillas.map((p) => (
            <button key={p._id} type="button" className={`plantilla-op ${p._id === plantillaId ? 'sel' : ''}`} onClick={() => elegirPlantilla(p._id)}>
              <span className="etiqueta etiqueta-oro" style={{ alignSelf: 'flex-start' }}>{p.categoria}</span>
              <strong>{p.nombre}</strong>
              <span>{p.descripcion}</span>
            </button>
          ))}
        </div>
      </section>

      {plantilla && (
        <div className="rejilla-2" style={{ marginTop: '1.25rem', gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.6fr)' }}>
          <section className="tarjeta">
            <h2>Complete los datos</h2>
            <div className="formulario">
              <Campo etiqueta="Cliente" ancho="completo" ayuda="Sus datos (nombre, domicilio, RFC…) se llenan solos.">
                <SelectorCliente clientes={clientes} valor={clienteId} onCambio={setClienteId} opcional />
              </Campo>
              {libres.map((v) => (
                <Campo key={v} etiqueta={humanizar(v)} ancho="completo">
                  <textarea rows={v.length > 18 ? 2 : 1} value={extras[v] || ''} onChange={(e) => setExtras({ ...extras, [v]: e.target.value })} />
                </Campo>
              ))}
            </div>
            {editandoTexto !== null && <div className="info-caja" style={{ marginTop: '1rem' }}>Está editando el texto final. Los cambios en estos campos ya no se reflejarán; use “Descartar cambios” para regresar.</div>}
          </section>
          <section className="tarjeta">
            <div className="barra" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Revise e imprima</h2>
              <div className="acciones">
                {editandoTexto === null
                  ? <Boton variante="borde" icono="editar" onClick={() => setEditandoTexto(rellenar(plantilla.cuerpo, valores))}>Editar texto</Boton>
                  : <Boton variante="borde" onClick={() => setEditandoTexto(null)}>Descartar cambios</Boton>}
                <Boton icono="imprimir" onClick={guardarEImprimir}>Guardar e imprimir</Boton>
              </div>
            </div>
            {editandoTexto === null
              ? <VistaPrevia cuerpo={plantilla.cuerpo} valores={valores} />
              : <textarea className="control editor-texto" value={editandoTexto} onChange={(e) => setEditandoTexto(e.target.value)} />}
          </section>
        </div>
      )}
    </>
  );
}

function FormularioPlantilla({ inicial, onCerrar, onGuardado }) {
  const avisar = useAviso();
  const [d, setD] = useState({ nombre: '', categoria: 'Contrato', descripcion: '', cuerpo: '', ...inicial });
  const [error, setError] = useState('');
  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (d._id) await api(`/plantillas/${d._id}`, { method: 'PUT', body: d });
      else await api('/plantillas', { method: 'POST', body: d });
      avisar('Plantilla guardada');
      onGuardado();
    } catch (er) { setError(er.message); }
  };
  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar la plantilla “${d.nombre}”?`)) return;
    await api(`/plantillas/${d._id}`, { method: 'DELETE' });
    onGuardado();
  };
  const insertar = (v) => setD((x) => ({ ...x, cuerpo: `${x.cuerpo}{{${v}}}` }));
  return (
    <Modal titulo={d._id ? 'Editar plantilla' : 'Nueva plantilla'} onCerrar={onCerrar} ancho="lg"
      pie={<>{d._id && <Boton variante="peligro" icono="borrar" onClick={eliminar} style={{ marginRight: 'auto' }}>Eliminar</Boton>}<Boton variante="borde" onClick={onCerrar}>Cancelar</Boton><Boton type="submit" form="form-pla">Guardar</Boton></>}>
      {error && <div className="error-caja">{error}</div>}
      <form id="form-pla" className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Nombre *"><input value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} required /></Campo>
        <Campo etiqueta="Categoría">
          <select value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })}>{['Contrato', 'Convenio', 'Escrito', 'Otro'].map((c) => <option key={c}>{c}</option>)}</select>
        </Campo>
        <Campo etiqueta="Descripción" ancho="completo"><input value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} /></Campo>
        <div className="campo campo-completo">
          <span className="campo-etiqueta">Datos automáticos (clic para insertar)</span>
          <div className="variables">{Object.keys(VARIABLES_AUTOMATICAS).map((v) => <code key={v} title={VARIABLES_AUTOMATICAS[v]} onClick={() => insertar(v)}>{`{{${v}}}`}</code>)}</div>
          <span className="campo-ayuda">Para pedir otro dato al generar el documento, escríbalo entre llaves dobles, por ejemplo <code>{'{{monto_del_adeudo}}'}</code>.</span>
        </div>
        <Campo etiqueta="Texto del documento *" ancho="completo">
          <textarea className="editor-texto" value={d.cuerpo} onChange={(e) => setD({ ...d, cuerpo: e.target.value })} required style={{ minHeight: '45vh' }} />
        </Campo>
      </form>
    </Modal>
  );
}

export default function Contratos() {
  const avisar = useAviso();
  const imprimir = useImprimir();
  const [params] = useSearchParams();
  const [clientes] = useClientes();
  const [tab, setTab] = useState('nuevo');
  const [plantillas, setPlantillas] = useState([]);
  const [generados, setGenerados] = useState([]);
  const [editando, setEditando] = useState(null);
  const [viendo, setViendo] = useState(null);

  const cargar = useCallback(() => {
    api('/plantillas').then(setPlantillas).catch(() => {});
    api('/contratos?limite=300').then(setGenerados).catch(() => {});
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar “${c.titulo}”?`)) return;
    await api(`/contratos/${c._id}`, { method: 'DELETE' });
    avisar('Documento eliminado');
    cargar();
  };

  return (
    <>
      <Encabezado titulo="Contratos y documentos" subtitulo="Genere contratos con los datos del cliente e imprímalos directamente.">
        {tab === 'plantillas' && <Boton icono="mas" onClick={() => setEditando({})}>Nueva plantilla</Boton>}
      </Encabezado>
      <Pestanas valor={tab} onCambio={setTab} opciones={[['nuevo', 'Nuevo documento'], ['generados', 'Documentos generados'], ['plantillas', 'Plantillas']]} />

      {tab === 'nuevo' && <Generador plantillas={plantillas} clientes={clientes} clienteInicial={params.get('cliente')} onGuardado={cargar} />}

      {tab === 'generados' && (generados.length === 0
        ? <div className="tarjeta"><Vacio icono="contratos" titulo="Sin documentos generados">Los contratos que imprima quedarán guardados aquí.</Vacio></div>
        : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead><tr><th>Documento</th><th>Cliente</th><th>Fecha</th><th /></tr></thead>
              <tbody>{generados.map((c) => (
                <tr key={c._id}>
                  <td>{c.titulo}</td><td>{c.cliente?.nombre}</td><td className="muted">{fecha(c.fecha)}</td>
                  <td className="acc">
                    <button type="button" className="btn-icono" title="Ver" onClick={() => setViendo(c)}><Icono nombre="ver" tam={18} /></button>
                    <button type="button" className="btn-icono" title="Imprimir" onClick={() => imprimir(<HojaContrato contenido={c.contenido} />)}><Icono nombre="imprimir" tam={18} /></button>
                    <button type="button" className="btn-icono" title="Eliminar" onClick={() => eliminar(c)}><Icono nombre="borrar" tam={18} /></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ))}

      {tab === 'plantillas' && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Plantilla</th><th>Categoría</th><th>Datos que pide</th><th /></tr></thead>
            <tbody>{plantillas.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.nombre}</strong><div className="muted chico">{p.descripcion}</div></td>
                <td><span className="etiqueta etiqueta-oro">{p.categoria}</span></td>
                <td className="chico muted">{variablesDe(p.cuerpo).filter((v) => !(v in VARIABLES_AUTOMATICAS)).map(humanizar).join(', ') || '—'}</td>
                <td className="acc"><button type="button" className="btn-icono" title="Editar" onClick={() => setEditando(p)}><Icono nombre="editar" tam={18} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {editando && <FormularioPlantilla inicial={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); cargar(); }} />}
      {viendo && (
        <Modal titulo={viendo.titulo} onCerrar={() => setViendo(null)} ancho="lg"
          pie={<Boton icono="imprimir" onClick={() => imprimir(<HojaContrato contenido={viendo.contenido} />)}>Imprimir</Boton>}>
          <div className="vista-previa">{viendo.contenido}</div>
        </Modal>
      )}
    </>
  );
}
