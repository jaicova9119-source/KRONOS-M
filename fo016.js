/* ============================================================================
   FO-016 — Generador de Orden de Trabajo
   Clon estructural del formato GTEC-MT-FO-016 VERSIÓN 00 (FECHA 2018/05/16)
   tal como lo imprime SAP.

   rev.4 — retícula extraída del impreso SAP de la OT 100032747 midiendo el
           rasterizado a 200 dpi y leyendo los operadores de color del PDF.
           HOJA A4 (21.0 x 29.7 cm) — no Carta. Área útil 18.58 cm;
           márgenes: superior 0.88 / izquierdo 1.12 / derecho 1.30 cm.
           Color de banda #ABD4D4 (operador rg del PDF original).

   IMPORTANTE al imprimir desde el navegador:
     en el diálogo de impresión, DESACTIVAR "Encabezados y pies de página"
     y dejar "Márgenes: Predeterminado" (los márgenes los fija @page).
     De lo contrario Chrome/Edge estampa fecha, título y "about:blank".
   ========================================================================== */

const FO016 = (function () {
  'use strict';

  const CODIGO    = 'GTEC-MT-FO-016';
  const VERSION   = '00';
  const FECHA_FO  = '2018/05/16';
  const TOTAL_PAG = 3;

  /* Anchos en cm — medidos sobre el impreso SAP. Word solo respeta <colgroup>
     con width explícito: no usar porcentajes ni table-layout. */
  const W = {
    total: 18.58,
    cab:   [7.15, 6.94, 4.49],
    datos: [3.67, 7.60, 3.53, 3.78],
    oper:  [1.19, 1.75, 8.13, 1.72, 1.25, 0.96, 1.63, 1.95],
    mat:   [2.60, 5.57, 2.42, 1.30, 2.23, 2.23, 2.23],
    chk:   [1.99, 0.51, 3.00, 0.49, 3.00, 0.49, 3.00, 0.51, 5.59],
    tiemp: [4.06, 1.99, 0.22, 3.90, 2.11, 0.19, 3.93, 2.04],
    estad: [4.89, 4.20, 0.57, 4.20, 4.76],
    rext:  [1.03, 16.80, 0.75],                     // inserción caja recepción
    rint:  16.40,                                   // interior caja recepción
    sino:  [11.55, 0.57, 0.51, 1.37, 0.51, 1.89],
    nfa:   [0.51, 4.52, 0.94, 4.49, 0.97, 4.52, 0.45],
    firma: [0.43, 4.01, 0.46, 4.04, 0.53, 4.02, 0.61, 4.19, 0.33],
    clerk: [5.51, 6.76, 6.35]
  };

  /* Alturas en cm — calibradas para que la página 1 cierre en una sola hoja. */
  const H = {
    cab: 0.63, cabUlt: 0.71,
    datos: 0.447,
    opBanda: 0.46, opCab: 0.94, opFila: 0.44,
    matFila: 0.46, matMin: 4,
    dsBanda: 0.62, dsCbx: 0.50, dsRengl: 0.63,
    p2Rengl: 0.63
  };

  /* ----------------------------- utilidades ------------------------------- */

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* SAP conserva los espacios dobles de la descripción de operación
     ("NORTH  PE447T-200"). HTML los colapsa: hay que protegerlos. */
  const escT = s => esc(s).replace(/ {2}/g, '&nbsp; ');

  function fechaSAP(v) {
    if (!v) return '';
    if (v instanceof Date) return dmy(v);
    const s = String(v).trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.replace(/\//g, '.');
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : s;
  }
  const dmy = d => `${String(d.getDate()).padStart(2, '0')}.` +
                   `${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

  const hora = v => !v ? '' : String(v).trim().slice(0, 5);

  const oper = (v, i) => (v != null && v !== '')
    ? String(v).padStart(4, '0')
    : String((i + 1) * 10).padStart(4, '0');

  const cols = a => '<colgroup>' + a.map(w => `<col style="width:${w}cm">`).join('') + '</colgroup>';
  const col1 = w => `<colgroup><col style="width:${w}cm"></colgroup>`;

  const LAT = 'border-left:0.5pt solid #000;border-right:0.5pt solid #000';
  const BOT = 'border-bottom:0.5pt solid #000';

  /* -------------------------------- CSS ----------------------------------- */

  const CSS = `
.fo016{width:${W.total}cm;margin:0;font-family:Arial,Helvetica,sans-serif;
       font-size:8.5pt;color:#000;line-height:1.1}
.fo016 table{border-collapse:collapse;width:${W.total}cm;margin:0}
.fo016 td{padding:1px 3px;vertical-align:top;font-size:8.5pt}
.fo016 .bx td{border:0.5pt solid #000}
.fo016 .out{border:0.5pt solid #000}
.fo016 .nb{border:none}
.fo016 .mono{font-family:"Courier New",Courier,monospace;font-size:10pt}
.fo016 .band td{background:#ABD4D4;border:0.5pt solid #000;font-weight:bold;
                text-align:center;font-size:10.5pt;padding:1px;height:${H.opBanda}cm}
.fo016 .thd td{background:#FFFFFF;border:0.5pt solid #000;font-weight:bold;
               text-align:center;font-size:8.5pt;padding:1px}
.fo016 .lbl{font-weight:bold;white-space:nowrap}
.fo016 .ttl{font-weight:bold;text-align:center;font-size:10.5pt;vertical-align:middle}
.fo016 .cod{font-size:8.5pt;height:${H.cab}cm;vertical-align:middle}
.fo016 .cbx{border:0.5pt solid #000;text-align:center;height:${H.dsCbx}cm;padding:0;
            font-size:8pt;font-family:Arial,Helvetica,sans-serif;vertical-align:middle}
.fo016 .band2 td{background:#ABD4D4;border:0.5pt solid #000;font-weight:bold;
                 text-align:center;font-size:10.5pt;padding:1px;height:${H.dsBanda}cm}
.fo016 .ctr{text-align:center}
.fo016 .rule{border-bottom:0.5pt solid #000;font-size:1pt;line-height:1pt;height:1pt;padding:0}
.fo016 .sp{height:0.20cm;font-size:1pt;line-height:1pt;padding:0}
.fo016 .pag{page-break-after:always}
.fo016 .pag:last-child{page-break-after:auto}
`;

  /* ------------------------------ cabecera -------------------------------- */

  function cabecera(ot, pag) {
    /* Geometría medida en el impreso original: 5.40 x 1.47 cm, con el borde
       superior a 0.62 cm del tope de la cabecera y 0.24 cm del margen. */
    const src = ot.logo || (typeof FO016_LOGO !== 'undefined' ? FO016_LOGO : null);
    const logo = src
      ? `<img src="${esc(src)}" style="width:5.40cm;height:1.47cm" alt="">`
      : '';
    return `
<table>${cols(W.cab)}
  <tr>
    <td rowspan="5" class="nb" style="padding:0.62cm 0 0 0.24cm;vertical-align:top">${logo}</td>
    <td rowspan="2" class="out ttl">ORDEN DE TRABAJO</td>
    <td class="out cod">${CODIGO}</td>
  </tr>
  <tr><td class="out cod">VERSIÓN: ${VERSION}</td></tr>
  <tr>
    <td rowspan="2" class="out ttl">FORMATO</td>
    <td class="out cod">FECHA: ${FECHA_FO}</td>
  </tr>
  <tr><td class="out cod">Página ${pag} de ${TOTAL_PAG}</td></tr>
  <tr>
    <td class="out ttl">ORDEN DE TRABAJO No.</td>
    <td class="out cod" style="height:${H.cabUlt}cm;vertical-align:top">${esc(ot.numero_ot)}</td>
  </tr>
</table>
<div class="sp">&nbsp;</div>`;
  }

  /* --------------------------- bloque de datos ---------------------------- */

  const HD = `height:${H.datos}cm`;

  const fila = (l1, v1, l2, v2) => `<tr>
  <td class="lbl" style="${HD}">${l1}</td><td style="${HD}">${escT(v1)}</td>
  <td class="lbl" style="${HD}">${l2}</td><td style="${HD}">${escT(v2)}</td>
</tr>`;

  function bloqueDatos(ot) {
    /* Des.ubi.técnica va en negrita ocupando 3 columnas: en el impreso SAP
       nunca se parte en dos líneas aunque el texto sea largo. */
    const desUbi = `<tr>
  <td class="lbl" style="${HD}">Des.ubi.técnica</td>
  <td colspan="3" style="${HD};font-weight:bold;white-space:nowrap">${escT(ot.des_ubi_tecnica)}</td>
</tr>`;
    return `
<table class="out">${cols(W.datos)}
${fila('Descripción',         ot.descripcion,       'Tag Equipo',         ot.tag_equipo)}
${fila('Clase de orden',      ot.clase_orden,       'GRP Planificador',   ot.grp_planificador)}
${fila('Clase de Actividad',  ot.clase_actividad,   'Puesto responsable', ot.puesto_responsable)}
${fila('Cod Equipo',          ot.cod_equipo,        'Fecha Inicio',       fechaSAP(ot.fecha_inicio))}
${fila('Desc Equipo',         ot.desc_equipo,       'Autor de Aviso',     ot.autor_aviso)}
${fila('Ubicación Téc.',      ot.ubicacion_tecnica, 'Clase Aviso',        ot.clase_aviso)}
${desUbi}
${fila('No.Aviso',            ot.no_aviso,          'Marca',              ot.marca)}
${fila('Sintoma de Averia',   ot.sintoma_averia,    'Modelo',             ot.modelo)}
${fila('Causa',               ot.causa,             'Serie',              ot.serie)}
${fila('Componente en falla', ot.componente_falla,  'No. Inventario',     ot.no_inventario)}
</table>
<div class="sp">&nbsp;</div>`;
  }

  /* --------------------- operaciones de mantenimiento --------------------- */

  function tablaOperaciones(ot) {
    const h = `height:${H.opFila}cm`;
    const filas = (ot.operaciones || []).map((o, i) => `<tr>
  <td class="mono" style="${h};font-size:9.5pt">${oper(o.oper, i)}</td>
  <td class="ctr" style="${h}">${escT(o.puesto)}</td>
  <td style="${h}">${escT(o.descripcion)}</td>
  <td class="ctr" style="${h}">${hora(o.hora_inicio)}</td>
  <td class="ctr" style="${h}">${hora(o.hora_fin)}</td>
  <td class="ctr" style="${h}">${escT(o.cant)}</td>
  <td class="ctr" style="${h}">${escT(o.duracion)}</td>
  <td class="ctr" style="${h}">${fechaSAP(o.fecha)}</td>
</tr>`).join('');

    /* Los saltos de línea de los encabezados son fijos en SAP: no se deja
       que el navegador decida dónde partir. */
    const nw = 'white-space:nowrap';
    return `
<table class="bx">${cols(W.oper)}
  <tr class="band"><td colspan="8">OPERACIONES DE MANTENIMIENTO</td></tr>
  <tr class="thd" style="height:${H.opCab}cm">
    <td style="${nw}">OPER</td>
    <td style="${nw}">Puesto de<br>Trabajo</td>
    <td style="${nw}">Descripción operación</td>
    <td style="${nw}">Hora Inicio</td><td style="${nw}">Hora Fin</td>
    <td style="${nw}">Cant</td><td style="${nw}">Dur. real</td>
    <td style="${nw}">Fecha<br>Realización</td>
  </tr>
${filas}
</table>`;
  }

  /* ------------------- repuestos y materiales (opcional) ------------------ */
  /* Solo se imprime cuando la orden trae materiales cargados. La versión 00
     del formato no la contempla; se construye con las mismas convenciones
     del resto del documento para que no desentone. Se dejan renglones
     vacíos hasta completar H.matMin: sirven para anotar a mano en campo. */

  function tablaMateriales(ot) {
    const mats = ot.materiales || [];
    if (!mats.length) return '';
    const h = `height:${H.matFila}cm`;
    let filas = '';
    for (let i = 0; i < Math.max(H.matMin, mats.length); i++) {
      const m = mats[i] || {};
      filas += `<tr>
  <td style="${h}">${escT(m.codigo)}</td>
  <td style="${h}">${escT(m.descripcion)}</td>
  <td class="ctr" style="${h}">${escT(m.cant_reservada)}</td>
  <td class="ctr" style="${h}">${escT(m.unidad)}</td>
  <td class="ctr" style="${h}">${escT(m.cant_tomada)}</td>
  <td class="ctr" style="${h}">${escT(m.cant_disponer)}</td>
  <td style="${h}">${escT(m.almacen)}</td>
</tr>`;
    }
    const nw = 'white-space:nowrap';
    return `
<div class="sp">&nbsp;</div>
<table class="bx">${cols(W.mat)}
  <tr class="band"><td colspan="7">REPUESTOS Y MATERIALES</td></tr>
  <tr class="thd" style="height:${H.opCab}cm">
    <td style="${nw}">CÓDIGO</td><td style="${nw}">DESCRIPCIÓN</td>
    <td>CANT.<br>RESERVADA</td><td style="${nw}">UND</td>
    <td>CANT.<br>TOMADA</td><td>CANT.<br>DISPONER</td>
    <td style="${nw}">ALMACÉN</td>
  </tr>
${filas}
</table>`;
  }

  /** Alto que ocupa el bloque de materiales, en cm. */
  function altoMateriales(ot) {
    const n = (ot.materiales || []).length;
    if (!n) return 0;
    return 0.20 + H.opBanda + H.opCab + Math.max(H.matMin, n) * (H.matFila + 0.06);
  }

  /* ------------------------- casillas de estado --------------------------- */

  function boxes(marca) {
    const et = ['OPERANDO', 'STAND BY', 'EN FALLA', 'OPERANDO EN FALLA'];
    const c = e => (marca && String(marca).toUpperCase().trim() === e) ? 'X' : '&nbsp;';
    const lb = 'border:none;padding:1px 0 1px 6px;vertical-align:middle';
    return `<table>${cols(W.chk)}
  <tr>
    <td class="nb">&nbsp;</td>
    <td class="cbx">${c(et[0])}</td><td class="mono" style="${lb}">${et[0]}</td>
    <td class="cbx">${c(et[1])}</td><td class="mono" style="${lb}">${et[1]}</td>
    <td class="cbx">${c(et[2])}</td><td class="mono" style="${lb}">${et[2]}</td>
    <td class="cbx">${c(et[3])}</td><td class="mono" style="${lb}">${et[3]}</td>
  </tr>
</table>`;
  }

  /* ------------- caja "descripción del trabajo" (página 1) ---------------- */

  function cajaDescripcion(ot, nRengl) {
    const q  = t => `<tr><td class="mono" style="${LAT};padding:2px 4px 0;height:0.66cm">${t}</td></tr>`;
    const qb = t => `<tr><td class="mono" style="${LAT};${BOT};padding:1px 4px 0;height:0.44cm">${t}</td></tr>`;
    const cb = m => `<tr><td style="${LAT};padding:0">${boxes(m)}</td></tr>`;

    let ren = '';
    if (ot.actividad_realizada) {
      ren += `<tr><td class="mono" style="${LAT};${BOT};padding:2px 4px">` +
             escT(ot.actividad_realizada).replace(/\n/g, '<br>') + '</td></tr>';
      nRengl = Math.max(nRengl - 1, 0);
    }
    for (let i = 0; i < nRengl; i++) {
      ren += `<tr><td style="${LAT};${BOT};height:${H.dsRengl}cm">&nbsp;</td></tr>`;
    }

    return `<table>${col1(W.total)}
  <tr class="band2"><td>DESCRIPCION DEL TRABAJO:(DEFINA EN FRASES CONCRETAS LA ACTIVIDAD&nbsp; REALIZADA)</td></tr>
${q('¿Cómo encontró el equipo?')}
${cb(ot.como_encontro)}
${qb('¿Qué actividad adicional realizó sobre el equipo?')}
${ren}
${q('¿Cómo quedó el equipo?')}
${cb(ot.como_quedo)}
${qb('Recomendaciones adicionales y/o trabajos pendientes?')}
</table>`;
  }

  /* ------- caja renglones + tiempos de parada (página 2) ------------------ */

  function cajaTiempos(ot, nRengl) {
    const u = v => `<td style="${BOT};height:0.52cm" class="ctr">${escT(v)}</td>`;
    const TOP = 'border-top:0.5pt solid #000';

    let ren = '';
    if (ot.recomendaciones) {
      ren = `<tr><td class="mono" style="${LAT};${TOP};${BOT};padding:2px 4px">` +
            escT(ot.recomendaciones).replace(/\n/g, '<br>') + '</td></tr>';
      nRengl = Math.max(nRengl - 1, 0);
    } else {
      ren = `<tr><td style="${LAT};${TOP};${BOT};height:${H.p2Rengl}cm">&nbsp;</td></tr>`;
      nRengl = Math.max(nRengl - 1, 0);
    }
    for (let i = 0; i < nRengl; i++) {
      ren += `<tr><td style="${LAT};${BOT};height:${H.p2Rengl}cm">&nbsp;</td></tr>`;
    }

    const interior = `<table>${cols(W.tiemp)}
  <tr>
    <td class="nb">FECHA INICIO PARADA:</td>${u(fechaSAP(ot.fecha_inicio_parada))}<td class="nb"></td>
    <td class="nb">FECHA INICIO INTERV:</td>${u(fechaSAP(ot.fecha_inicio_interv))}<td class="nb"></td>
    <td class="nb">FECHA FIN PARADA:</td>${u(fechaSAP(ot.fecha_fin_parada))}
  </tr>
  <tr>
    <td class="nb">HORA INICIO PARADA:</td>${u(hora(ot.hora_inicio_parada))}<td class="nb"></td>
    <td class="nb">HORA INICIO INTERV:</td>${u(hora(ot.hora_inicio_interv))}<td class="nb"></td>
    <td class="nb">HORA FIN PARADA:</td>${u(hora(ot.hora_fin_parada))}
  </tr>
</table>`;

    return `<div style="height:0.11cm;font-size:1pt;line-height:1pt">&nbsp;</div>
<table>${col1(W.total)}
${ren}
  <tr><td class="mono" style="${LAT};padding:0.42cm 4px 0.08cm">Tiempos de Parada e Intervención</td></tr>
  <tr><td style="${LAT};padding:0 3px">${interior}</td></tr>
  <tr><td style="${LAT};${BOT};height:1.17cm">&nbsp;</td></tr>
</table>`;
  }

  /* ------------------------ estado de la orden ---------------------------- */

  function estadoOrden(ot) {
    const e = String(ot.estado_orden || '').toUpperCase().trim();
    const caja = m => `<table style="width:0.72cm;margin:0 auto">${col1(0.72)}
      <tr><td class="cbx" style="height:0.56cm">${m}</td></tr></table>`;
    return `
<div class="sp">&nbsp;</div>
<table>${col1(W.total)}
  <tr><td class="nb ctr" style="font-weight:bold;font-size:10.5pt;padding-bottom:0.34cm">ESTADO DE LA ORDEN DE TRABAJO:</td></tr>
</table>
<table>${cols([5.08, 8.64, 4.90])}
  <tr><td class="nb"></td><td class="rule"></td><td class="nb"></td></tr>
</table>
<table>${col1(W.total)}
  <tr><td class="nb ctr" style="font-weight:bold;font-size:10.5pt;padding-top:0.22cm">MARQUE CON "X" EL ESTADO DE LA ORDEN:</td></tr>
</table>
<div style="height:0.62cm;font-size:1pt;line-height:1pt">&nbsp;</div>
<table>${cols(W.estad)}
  <tr>
    <td class="nb"></td><td class="nb ctr" style="font-weight:bold;font-size:10.5pt">EN PROCESO</td>
    <td class="nb"></td><td class="nb ctr" style="font-weight:bold;font-size:10.5pt">FINALIZADA</td><td class="nb"></td>
  </tr>
  <tr><td class="nb" style="height:0.42cm;font-size:1pt;line-height:1pt;padding:0"></td>
      <td class="nb"></td><td class="nb"></td><td class="nb"></td><td class="nb"></td></tr>
  <tr>
    <td class="nb"></td><td class="nb">${caja(e === 'EN PROCESO' ? 'X' : '&nbsp;')}</td>
    <td class="nb"></td><td class="nb">${caja(e === 'FINALIZADA' ? 'X' : '&nbsp;')}</td><td class="nb"></td>
  </tr>
</table>`;
  }

  /* -------------------------- recepción de servicio ----------------------- */

  function recepcion(ot) {
    const r  = ot.recepcion || {};
    const mr = 'border:none;text-align:right;vertical-align:middle;' +
               'font-family:"Courier New",Courier,monospace;font-size:10pt';
    /* La casilla es un cuadro fijo de 0.51 cm: si se deja como celda directa,
       se estira hasta la altura de la fila. Va anidada en su propia tabla. */
    const caja = m => `<table style="width:0.51cm">${col1(0.51)}
      <tr><td class="cbx" style="height:0.51cm">${m}</td></tr></table>`;
    const vb = 'border:none;padding:0 0 2px;vertical-align:bottom';
    const preg = (txt, v) => `<tr>
  <td class="nb" style="height:0.65cm;vertical-align:middle;font-size:10pt">${txt}</td>
  <td style="${mr}">SI</td><td style="${vb}">${caja(v === true ? 'X' : '&nbsp;')}</td>
  <td style="${mr}">NO</td><td style="${vb}">${caja(v === false ? 'X' : '&nbsp;')}</td>
  <td class="nb"></td>
</tr>`;

    const cuerpo = `
<table style="width:${W.rint}cm">${col1(W.rint)}
  <tr><td class="nb" style="font-weight:bold;font-size:12pt;${BOT};padding:2px 2px 2px">RECEPCIÓN DE SERVICIO(USUARIO)</td></tr>
</table>
<table style="width:${W.rint}cm">${cols(W.sino)}
${preg('Se recibe trabajo a conformidad', r.conformidad)}
${preg('Se entrega el área en buenas condiciones de orden y aseo', r.area)}
${preg('Se entrega el equipo en buenas condiciones de orden y aseo', r.equipo)}
</table>
<div class="sp">&nbsp;</div>
<table style="width:${W.rint}cm">${cols([3.55, 12.85])}
  <tr><td class="nb" style="height:0.52cm">Observaciones:</td>
      <td style="${BOT};height:0.44cm">${escT(r.observaciones)}</td></tr>
</table>
<table style="width:${W.rint}cm">${cols([0.51, 15.89])}
  <tr><td class="nb"></td><td style="${BOT};height:0.44cm">&nbsp;</td></tr>
  <tr><td class="nb"></td><td style="${BOT};height:0.44cm">&nbsp;</td></tr>
  <tr><td class="nb"></td><td style="${BOT};height:0.44cm">&nbsp;</td></tr>
</table>
<div style="height:1.14cm;font-size:1pt;line-height:1pt">&nbsp;</div>
<table style="width:${W.rint}cm">${cols(W.nfa)}
  <tr><td class="nb"></td><td class="rule"></td><td class="nb"></td><td class="rule"></td>
      <td class="nb"></td><td class="rule"></td><td class="nb"></td></tr>
  <tr><td class="nb"></td><td class="nb mono" style="padding-top:5px">NOMBRE</td><td class="nb"></td>
      <td class="nb mono" style="padding-top:5px">FIRMA</td><td class="nb"></td>
      <td class="nb mono" style="padding-top:5px">AREA</td><td class="nb"></td></tr>
</table>`;

    return `
<div style="height:0.55cm;font-size:1pt;line-height:1pt">&nbsp;</div>
<table>${cols(W.rext)}
  <tr>
    <td class="nb"></td>
    <td class="out" style="padding:3px 6px 6px">${cuerpo}</td>
    <td class="nb"></td>
  </tr>
</table>`;
  }

  /* ------------------------------- firmas --------------------------------- */
  /* Los rótulos van alineados a la izquierda bajo cada raya, no centrados. */

  function firmas() {
    const lb = 'border:none;font-weight:bold;padding:2px 0 0 6px;font-size:8.5pt';
    return `
<div style="height:2.40cm;font-size:1pt;line-height:1pt">&nbsp;</div>
<table>${cols(W.firma)}
  <tr>
    <td class="nb"></td><td class="rule"></td><td class="nb"></td><td class="rule"></td>
    <td class="nb"></td><td class="rule"></td><td class="nb"></td><td class="rule"></td><td class="nb"></td>
  </tr>
  <tr>
    <td class="nb"></td><td style="${lb}">EJECUTOR DE MTTO</td>
    <td class="nb"></td><td style="${lb}">SUPERVISOR O&amp;M</td>
    <td class="nb"></td><td style="${lb}">SENIOR / PLANEADOR DE<br>MTTO GTEC</td>
    <td class="nb"></td><td style="${lb}">DOCUMENTADOR O&amp;M</td><td class="nb"></td>
  </tr>
</table>
<div style="height:2.35cm;font-size:1pt;line-height:1pt">&nbsp;</div>
<table>${cols(W.clerk)}
  <tr><td class="nb"></td><td class="rule"></td><td class="nb"></td></tr>
  <tr><td class="nb"></td><td class="nb ctr" style="font-weight:bold;padding-top:2px">CLERK GTEC</td><td class="nb"></td></tr>
</table>`;
  }

  /* ------------------------------- render --------------------------------- */

  function render(ot) {
    const nOps = (ot.operaciones || []).length;
    // El impreso SAP de referencia trae 9 operaciones y 8 renglones en blanco.
    // Si la orden lleva materiales, se descuentan los renglones que ocupa esa
    // tabla para que la hoja 1 siga cerrando en una sola página.
    const descuento = Math.ceil(altoMateriales(ot) / (H.dsRengl + 0.05));
    const rengP1 = Math.min(16, Math.max(3, 8 + (9 - nOps) - descuento));

    const p1 = `<div class="pag">
${cabecera(ot, 1)}
${bloqueDatos(ot)}
${tablaOperaciones(ot)}
${tablaMateriales(ot)}
${cajaDescripcion(ot, rengP1)}
</div>`;

    const p2 = `<div class="pag">
${cabecera(ot, 2)}
${cajaTiempos(ot, 7)}
${estadoOrden(ot)}
${recepcion(ot)}
</div>`;

    const p3 = `<div class="pag">
${cabecera(ot, 3)}
${firmas()}
</div>`;

    return `<style>${CSS}</style><div class="fo016">${p1}${p2}${p3}</div>`;
  }

  /* ------------------------------ impresión ------------------------------- */
  /* El margen va en @page, no en el body: con padding en el body solo la
     primera hoja recibe margen superior. */

  /* Chrome y Edge dejan de estampar su encabezado y pie (fecha, URL, n.º de
     página) cuando el margen de @page es cero. Por eso el margen real del
     formato se aplica como relleno dentro de cada hoja, no como margen de
     página. Este es el unico modo de suprimirlos sin tocar ajustes del
     navegador en cada equipo. */
  const PAD_HOJA = '0.88cm 1.30cm 0.88cm 1.12cm';
  const PAGE_CSS =
    '@page{size:21.0cm 29.7cm;margin:0}' +
    '.fo016 .pag{padding:' + PAD_HOJA + ';box-sizing:border-box}';
  /* Version envuelta en @media print, para inyectar en una pagina que ya
     esta en pantalla (patron #print-root). */
  const PRINT_CSS = '@media print{' + PAGE_CSS + '}';

  function imprimir(ot) {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>&nbsp;</title>
<style>${PAGE_CSS} html,body{margin:0;padding:0}</style>
</head><body>${render(ot)}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  /* --------------------------- exportación Word --------------------------- */

  function exportarWord(ot, nombre) {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>
<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page WordSection1{size:21.0cm 29.7cm;margin:0.88cm 1.30cm 0.88cm 1.12cm;}
div.WordSection1{page:WordSection1;}</style></head>
<body><div class="WordSection1">${render(ot)}</div></body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre || `OT_${ot.numero_ot || 'FO016'}.doc`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ------------------------------- ejemplo -------------------------------- */

  const EJEMPLO = {
    numero_ot: '100032747',
    logo: null,
    descripcion: 'MQT MTTO PVO MOTOR ELECTRICO',
    tag_equipo: '',
    clase_orden: 'ZPV Orden de Mtto Preventivo GTE',
    grp_planificador: 'G72 GPL CHAZA',
    clase_actividad: 'C05 Mtto Preventivo',
    puesto_responsable: 'MQTELEC',
    cod_equipo: '2000575',
    fecha_inicio: '2026-08-19',
    desc_equipo: 'MOTOR ELECTRICO 200HP UBH MQT02i',
    autor_aviso: '',
    ubicacion_tecnica: 'GTEC-PF-PUTN-CHZ-MQT-SINY-UPZOIY02',
    clase_aviso: 'Z1 Aviso Mtto PV',
    des_ubi_tecnica: 'POZO DE INYECCION AGUA MQT 2i UBC MQT01',
    no_aviso: '100035761',
    marca: 'HYUDAY',
    sintoma_averia: '',
    modelo: 'HLS447SR0408',
    causa: '',
    serie: '4W075K23-003',
    componente_falla: '',
    no_inventario: '',
    operaciones: [
      { oper:'0190', puesto:'MQTELEC', descripcion:'**12M MTTO MOT ELEC NORTH  PE447T-200**' },
      { oper:'0200', puesto:'MQTELEC', descripcion:'ALISTAMIENTO DE HERRAMIENTA - MATERIALES' },
      { oper:'0210', puesto:'MQTELEC', descripcion:'PERMISO DE TRABAJO - AST' },
      { oper:'0220', puesto:'MQTELEC', descripcion:'DESPLAZAMIENTOS' },
      { oper:'0230', puesto:'MQTELEC', descripcion:'12M MTTO MOT ELEC NORTH  PE447T-200' },
      { oper:'0240', puesto:'MQTELEC', descripcion:'APLICACIÓN DE INSTRUCTIVO GTEC-MT-IN-045' },
      { oper:'0250', puesto:'MQTELEC', descripcion:'GESTION AMBIENTAL - DISPOSICION DE RESID' },
      { oper:'0260', puesto:'MQTELEC', descripcion:'ENTREGA A OPERACIONES' },
      { oper:'0270', puesto:'MQTELEC', descripcion:'DILIGENCIAMIENTO DE REPORTE' }
    ],
    /* Opcional: si viene vacío o ausente, la sección no se imprime. */
    materiales: [],
    como_encontro: '', actividad_realizada: '', como_quedo: '', recomendaciones: '',
    fecha_inicio_parada:'', hora_inicio_parada:'',
    fecha_inicio_interv:'', hora_inicio_interv:'',
    fecha_fin_parada:'',    hora_fin_parada:'',
    estado_orden: '',
    recepcion: { conformidad:null, area:null, equipo:null, observaciones:'' }
  };

  return { render, imprimir, exportarWord, CSS, PAGE_CSS, PRINT_CSS, EJEMPLO, fechaSAP, oper };
})();

if (typeof window !== 'undefined') window.FO016 = FO016;
