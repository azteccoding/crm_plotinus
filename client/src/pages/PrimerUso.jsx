import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Boton, Campo, Marca, useConfig } from '../components/ui.jsx';
import { CamposDespacho } from './Configuracion.jsx';

function CampoClave({ etiqueta, ayuda, valor, onCambio }) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} ancho="completo">
      <input type="password" value={valor} onChange={(e) => onCambio(e.target.value)} required minLength={6} autoComplete="new-password" />
    </Campo>
  );
}

export default function PrimerUso({ alTerminar }) {
  const { config, recargar } = useConfig();
  const [paso, setPaso] = useState(0);
  const [d, setD] = useState(config);
  const [c, setC] = useState({ secretaria: '', secretaria2: '', abogado: '', abogado2: '', superClave: '', superClave2: '' });
  const [error, setError] = useState('');
  useEffect(() => setD(config), [config]);

  const guardarDespacho = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/config', { method: 'PUT', body: d });
      await recargar();
      setPaso(2);
    } catch (er) { setError(er.message); }
  };

  const guardarClaves = async (e) => {
    e.preventDefault();
    setError('');
    if (c.secretaria !== c.secretaria2 || c.abogado !== c.abogado2 || c.superClave !== c.superClave2) {
      setError('Alguna contraseña no coincide con su confirmación. Revíselas.');
      return;
    }
    try {
      await api('/seguridad/configurar', { method: 'POST', body: { secretaria: c.secretaria, abogado: c.abogado, superClave: c.superClave } });
      setPaso(3);
    } catch (er) { setError(er.message); }
  };

  const set = (k) => (v) => setC({ ...c, [k]: v });

  return (
    <div className="pantalla">
      <div className="pantalla-caja" style={{ maxWidth: paso === 1 ? 760 : 620 }}>
        <Marca oscura />
        <div className="pasos">{[0, 1, 2, 3].map((i) => <span key={i} className={i <= paso ? 'hecho' : ''} />)}</div>
        {error && <div className="error-caja">{error}</div>}

        {paso === 0 && (
          <>
            <h1>Bienvenida al sistema de clientes</h1>
            <p>Antes de empezar, vamos a configurar dos cosas (solo se hace una vez):</p>
            <ol className="instrucciones">
              <li>Los datos del despacho que aparecerán en cotizaciones, facturas y contratos.</li>
              <li>Las contraseñas que protegen la sección “Ventas del mes”.</li>
            </ol>
            <Boton onClick={() => setPaso(1)}>Comenzar</Boton>
          </>
        )}

        {paso === 1 && (
          <form onSubmit={guardarDespacho}>
            <h1>Datos del despacho</h1>
            <p className="muted">Revise que la información sea correcta. Podrá cambiarla después en “Configuración”.</p>
            <div className="formulario"><CamposDespacho d={d} setD={setD} /></div>
            <div className="acciones" style={{ marginTop: '1.5rem' }}><Boton type="submit">Continuar</Boton></div>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={guardarClaves}>
            <h1>Contraseñas de “Ventas del mes”</h1>
            <p className="muted">Para ver las ventas se necesitan <strong>las dos</strong> contraseñas (secretaria y abogado), o bien la <strong>contraseña maestra</strong> del abogado por sí sola. Mínimo 6 caracteres; las tres deben ser distintas. Anótelas en un lugar seguro.</p>
            <div className="formulario">
              <CampoClave etiqueta="Contraseña de la secretaria" valor={c.secretaria} onCambio={set('secretaria')} />
              <CampoClave etiqueta="Repita la contraseña de la secretaria" valor={c.secretaria2} onCambio={set('secretaria2')} />
              <CampoClave etiqueta="Contraseña del abogado" valor={c.abogado} onCambio={set('abogado')} />
              <CampoClave etiqueta="Repita la contraseña del abogado" valor={c.abogado2} onCambio={set('abogado2')} />
              <CampoClave etiqueta="Contraseña maestra del abogado" ayuda="Solo la conoce el abogado. Permite entrar sin la secretaria y cambiar las demás contraseñas." valor={c.superClave} onCambio={set('superClave')} />
              <CampoClave etiqueta="Repita la contraseña maestra" valor={c.superClave2} onCambio={set('superClave2')} />
            </div>
            <div className="acciones" style={{ marginTop: '1.5rem' }}>
              <Boton variante="borde" onClick={() => setPaso(1)}>Atrás</Boton>
              <Boton type="submit">Guardar contraseñas</Boton>
            </div>
          </form>
        )}

        {paso === 3 && (
          <>
            <h1>¡Todo listo!</h1>
            <p>El sistema está configurado. A partir de ahora, para usarlo solo haga doble clic en <strong>Iniciar Plotinus</strong>.</p>
            <Boton onClick={alTerminar}>Entrar al sistema</Boton>
          </>
        )}
      </div>
    </div>
  );
}
