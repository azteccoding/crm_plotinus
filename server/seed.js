import { Config, Servicio, Plantilla } from './models.js';

const CONFIG_INICIAL = {
  nombreDespacho: 'Consultoría Jurídica Plotinus',
  abogado: 'Lic. Jorge Montes Carrillo',
  cedula: '',
  rfc: '',
  regimenFiscal: '612',
  domicilio: 'Av. Paseo del Moral 707-563, Villas del Moral, 37160 León, Gto.',
  ciudad: 'León, Guanajuato',
  codigoPostal: '37160',
  telefono: '477 000 1111',
  whatsapp: '524770000111',
  email: 'contacto@cjplotinus.com',
  sitioWeb: 'https://plotinus.com.mx',
  serieFactura: 'A',
  notasCotizacion: 'Los honorarios no incluyen gastos, derechos, copias certificadas ni viáticos. Precios sujetos a cambio sin previo aviso.',
};

const SERVICIOS_INICIALES = [
  ['Consulta jurídica inicial', 'Análisis del caso y orientación', 'Consultas', 500, 'por consulta'],
  ['Asesoría laboral por despido', 'Revisión de documentos y cálculo de prestaciones', 'Laboral', 800, 'por asesoría'],
  ['Conciliación prejudicial laboral', 'Representación ante el Centro de Conciliación Laboral', 'Laboral', 5000, 'por asunto'],
  ['Juicio ordinario laboral', 'Demanda y seguimiento ante el Tribunal Laboral', 'Laboral', 15000, 'por asunto'],
  ['Juicio de amparo indirecto', 'Demanda de amparo y solicitud de suspensión', 'Amparo', 15000, 'por asunto'],
  ['Pensión alimenticia', 'Demanda de fijación, aumento o reducción de pensión', 'Familiar', 12000, 'por asunto'],
  ['Divorcio incausado', 'Trámite de divorcio sin expresión de causa', 'Familiar', 10000, 'por asunto'],
  ['Juicio sucesorio intestamentario', 'Tramitación del juicio hasta la adjudicación', 'Civil y mercantil', 18000, 'por asunto'],
  ['Cobro de pagaré', 'Juicio ejecutivo mercantil', 'Civil y mercantil', 8000, 'por asunto'],
  ['Elaboración de contrato', 'Redacción de contrato a la medida', 'Documentos', 2500, 'por documento'],
  ['Revisión de contrato', 'Análisis y observaciones por escrito', 'Documentos', 1500, 'por documento'],
  ['Escrito o promoción simple', 'Elaboración de escrito ante juzgado', 'Documentos', 800, 'por escrito'],
];

const ENCABEZADO_CIUDAD = 'En la ciudad de {{despacho.ciudad}}, a {{fecha}}';

