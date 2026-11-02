// Subconjunto de catálogos del SAT (CFDI 4.0) usados con mayor frecuencia en un despacho.
export const REGIMENES = [
  ['601', 'General de Ley Personas Morales'],
  ['603', 'Personas Morales con Fines no Lucrativos'],
  ['605', 'Sueldos y Salarios'],
  ['606', 'Arrendamiento'],
  ['612', 'Personas Físicas con Actividades Empresariales y Profesionales'],
  ['616', 'Sin obligaciones fiscales'],
  ['621', 'Incorporación Fiscal'],
  ['625', 'Plataformas Tecnológicas'],
  ['626', 'Régimen Simplificado de Confianza'],
];

export const USOS_CFDI = [
  ['G03', 'Gastos en general'],
  ['G01', 'Adquisición de mercancías'],
  ['D01', 'Honorarios médicos, dentales y hospitalarios'],
  ['S01', 'Sin efectos fiscales'],
  ['CP01', 'Pagos'],
];

export const FORMAS_PAGO = [
  ['01', 'Efectivo'],
  ['02', 'Cheque nominativo'],
  ['03', 'Transferencia electrónica'],
  ['04', 'Tarjeta de crédito'],
  ['28', 'Tarjeta de débito'],
  ['99', 'Por definir'],
];

export const METODOS_PAGO = [
  ['PUE', 'Pago en una sola exhibición'],
  ['PPD', 'Pago en parcialidades o diferido'],
];

export const etiqueta = (lista, clave) => {
  const e = lista.find(([k]) => k === clave);
  return e ? `${e[0]} - ${e[1]}` : clave || '';
};

export const MATERIAS = ['Laboral', 'Familiar', 'Amparo', 'Civil', 'Mercantil', 'Penal', 'Administrativo', 'Otro'];
export const TIPOS_CITA = ['Consulta', 'Audiencia', 'Firma', 'Diligencia', 'Llamada', 'Otro'];
export const TIPOS_DOCUMENTO = ['Acuerdo', 'Demanda', 'Contestación', 'Sentencia', 'Promoción', 'Identificación', 'Comprobante', 'Contrato', 'Otro'];

export const SERVICIOS_EN_LINEA = [
  { nombre: 'PJF Servicios en Línea', detalle: 'Juicio en línea y amparo', url: 'https://www.serviciosenlinea.pjf.gob.mx/juicioenlinea/juicioenlinea' },
  { nombre: 'CURP', detalle: 'Consulta e impresión', url: 'https://www.gob.mx/curp/' },
  { nombre: 'Semanas cotizadas', detalle: 'IMSS · constancia', url: 'https://serviciosdigitales.imss.gob.mx/semanascotizadas-web/usuarios/IngresoAsegurado' },
  { nombre: 'SAT', detalle: 'Portal del SAT', url: 'https://www.sat.gob.mx' },
  { nombre: 'Constancia fiscal', detalle: 'Situación fiscal (SAT)', url: 'https://www.sat.gob.mx/aplicacion/53027/genera-tu-constancia-de-situacion-fiscal' },
  { nombre: 'Validar RFC', detalle: 'Verificación de RFC en el SAT', url: 'https://agsc.siat.sat.gob.mx/PTSC/ValidaRFC/index.jsf' },
  { nombre: 'Verificar CFDI', detalle: 'Validez de facturas', url: 'https://verificacfdi.facturaelectronica.sat.gob.mx/' },
  { nombre: 'Registro Público Gto.', detalle: 'Propiedad y certificados', url: 'https://rppc.guanajuato.gob.mx/' },
  { nombre: 'SIGER', detalle: 'Registro Público de Comercio', url: 'https://rpc.economia.gob.mx/siger2/xhtml/login/login.xhtml' },
  { nombre: 'Actas Registro Civil', detalle: 'Nacimiento, matrimonio, defunción', url: 'https://www.gob.mx/actas' },
  { nombre: 'Poder Judicial Gto.', detalle: 'Tribunales del estado', url: 'https://www.poderjudicial-gto.gob.mx/' },
  { nombre: 'Centro Laboral', detalle: 'Conciliación federal', url: 'https://www.centrolaboral.gob.mx/' },
  { nombre: 'Semanario Judicial', detalle: 'Tesis y jurisprudencia SCJN', url: 'https://sjf2.scjn.gob.mx/busqueda-principal-tesis' },
  { nombre: 'Cédula profesional', detalle: 'Registro Nacional de Profesionistas', url: 'https://www.cedulaprofesional.sep.gob.mx/' },
  { nombre: 'Leyes federales', detalle: 'Cámara de Diputados', url: 'https://www.diputados.gob.mx/LeyesBiblio/index.htm' },
  { nombre: 'Leyes de Guanajuato', detalle: 'Congreso del Estado', url: 'https://www.congresogto.gob.mx/leyes' },
  { nombre: 'DOF', detalle: 'Diario Oficial de la Federación', url: 'https://www.dof.gob.mx/' },
];
