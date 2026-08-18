/* ============================================================================
   FO-016 — Generador de Orden de Trabajo
   Clon estructural del formato GTEC-MT-FO-016 VERSIÓN 00 (FECHA 2018/05/16)
   tal como lo imprime SAP.

   rev.6 — Estilos EN LÍNEA y ninguna tabla con bordes mezclados.

           Dos limitaciones de Word obligan a esto:
           1. No interpreta selectores de descendencia (".fo016 .bx td"):
              los reduce a "td" y pone borde a todas las celdas.
           2. Si dentro de una misma tabla unas celdas llevan borde y otras
              no, se lo aplica a todas. Por eso cada raya y cada casilla van
              en su propia tabla anidada, y las tablas contenedoras no
              llevan borde en ninguna celda.

   Retícula tomada del impreso SAP de la OT 100032747, midiendo el
   rasterizado a 200 dpi y leyendo los operadores de color del PDF:
     hoja A4 (21.0 x 29.7 cm), área útil 18.58 cm,
     márgenes superior 0.88 / izquierdo 1.12 / derecho 1.30 cm,
     color de banda #ABD4D4.
   ========================================================================== */

const FO016 = (function () {
  'use strict';

  const CODIGO    = 'GTEC-MT-FO-016';
  const VERSION   = '00';
  const FECHA_FO  = '2018/05/16';
  const TOTAL_PAG = 3;

  /* Anchos en cm medidos sobre el impreso SAP. */
  const W = {
    total: 18.58,
    cab:   [7.15, 6.94, 4.49],
    datos: [3.67, 7.60, 3.53, 3.78],
    oper:  [1.19, 1.75, 8.13, 1.72, 1.25, 0.96, 1.63, 1.95],
    mat:   [2.60, 5.57, 2.42, 1.30, 2.23, 2.23, 2.23],
    chk:   [1.99, 0.51, 3.00, 0.49, 3.00, 0.49, 3.00, 0.51, 5.59],
    tiemp: [4.06, 1.99, 0.22, 3.90, 2.11, 0.19, 3.93, 2.04],
    estad: [4.89, 4.20, 0.57, 4.20, 4.76],
    rext:  [1.03, 16.80, 0.75],
    rint:  16.40,
    sino:  [11.55, 0.57, 0.51, 1.37, 0.51, 1.89],
    nfa:   [0.51, 4.52, 0.94, 4.49, 0.97, 4.52, 0.45],
    firma: [0.43, 4.01, 0.46, 4.04, 0.53, 4.02, 0.61, 4.19, 0.33],
    clerk: [5.51, 6.76, 6.35]
  };

  /* Alturas en cm. */
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

  /* SAP conserva los espacios dobles ("NORTH  PE447T-200"); HTML los colapsa. */
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

  /* --------------------------- estilos en línea ---------------------------- */

  const B     = '0.5pt solid #000';
  const ARIAL = 'font-family:Arial,Helvetica,sans-serif';
  const MONO  = "font-family:'Courier New',Courier,monospace;font-size:10pt";
  const TD    = `padding:1px 3px;vertical-align:top;${ARIAL};font-size:8.5pt`;
  const NB    = `padding:1px 3px;vertical-align:top;${ARIAL};font-size:8.5pt;border:none`;
  const BD    = `border:${B}`;
  const BB    = `border-bottom:${B}`;
  const BT    = `border-top:${B}`;
  const LAT   = `border-left:${B};border-right:${B}`;
  const BANDA = `${TD};background:#ABD4D4;${BD};font-weight:bold;text-align:center;` +
                `font-size:10.5pt;padding:1px;vertical-align:middle`;
  const THD   = `${TD};${BD};font-weight:bold;text-align:center;font-size:8.5pt;padding:1px`;
  const CBX   = `${BD};text-align:center;padding:0;${ARIAL};font-size:8pt;vertical-align:middle`;
  const RULE  = `border:none;${BB};font-size:1pt;line-height:1pt;height:1pt;padding:0`;
  const LBL   = `${TD};font-weight:bold;white-space:nowrap`;
  const SPACER = alto => `<div style="height:${alto}cm;font-size:1pt;line-height:1pt">&nbsp;</div>`;

  /* tbN: tabla sin bordes en ninguna celda (lleva border="0", que es la
     pista que Word entiende). tbl: tabla cuyas celdas sí llevan borde. */
  const tbN = (ancho, anchos) =>
    `<table border="0" cellspacing="0" cellpadding="0" ` +
    `style="border-collapse:collapse;margin:0;width:${ancho}cm">` +
    (Array.isArray(anchos) ? cols(anchos) : col1(anchos));
  const tbl = (ancho, anchos) =>
    `<table cellspacing="0" cellpadding="0" ` +
    `style="border-collapse:collapse;margin:0;width:${ancho}cm">` +
    (Array.isArray(anchos) ? cols(anchos) : col1(anchos));

  /** Raya horizontal suelta, en su propia tabla. */
  const raya = ancho => `${tbl(ancho, ancho)}` +
    `<tr><td style="${BB};height:1pt;font-size:1pt;line-height:1pt;padding:0">&nbsp;</td></tr></table>`;

  /** Casilla de marcar: cuadro fijo que no se estira con la fila. */
  const cuadro = (m, lado, alto) => `${tbl(lado, lado)}` +
    `<tr><td style="${CBX};height:${alto || lado}cm">${m}</td></tr></table>`;

  /** Campo con línea inferior para diligenciar. */
  const campo = (ancho, valor, alto) => `${tbl(ancho, ancho)}` +
    `<tr><td style="${TD};${BB};text-align:center;height:${alto || 0.52}cm">${valor}</td></tr></table>`;

  /** Marco exterior: una sola celda con borde que envuelve el contenido. */
  const marco = (ancho, contenido, pad) => `${tbl(ancho, ancho)}` +
    `<tr><td style="${BD};padding:${pad || '0'};vertical-align:top">${contenido}</td></tr></table>`;

  const tabla = (anchos, extra) =>
    `<table style="border-collapse:collapse;margin:0;width:${W.total}cm` +
    (extra ? ';' + extra : '') + '">' +
    (Array.isArray(anchos) ? cols(anchos) : col1(anchos));

  const tablaAncho = (ancho, anchos) =>
    `<table style="border-collapse:collapse;margin:0;width:${ancho}cm">` +
    (Array.isArray(anchos) ? cols(anchos) : col1(anchos));

  /* Solo reglas de página: Word y los navegadores sí las respetan, y no
     dependen de selectores de descendencia. */
  const CSS = `
.fo016{width:${W.total}cm;margin:0;${ARIAL};font-size:8.5pt;color:#000;line-height:1.1}
.fo016-pag{page-break-after:always}
.fo016-fin{page-break-after:auto}
`;

  /* Chrome y Edge dejan de estampar su encabezado y pie (fecha, URL, n.º de
     página) cuando el margen de @page es cero. Por eso el margen real del
     formato se aplica como relleno dentro de cada hoja. Es el único modo de
     suprimirlos sin tocar ajustes del navegador en cada equipo. */
  const PAGE_CSS =
    '@page{size:21.0cm 29.7cm;margin:0}' +
    '.fo016-pag{padding:0.88cm 1.30cm 0.88cm 1.12cm;box-sizing:border-box}';
  const PRINT_CSS = '@media print{' + PAGE_CSS + '}';

  /* ------------------------------ cabecera -------------------------------- */

  function cabecera(ot, pag) {
    /* Logo: 5.40 x 1.47 cm, borde superior a 0.62 cm del tope y 0.24 cm del
       margen. No va centrado verticalmente. La celda del logo no lleva borde,
       así que el recuadro de la derecha va en su propia tabla anidada: si
       compartieran tabla, Word le pondría borde también al logo. */
    const src = ot.logo || (typeof FO016_LOGO !== 'undefined' ? FO016_LOGO : null);
    const logo = src
      ? `<img src="${esc(src)}" width="204" height="56" style="width:5.40cm;height:1.47cm" alt="">`
      : '';
    const anchoDer = W.cab[1] + W.cab[2];
    const ttl = `${TD};${BD};font-weight:bold;text-align:center;font-size:10.5pt;vertical-align:middle`;
    const cod = `${TD};${BD};font-size:8.5pt;height:${H.cab}cm;vertical-align:middle`;

    const recuadro = `${tbl(anchoDer, [W.cab[1], W.cab[2]])}
  <tr>
    <td rowspan="2" style="${ttl}">ORDEN DE TRABAJO</td>
    <td style="${cod}">${CODIGO}</td>
  </tr>
  <tr><td style="${cod}">VERSIÓN: ${VERSION}</td></tr>
  <tr>
    <td rowspan="2" style="${ttl}">FORMATO</td>
    <td style="${cod}">FECHA: ${FECHA_FO}</td>
  </tr>
  <tr><td style="${cod}">Página ${pag} de ${TOTAL_PAG}</td></tr>
  <tr>
    <td style="${ttl}">ORDEN DE TRABAJO No.</td>
    <td style="${TD};${BD};font-size:8.5pt;height:${H.cabUlt}cm">${esc(ot.numero_ot)}</td>
  </tr>
</table>`;

    return `
${tbN(W.total, [W.cab[0], anchoDer])}
  <tr>
    <td style="border:none;padding:0.62cm 0 0 0.24cm;vertical-align:top">${logo}</td>
    <td style="border:none;padding:0;vertical-align:top">${recuadro}</td>
  </tr>
</table>
${SPACER(0.20)}`;
  }

  /* --------------------------- bloque de datos ----------------------------
     Marco exterior sin líneas internas. El marco es una tabla de una sola
     celda y el contenido va en una tabla interior sin bordes: es la única
     forma de que Word no dibuje la cuadrícula completa.                   */

  function bloqueDatos(ot) {
    const h = `height:${H.datos}cm`;
    const A = W.total - 0.06;                    // descuenta el grosor del marco
    const anchos = [W.datos[0], W.datos[1], W.datos[2], W.datos[3] - 0.06];
    const F = (l1, v1, l2, v2) => `<tr>
  <td style="${LBL};${h};border:none">${l1}</td>
  <td style="${TD};${h};border:none">${escT(v1)}</td>
  <td style="${LBL};${h};border:none">${l2}</td>
  <td style="${TD};${h};border:none">${escT(v2)}</td>
</tr>`;
    /* Des.ubi.técnica: negrita y a tres columnas — en el impreso SAP nunca se
       parte en dos líneas aunque el texto sea largo. */
    const desUbi = `<tr>
  <td style="${LBL};${h};border:none">Des.ubi.técnica</td>
  <td colspan="3" style="${TD};${h};border:none;font-weight:bold;white-space:nowrap">${escT(ot.des_ubi_tecnica)}</td>
</tr>`;

    const interior = `${tbN(A, anchos)}
${F('Descripción',         ot.descripcion,       'Tag Equipo',         ot.tag_equipo)}
${F('Clase de orden',      ot.clase_orden,       'GRP Planificador',   ot.grp_planificador)}
${F('Clase de Actividad',  ot.clase_actividad,   'Puesto responsable', ot.puesto_responsable)}
${F('Cod Equipo',          ot.cod_equipo,        'Fecha Inicio',       fechaSAP(ot.fecha_inicio))}
${F('Desc Equipo',         ot.desc_equipo,       'Autor de Aviso',     ot.autor_aviso)}
${F('Ubicación Téc.',      ot.ubicacion_tecnica, 'Clase Aviso',        ot.clase_aviso)}
${desUbi}
${F('No.Aviso',            ot.no_aviso,          'Marca',              ot.marca)}
${F('Sintoma de Averia',   ot.sintoma_averia,    'Modelo',             ot.modelo)}
${F('Causa',               ot.causa,             'Serie',              ot.serie)}
${F('Componente en falla', ot.componente_falla,  'No. Inventario',     ot.no_inventario)}
</table>`;

    return `
${marco(W.total, interior, '0')}
${SPACER(0.20)}`;
  }

  /* --------------------- operaciones de mantenimiento --------------------- */

  function tablaOperaciones(ot) {
    const h = `height:${H.opFila}cm`;
    const c = `${TD};${BD};text-align:center;${h}`;
    const filas = (ot.operaciones || []).map((o, i) => `<tr>
  <td style="${TD};${BD};${MONO};font-size:9.5pt;${h}">${oper(o.oper, i)}</td>
  <td style="${c}">${escT(o.puesto)}</td>
  <td style="${TD};${BD};${h}">${escT(o.descripcion)}</td>
  <td style="${c}">${hora(o.hora_inicio)}</td>
  <td style="${c}">${hora(o.hora_fin)}</td>
  <td style="${c}">${escT(o.cant)}</td>
  <td style="${c}">${escT(o.duracion)}</td>
  <td style="${c}">${fechaSAP(o.fecha)}</td>
</tr>`).join('');

    /* Los saltos de línea de los encabezados son fijos en SAP: no se deja que
       el navegador decida dónde partir. */
    const t = `${THD};white-space:nowrap;height:${H.opCab}cm`;
    return `
${tabla(W.oper)}
  <tr><td colspan="8" style="${BANDA};height:${H.opBanda}cm">OPERACIONES DE MANTENIMIENTO</td></tr>
  <tr>
    <td style="${t}">OPER</td>
    <td style="${t}">Puesto de<br>Trabajo</td>
    <td style="${t}">Descripción operación</td>
    <td style="${t}">Hora Inicio</td><td style="${t}">Hora Fin</td>
    <td style="${t}">Cant</td><td style="${t}">Dur. real</td>
    <td style="${t}">Fecha<br>Realización</td>
  </tr>
${filas}
</table>`;
  }

  /* ------------------- repuestos y materiales (opcional) ------------------
     Solo se imprime cuando la orden trae materiales. La versión 00 del
     formato no la contempla: es un agregado deliberado, construido con las
     mismas convenciones del resto del documento. Se rellena hasta
     H.matMin renglones para anotar a mano en campo.                       */

  function tablaMateriales(ot) {
    const mats = ot.materiales || [];
    if (!mats.length) return '';
    const h = `height:${H.matFila}cm`;
    const c = `${TD};${BD};text-align:center;${h}`;
    let filas = '';
    for (let i = 0; i < Math.max(H.matMin, mats.length); i++) {
      const m = mats[i] || {};
      filas += `<tr>
  <td style="${TD};${BD};${h}">${escT(m.codigo)}</td>
  <td style="${TD};${BD};${h}">${escT(m.descripcion)}</td>
  <td style="${c}">${escT(m.cant_reservada)}</td>
  <td style="${c}">${escT(m.unidad)}</td>
  <td style="${c}">${escT(m.cant_tomada)}</td>
  <td style="${c}">${escT(m.cant_disponer)}</td>
  <td style="${TD};${BD};${h}">${escT(m.almacen)}</td>
</tr>`;
    }
    const t = `${THD};height:${H.opCab}cm`;
    const nw = `${t};white-space:nowrap`;
    return `
${SPACER(0.20)}
${tabla(W.mat)}
  <tr><td colspan="7" style="${BANDA};height:${H.opBanda}cm">REPUESTOS Y MATERIALES</td></tr>
  <tr>
    <td style="${nw}">CÓDIGO</td><td style="${nw}">DESCRIPCIÓN</td>
    <td style="${t}">CANT.<br>RESERVADA</td><td style="${nw}">UND</td>
    <td style="${t}">CANT.<br>TOMADA</td><td style="${t}">CANT.<br>DISPONER</td>
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
    const bc = 'border:none;padding:0;vertical-align:top';
    const lb = `border:none;padding:1px 0 1px 6px;vertical-align:middle;${MONO}`;
    const q = e => `<td style="${bc}">${cuadro(c(e), 0.51, H.dsCbx)}</td>`;
    return `${tbN(W.total, W.chk)}
  <tr>
    <td style="border:none">&nbsp;</td>
    ${q(et[0])}<td style="${lb}">${et[0]}</td>
    ${q(et[1])}<td style="${lb}">${et[1]}</td>
    ${q(et[2])}<td style="${lb}">${et[2]}</td>
    ${q(et[3])}<td style="${lb}">${et[3]}</td>
  </tr>
</table>`;
  }

  /* ------------- caja "descripción del trabajo" (página 1) ---------------- */

  function cajaDescripcion(ot, nRengl) {
    const q  = t => `<tr><td style="${LAT};padding:2px 4px 0;${MONO};height:0.66cm">${t}</td></tr>`;
    const qb = t => `<tr><td style="${LAT};${BB};padding:1px 4px 0;${MONO};height:0.44cm">${t}</td></tr>`;
    const cb = m => `<tr><td style="${LAT};padding:0">${boxes(m)}</td></tr>`;

    let ren = '';
    if (ot.actividad_realizada) {
      ren += `<tr><td style="${LAT};${BB};padding:2px 4px;${MONO}">` +
             escT(ot.actividad_realizada).replace(/\n/g, '<br>') + '</td></tr>';
      nRengl = Math.max(nRengl - 1, 0);
    }
    for (let i = 0; i < nRengl; i++) {
      ren += `<tr><td style="${LAT};${BB};height:${H.dsRengl}cm">&nbsp;</td></tr>`;
    }

    return `${tabla(W.total)}
  <tr><td style="${BANDA};height:${H.dsBanda}cm">DESCRIPCION DEL TRABAJO:(DEFINA EN FRASES CONCRETAS LA ACTIVIDAD&nbsp; REALIZADA)</td></tr>
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
    const e = `${NB};white-space:nowrap`;
    const bc = 'border:none;padding:0 0 0 2px;vertical-align:bottom';
    const u = (v, w) => `<td style="${bc}">${campo(w, escT(v))}</td>`;

    let ren = '';
    if (ot.recomendaciones) {
      ren = `<tr><td style="${LAT};${BT};${BB};padding:2px 4px;${MONO}">` +
            escT(ot.recomendaciones).replace(/\n/g, '<br>') + '</td></tr>';
      nRengl = Math.max(nRengl - 1, 0);
    } else {
      ren = `<tr><td style="${LAT};${BT};${BB};height:${H.p2Rengl}cm">&nbsp;</td></tr>`;
      nRengl = Math.max(nRengl - 1, 0);
    }
    for (let i = 0; i < nRengl; i++) {
      ren += `<tr><td style="${LAT};${BB};height:${H.p2Rengl}cm">&nbsp;</td></tr>`;
    }

    const T = W.tiemp;
    const interior = `${tbN(W.total - 0.20, T)}
  <tr>
    <td style="${e}">FECHA INICIO PARADA:</td>${u(fechaSAP(ot.fecha_inicio_parada), T[1] - 0.05)}<td style="border:none"></td>
    <td style="${e}">FECHA INICIO INTERV:</td>${u(fechaSAP(ot.fecha_inicio_interv), T[4] - 0.05)}<td style="border:none"></td>
    <td style="${e}">FECHA FIN PARADA:</td>${u(fechaSAP(ot.fecha_fin_parada), T[7] - 0.05)}
  </tr>
  <tr>
    <td style="${e}">HORA INICIO PARADA:</td>${u(hora(ot.hora_inicio_parada), T[1] - 0.05)}<td style="border:none"></td>
    <td style="${e}">HORA INICIO INTERV:</td>${u(hora(ot.hora_inicio_interv), T[4] - 0.05)}<td style="border:none"></td>
    <td style="${e}">HORA FIN PARADA:</td>${u(hora(ot.hora_fin_parada), T[7] - 0.05)}
  </tr>
</table>`;

    return `${SPACER(0.11)}
${tabla(W.total)}
${ren}
  <tr><td style="${LAT};padding:0.42cm 4px 0.08cm;${MONO}">Tiempos de Parada e Intervención</td></tr>
  <tr><td style="${LAT};padding:0 3px">${interior}</td></tr>
  <tr><td style="${LAT};${BB};height:1.17cm">&nbsp;</td></tr>
</table>`;
  }

  /* ------------------------ estado de la orden ---------------------------- */

  function estadoOrden(ot) {
    const e = String(ot.estado_orden || '').toUpperCase().trim();
    const t = `${NB};text-align:center;font-weight:bold;font-size:10.5pt`;
    const bc = 'border:none;padding:0;text-align:center';
    return `
${SPACER(0.20)}
${tbN(W.total, W.total)}
  <tr><td style="${t};padding-bottom:0.34cm">ESTADO DE LA ORDEN DE TRABAJO:</td></tr>
</table>
${tbN(W.total, [5.08, 8.64, 4.86])}
  <tr><td style="border:none"></td>
      <td style="border:none;padding:0">${raya(8.64)}</td>
      <td style="border:none"></td></tr>
</table>
${tbN(W.total, W.total)}
  <tr><td style="${t};padding-top:0.22cm">MARQUE CON "X" EL ESTADO DE LA ORDEN:</td></tr>
</table>
${SPACER(0.62)}
${tbN(W.total, W.estad)}
  <tr>
    <td style="border:none"></td><td style="${t}">EN PROCESO</td>
    <td style="border:none"></td><td style="${t}">FINALIZADA</td><td style="border:none"></td>
  </tr>
  <tr><td colspan="5" style="border:none;height:0.42cm;font-size:1pt;line-height:1pt;padding:0"></td></tr>
  <tr>
    <td style="border:none"></td>
    <td style="${bc}"><div style="width:0.72cm;margin:0 auto">${cuadro(e === 'EN PROCESO' ? 'X' : '&nbsp;', 0.72, 0.56)}</div></td>
    <td style="border:none"></td>
    <td style="${bc}"><div style="width:0.72cm;margin:0 auto">${cuadro(e === 'FINALIZADA' ? 'X' : '&nbsp;', 0.72, 0.56)}</div></td>
    <td style="border:none"></td>
  </tr>
</table>`;
  }

  /* -------------------------- recepción de servicio ----------------------- */

  function recepcion(ot) {
    const r  = ot.recepcion || {};
    const mr = `border:none;text-align:right;vertical-align:middle;${MONO};font-size:10pt`;
    const vb = 'border:none;padding:0 0 2px;vertical-align:bottom';
    const preg = (txt, v) => `<tr>
  <td style="${NB};height:0.65cm;vertical-align:middle;font-size:10pt">${txt}</td>
  <td style="${mr}">SI</td><td style="${vb}">${cuadro(v === true ? 'X' : '&nbsp;', 0.51)}</td>
  <td style="${mr}">NO</td><td style="${vb}">${cuadro(v === false ? 'X' : '&nbsp;', 0.51)}</td>
  <td style="border:none"></td>
</tr>`;
    const lineaObs = txt => `<tr><td style="border:none"></td>
      <td style="border:none;padding:0">${campo(15.89, txt || '&nbsp;', 0.44)}</td></tr>`;

    const cuerpo = `
${tbN(W.rint, W.rint)}
  <tr><td style="${NB};font-weight:bold;font-size:12pt;padding:2px 2px 2px">RECEPCIÓN DE SERVICIO(USUARIO)</td></tr>
  <tr><td style="border:none;padding:0">${raya(W.rint)}</td></tr>
</table>
${tbN(W.rint, W.sino)}
${preg('Se recibe trabajo a conformidad', r.conformidad)}
${preg('Se entrega el área en buenas condiciones de orden y aseo', r.area)}
${preg('Se entrega el equipo en buenas condiciones de orden y aseo', r.equipo)}
</table>
${SPACER(0.20)}
${tbN(W.rint, [3.55, 12.85])}
  <tr><td style="${NB};height:0.52cm">Observaciones:</td>
      <td style="border:none;padding:0">${campo(12.85, escT(r.observaciones) || '&nbsp;')}</td></tr>
</table>
${tbN(W.rint, [0.51, 15.89])}
${lineaObs()}${lineaObs()}${lineaObs()}
</table>
${SPACER(1.14)}
${tbN(W.rint, W.nfa)}
  <tr><td style="border:none"></td><td style="border:none;padding:0">${raya(W.nfa[1])}</td>
      <td style="border:none"></td><td style="border:none;padding:0">${raya(W.nfa[3])}</td>
      <td style="border:none"></td><td style="border:none;padding:0">${raya(W.nfa[5])}</td>
      <td style="border:none"></td></tr>
  <tr><td style="border:none"></td><td style="${NB};${MONO};padding-top:5px">NOMBRE</td>
      <td style="border:none"></td><td style="${NB};${MONO};padding-top:5px">FIRMA</td>
      <td style="border:none"></td><td style="${NB};${MONO};padding-top:5px">AREA</td>
      <td style="border:none"></td></tr>
</table>`;

    return `
${SPACER(0.55)}
${tbN(W.total, W.rext)}
  <tr>
    <td style="border:none"></td>
    <td style="border:none;padding:0">${marco(W.rext[1], cuerpo, '3px 6px 6px')}</td>
    <td style="border:none"></td>
  </tr>
</table>`;
  }

  /* ------------------------------- firmas ---------------------------------
     Los rótulos van alineados a la izquierda bajo cada raya, no centrados. */

  function firmas() {
    const lb = `border:none;font-weight:bold;padding:2px 0 0 6px;${ARIAL};font-size:8.5pt`;
    const n = 'border:none';
    const p = 'border:none;padding:0';
    const F = W.firma;
    return `
${SPACER(2.40)}
${tbN(W.total, F)}
  <tr>
    <td style="${n}"></td><td style="${p}">${raya(F[1])}</td>
    <td style="${n}"></td><td style="${p}">${raya(F[3])}</td>
    <td style="${n}"></td><td style="${p}">${raya(F[5])}</td>
    <td style="${n}"></td><td style="${p}">${raya(F[7])}</td>
    <td style="${n}"></td>
  </tr>
  <tr>
    <td style="${n}"></td><td style="${lb}">EJECUTOR DE MTTO</td>
    <td style="${n}"></td><td style="${lb}">SUPERVISOR O&amp;M</td>
    <td style="${n}"></td><td style="${lb}">SENIOR / PLANEADOR DE<br>MTTO GTEC</td>
    <td style="${n}"></td><td style="${lb}">DOCUMENTADOR O&amp;M</td><td style="${n}"></td>
  </tr>
</table>
${SPACER(2.35)}
${tbN(W.total, W.clerk)}
  <tr><td style="${n}"></td><td style="${p}">${raya(W.clerk[1])}</td><td style="${n}"></td></tr>
  <tr><td style="${n}"></td>
      <td style="${NB};text-align:center;font-weight:bold;padding-top:2px">CLERK GTEC</td>
      <td style="${n}"></td></tr>
</table>`;
  }

  /* ------------------------------- render --------------------------------- */

  function render(ot) {
    const nOps = (ot.operaciones || []).length;
    /* El impreso SAP de referencia trae 9 operaciones y 8 renglones en blanco.
       Si la orden lleva materiales se descuentan los renglones que ocupa esa
       tabla, para que la hoja 1 siga cerrando en una sola página. */
    const descuento = Math.ceil(altoMateriales(ot) / (H.dsRengl + 0.05));
    const rengP1 = Math.min(16, Math.max(3, 8 + (9 - nOps) - descuento));

    const p1 = `<div class="fo016-pag">
${cabecera(ot, 1)}
${bloqueDatos(ot)}
${tablaOperaciones(ot)}
${tablaMateriales(ot)}
${cajaDescripcion(ot, rengP1)}
</div>`;

    const p2 = `<div class="fo016-pag">
${cabecera(ot, 2)}
${cajaTiempos(ot, 7)}
${estadoOrden(ot)}
${recepcion(ot)}
</div>`;

    const p3 = `<div class="fo016-pag fo016-fin">
${cabecera(ot, 3)}
${firmas()}
</div>`;

    return `<style>${CSS}</style><div class="fo016">${p1}${p2}${p3}</div>`;
  }

  /* ------------------------------ impresión ------------------------------- */

  function imprimir(ot) {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>&nbsp;</title><style>${PAGE_CSS} html,body{margin:0;padding:0}</style>
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
div.WordSection1{page:WordSection1;}
.fo016-pag{page-break-after:always}
.fo016-fin{page-break-after:auto}</style></head>
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