const PLANTILLAS_INICIALES = [
  {
    clave: 'prestacion-servicios',
    nombre: 'Contrato de prestación de servicios profesionales',
    categoria: 'Contrato',
    descripcion: 'Contrato entre el despacho y el cliente por servicios jurídicos.',
    cuerpo: `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Que celebran, por una parte, {{despacho.abogado}}, en representación de {{despacho.nombre}}, a quien en lo sucesivo se le denominará "EL PRESTADOR", y por la otra parte {{cliente.nombre}}, a quien en lo sucesivo se le denominará "EL CLIENTE", al tenor de las siguientes declaraciones y cláusulas:

DECLARACIONES

I. Declara EL PRESTADOR:
a) Ser profesionista en Derecho, con cédula profesional número {{despacho.cedula}}, con domicilio para oír y recibir notificaciones en {{despacho.domicilio}}.
b) Contar con los conocimientos y la experiencia necesarios para prestar los servicios objeto de este contrato.

II. Declara EL CLIENTE:
a) Llamarse como ha quedado escrito, identificarse con {{cliente.identificacion}}, tener su domicilio en {{cliente.domicilio}}, con R.F.C. {{cliente.rfc}} y C.U.R.P. {{cliente.curp}}.
b) Tener capacidad legal para obligarse en los términos del presente contrato.

CLÁUSULAS

PRIMERA. OBJETO. EL PRESTADOR se obliga a prestar a EL CLIENTE los siguientes servicios profesionales: {{objeto_del_servicio}}.

SEGUNDA. HONORARIOS. EL CLIENTE pagará a EL PRESTADOR por concepto de honorarios la cantidad de {{honorarios}}, en la forma siguiente: {{forma_de_pago}}.

TERCERA. GASTOS. Los gastos que se generen con motivo del asunto, tales como derechos, copias certificadas, publicaciones, peritajes y viáticos, no están incluidos en los honorarios y correrán por cuenta de EL CLIENTE, previa comprobación.

CUARTA. OBLIGACIONES DE EL PRESTADOR. EL PRESTADOR se obliga a desempeñar los servicios con la diligencia, ética y conocimientos que su profesión exige, a mantener informado a EL CLIENTE del estado de su asunto y a guardar estricta confidencialidad sobre la información que reciba.

QUINTA. OBLIGACIONES DE EL CLIENTE. EL CLIENTE se obliga a proporcionar oportunamente la información y documentación veraz que le sea requerida, a asistir a las diligencias en que sea necesaria su presencia y a cubrir puntualmente los honorarios pactados.

SEXTA. NATURALEZA DEL SERVICIO. EL PRESTADOR se obliga a poner todos sus conocimientos y diligencia en la atención del asunto; sin embargo, el resultado final depende de la autoridad competente, por lo que EL PRESTADOR no garantiza un resultado determinado.

SÉPTIMA. VIGENCIA Y TERMINACIÓN. El presente contrato estará vigente hasta la conclusión del asunto encomendado. Cualquiera de las partes podrá darlo por terminado mediante aviso por escrito; en tal caso, EL CLIENTE cubrirá los honorarios correspondientes a los trabajos realizados hasta esa fecha.

OCTAVA. DATOS PERSONALES. Los datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, únicamente para los fines del presente contrato.

NOVENA. JURISDICCIÓN. Para la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes y tribunales competentes de {{despacho.ciudad}}, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.

Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por duplicado. ${ENCABEZADO_CIUDAD}.



______________________________                ______________________________
EL PRESTADOR                                              EL CLIENTE
{{despacho.abogado}}                                {{cliente.nombre}}`,
  },
  {
    clave: 'compraventa-mueble',
    nombre: 'Contrato de compraventa de bien mueble',
    categoria: 'Contrato',
    descripcion: 'Compraventa privada de vehículo u otro bien mueble. El cliente aparece como vendedor.',
    cuerpo: `CONTRATO PRIVADO DE COMPRAVENTA DE BIEN MUEBLE

Que celebran, por una parte, {{cliente.nombre}}, a quien en lo sucesivo se le denominará "EL VENDEDOR", con domicilio en {{cliente.domicilio}}, y por la otra parte {{comprador_nombre}}, a quien en lo sucesivo se le denominará "EL COMPRADOR", con domicilio en {{comprador_domicilio}}, al tenor de las siguientes cláusulas:

PRIMERA. OBJETO. EL VENDEDOR vende a EL COMPRADOR, quien adquiere para sí, el siguiente bien: {{descripcion_del_bien}}.

SEGUNDA. PRECIO. Las partes convienen como precio de la operación la cantidad de {{precio}}, que EL COMPRADOR paga en la forma siguiente: {{forma_de_pago}}.

TERCERA. ENTREGA. EL VENDEDOR entrega el bien en este acto, junto con la documentación que acredita su propiedad, y EL COMPRADOR lo recibe a su entera satisfacción en el estado físico y mecánico en que se encuentra.

CUARTA. PROPIEDAD Y GRAVÁMENES. EL VENDEDOR declara ser el legítimo propietario del bien y que éste se encuentra libre de todo gravamen, adeudo o limitación de dominio, obligándose al saneamiento para el caso de evicción conforme a la ley.

QUINTA. RESPONSABILIDAD. A partir de la firma del presente contrato, EL COMPRADOR asume toda responsabilidad civil, penal, fiscal y administrativa derivada del uso y posesión del bien.

SEXTA. JURISDICCIÓN. Para la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes y tribunales competentes de {{despacho.ciudad}}.

Leído que fue el presente contrato, lo firman de conformidad. ${ENCABEZADO_CIUDAD}.



______________________________                ______________________________
EL VENDEDOR                                              EL COMPRADOR
{{cliente.nombre}}                                       {{comprador_nombre}}



______________________________                ______________________________
TESTIGO                                                       TESTIGO`,
  },
  {
    clave: 'arrendamiento',
    nombre: 'Contrato de arrendamiento de casa habitación',
    categoria: 'Contrato',
    descripcion: 'Arrendamiento de inmueble para uso habitacional. El cliente aparece como arrendador.',
    cuerpo: `CONTRATO DE ARRENDAMIENTO DE CASA HABITACIÓN

Que celebran, por una parte, {{cliente.nombre}}, a quien en lo sucesivo se le denominará "EL ARRENDADOR", y por la otra parte {{arrendatario_nombre}}, a quien en lo sucesivo se le denominará "EL ARRENDATARIO", al tenor de las siguientes cláusulas:

PRIMERA. OBJETO. EL ARRENDADOR otorga en arrendamiento a EL ARRENDATARIO el inmueble ubicado en {{domicilio_del_inmueble}}, el cual se destinará exclusivamente a casa habitación.

SEGUNDA. RENTA. EL ARRENDATARIO pagará por concepto de renta mensual la cantidad de {{renta_mensual}}, por mensualidades adelantadas, dentro de los primeros {{dias_para_pagar}} días de cada mes.

TERCERA. DEPÓSITO. EL ARRENDATARIO entrega en este acto la cantidad de {{deposito}} en garantía del cumplimiento de sus obligaciones, misma que le será devuelta al término del contrato, previa verificación del estado del inmueble y del pago de servicios.

CUARTA. VIGENCIA. El presente contrato tendrá una vigencia de {{vigencia}}, contada a partir del {{fecha_de_inicio}}.

QUINTA. SERVICIOS. Los servicios de agua, energía eléctrica, gas, teléfono e internet serán por cuenta de EL ARRENDATARIO.

SEXTA. CONSERVACIÓN. EL ARRENDATARIO se obliga a conservar el inmueble en buen estado y a no realizar modificaciones sin autorización por escrito de EL ARRENDADOR. Queda prohibido subarrendar o ceder los derechos del presente contrato.

SÉPTIMA. RESCISIÓN. La falta de pago de dos o más mensualidades, o el incumplimiento de cualquiera de las obligaciones aquí pactadas, será causa de rescisión del presente contrato.

OCTAVA. FIADOR. {{fiador_nombre}} se constituye como fiador y principal pagador de todas las obligaciones de EL ARRENDATARIO, renunciando a los beneficios de orden y excusión.

NOVENA. JURISDICCIÓN. Para la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes y tribunales competentes de {{despacho.ciudad}}.

Leído que fue el presente contrato, lo firman de conformidad. ${ENCABEZADO_CIUDAD}.



______________________________                ______________________________
EL ARRENDADOR                                          EL ARRENDATARIO
{{cliente.nombre}}                                       {{arrendatario_nombre}}



______________________________
EL FIADOR
{{fiador_nombre}}`,
  },
  {
    clave: 'convenio-pago',
    nombre: 'Convenio de reconocimiento de adeudo y pago',
    categoria: 'Convenio',
    descripcion: 'El deudor reconoce un adeudo y se obliga a pagarlo en parcialidades.',
    cuerpo: `CONVENIO DE RECONOCIMIENTO DE ADEUDO Y PAGO EN PARCIALIDADES

Que celebran, por una parte, {{cliente.nombre}}, a quien en lo sucesivo se le denominará "EL ACREEDOR", y por la otra parte {{deudor_nombre}}, con domicilio en {{deudor_domicilio}}, a quien en lo sucesivo se le denominará "EL DEUDOR", al tenor de las siguientes cláusulas:

PRIMERA. RECONOCIMIENTO. EL DEUDOR reconoce expresamente adeudar a EL ACREEDOR la cantidad de {{monto_del_adeudo}}, derivada de {{origen_del_adeudo}}.

SEGUNDA. FORMA DE PAGO. EL DEUDOR se obliga a pagar la cantidad señalada de la siguiente manera: {{calendario_de_pagos}}.

TERCERA. LUGAR DE PAGO. Los pagos se realizarán en {{lugar_o_cuenta_de_pago}}, debiendo EL ACREEDOR expedir el recibo correspondiente.

CUARTA. VENCIMIENTO ANTICIPADO. La falta de pago puntual de cualquiera de las parcialidades dará derecho a EL ACREEDOR a exigir el pago inmediato del saldo insoluto, más un interés moratorio de {{interes_moratorio}} mensual sobre saldos vencidos.

QUINTA. JURISDICCIÓN. Para la interpretación y cumplimiento del presente convenio, las partes se someten a las leyes y tribunales competentes de {{despacho.ciudad}}.

Leído que fue el presente convenio, lo firman de conformidad. ${ENCABEZADO_CIUDAD}.



______________________________                ______________________________
EL ACREEDOR                                              EL DEUDOR
{{cliente.nombre}}                                       {{deudor_nombre}}`,
  },
  {
    clave: 'convenio-alimentos',
    nombre: 'Convenio de pensión alimenticia y convivencias',
    categoria: 'Convenio',
    descripcion: 'Convenio familiar sobre alimentos, guarda y custodia y régimen de convivencias.',
    cuerpo: `CONVENIO DE PENSIÓN ALIMENTICIA, GUARDA Y CUSTODIA Y RÉGIMEN DE CONVIVENCIAS

Que celebran, por una parte, {{cliente.nombre}}, y por la otra parte {{otra_parte_nombre}}, respecto de su(s) menor(es) hijo(s) {{nombre_de_los_menores}}, al tenor de las siguientes cláusulas:

PRIMERA. GUARDA Y CUSTODIA. La guarda y custodia de los menores quedará a cargo de {{quien_tiene_la_custodia}}, en el domicilio ubicado en {{domicilio_de_los_menores}}.

SEGUNDA. PENSIÓN ALIMENTICIA. {{deudor_alimentario}} se obliga a proporcionar por concepto de pensión alimenticia la cantidad de {{monto_de_la_pension}}, pagadera {{periodicidad_y_forma_de_pago}}. Dicha cantidad se incrementará anualmente en la misma proporción que el salario mínimo general vigente.

TERCERA. GASTOS EXTRAORDINARIOS. Los gastos médicos extraordinarios y escolares de inicio de ciclo se cubrirán por ambas partes en la proporción siguiente: {{proporcion_de_gastos_extraordinarios}}.

CUARTA. RÉGIMEN DE CONVIVENCIAS. El progenitor no custodio podrá convivir con los menores de la siguiente forma: {{regimen_de_convivencias}}.

QUINTA. INTERÉS SUPERIOR DE LA INFANCIA. Las partes se comprometen a conducirse con respeto mutuo y a privilegiar en todo momento el interés superior de los menores.

SEXTA. APROBACIÓN JUDICIAL. Las partes convienen en someter el presente convenio a la aprobación del Juez competente de {{despacho.ciudad}} para que surta efectos de sentencia ejecutoriada.

Leído que fue el presente convenio, lo firman de conformidad. ${ENCABEZADO_CIUDAD}.



______________________________                ______________________________
{{cliente.nombre}}                                       {{otra_parte_nombre}}`,
  },
  {
    clave: 'carta-poder',
    nombre: 'Carta poder simple',
    categoria: 'Escrito',
    descripcion: 'El cliente otorga poder a otra persona para un trámite.',
    cuerpo: `CARTA PODER

${ENCABEZADO_CIUDAD}.

Por medio de la presente, yo, {{cliente.nombre}}, con domicilio en {{cliente.domicilio}}, otorgo a {{apoderado_nombre}} poder amplio y suficiente para que en mi nombre y representación realice el siguiente trámite: {{tramite_a_realizar}}, ante {{autoridad_o_institucion}}.

Para tal efecto, queda facultado(a) para presentar y recibir documentos, firmar los escritos y formatos necesarios, y realizar todas las gestiones relacionadas con el trámite señalado.



______________________________                ______________________________
OTORGANTE                                                  APODERADO(A)
{{cliente.nombre}}                                       {{apoderado_nombre}}



______________________________                ______________________________
TESTIGO                                                       TESTIGO`,
  },
  {
    clave: 'recibo-honorarios',
    nombre: 'Recibo de pago de honorarios',
    categoria: 'Escrito',
    descripcion: 'Comprobante simple de pago recibido del cliente.',
    cuerpo: `RECIBO DE PAGO

Bueno por: {{cantidad}}

Recibí de {{cliente.nombre}} la cantidad de {{cantidad}} ({{cantidad_con_letra}}), por concepto de {{concepto}}.

Forma de pago: {{forma_de_pago}}.

${ENCABEZADO_CIUDAD}.



______________________________
RECIBÍ
{{despacho.abogado}}
{{despacho.nombre}}`,
  },
];

export async function sembrarDatosIniciales() {
  if (!(await Config.exists({ _id: 'despacho' }))) {
    await Config.create({ _id: 'despacho', ...CONFIG_INICIAL });
  }
  if ((await Servicio.estimatedDocumentCount()) === 0) {
    await Servicio.insertMany(SERVICIOS_INICIALES.map(([nombre, descripcion, categoria, precio, unidad]) => ({
      nombre, descripcion, categoria, precio, unidad,
    })));
  }
  if ((await Plantilla.estimatedDocumentCount()) === 0) {
    await Plantilla.insertMany(PLANTILLAS_INICIALES);
  }
}
