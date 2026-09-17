/* ============================================================================
   FO-016 — Generador de Orden de Trabajo
   Clon estructural del formato GTEC-MT-FO-016 VERSIÓN 00 (FECHA 2018/05/16)
   tal como lo imprime SAP.

   rev.8 — El presupuesto de página se mide, ya no se supone. Las filas de
           operaciones y de materiales se contaban a una línea cada una; las
           descripciones largas se parten en dos y la hoja se desbordaba. Ahora
           cada fila se mide por el texto que lleva, el bloque de datos también,
           y antes de imprimir se mide el documento ya maquetado: si alguna hoja
           se pasó, se reparte otra vez con el sobrante real sumado al
           presupuesto. La hoja queda además acotada a la altura del papel, de
           modo que un error residual recorta medio renglón en vez de regalar
           una hoja sin cabecera ni margen. Se agregó la columna N. RESERVA a
           repuestos y materiales.

   rev.7 — Paginación por presupuesto. El documento dejó de ser tres hojas
           fijas: cuando el contenido no cabe se abren hojas de continuación
           con cabecera completa y "Página N de M" dinámico, en vez de dejar
           que el navegador meta un salto donde le alcance. Aquel salto
           implícito nacía sin cabecera y sin el relleno que hace de margen,
           y por eso el bloque "¿Cómo quedó el equipo?" terminaba solo y
           pegado al borde del papel.

           El reparto es una sola pasada sobre todo el documento, así que una
           hoja de continuación sigue de largo con lo que venga detrás en vez
           de cerrar con media hoja en blanco. El único corte que no depende
           del espacio es el de la hoja 1, que cierra después de
           "Recomendaciones adicionales" porque así lo hace el impreso de SAP.

           Con contenido que cabe, la salida es la misma de siempre: el caso
           de referencia rinde exactamente las mismas tres hojas y el mismo
           texto que la rev.6.

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
    mat:   [1.95, 4.55, 2.05, 1.75, 1.00, 1.75, 1.85, 3.68],
    chk:   [1.99, 0.51, 3.00, 0.49, 3.00, 0.49, 3.00, 0.51, 5.59],
    tiemp: [4.06, 1.99, 0.22, 3.90, 2.11, 0.19, 3.93, 1.98],
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
    p2Rengl: 0.655
  };

  /* ------------------- presupuesto de página (rev.7) ----------------------
     El formato es una retícula fija de tres hojas. Mientras el contenido
     quepa, se imprime igual que el original de SAP. Cuando no cabe, el
     navegador metía un salto donde le alcanzaba: esa hoja implícita nace sin
     cabecera y sin el relleno que hace de margen (el relleno vive en
     .fo016-pag, que ya arrancó en la hoja anterior). De ahí el bloque
     "¿Cómo quedó el equipo?" suelto contra el borde del papel.

     La solución es cortar el flujo antes de que se pase, midiendo en cm, y
     abrir hoja de continuación con cabecera completa — que es exactamente
     como se comporta el impreso de SAP cuando el texto no cabe.

     Calibración: el impreso de referencia (OT 100032747) lleva 9 operaciones,
     sin materiales, y deja 8 renglones en la caja de descripción, con blanco
     sobrante al pie. SEGURIDAD reserva parte de ese blanco para absorber el
     error de las alturas estimadas. Es la única perilla que hay que mover si
     alguna hoja llegara a desbordarse: subirla achica el flujo. */

  const ALTO_HOJA  = 29.70;
  const MARGEN_V   = 0.88;
  const ALTO_UTIL  = ALTO_HOJA - 2 * MARGEN_V;   // 27.94 cm

  const ALTO_CAB   = 3.43;   // cabecera + espaciador
  const ALTO_DATOS = 5.16;   // bloque de datos + espaciador
  const OPS_HEAD   = 1.52;   // banda + fila de encabezados de operaciones
  const MAT_HEAD   = 1.60;   // espaciador + banda + encabezados de materiales
  const DESC_HEAD  = 2.28;   // banda + ¿cómo encontró? + casillas + rótulo
  const DESC_COLA  = 1.60;   // ¿cómo quedó? + casillas + rótulo recomendaciones

  const RENGLON    = H.dsRengl + 0.05;   // 0.68 cm — renglón de la hoja 1
  const RENGLON2   = H.p2Rengl + 0.05;   // 0.705 cm — renglón de la hoja 2
  const FILA_OP    = H.opFila  + 0.06;   // 0.50 cm
  const FILA_MAT   = H.matFila + 0.06;   // 0.52 cm

  /* SEGURIDAD ya no es la única defensa: imprimir() mide las hojas ya
     maquetadas y, si alguna se pasa, vuelve a repartir con el sobrante real
     sumado aquí. Por eso puede quedarse en un valor pequeño y no desperdiciar
     papel en el caso normal. */
  const SEGURIDAD  = 1.20;
  const reserva    = extra => SEGURIDAD + Math.max(0, extra || 0);

  /* --------- alto real de una fila cuando el texto se parte en líneas -----
     El paginador contaba una línea por fila de operación y de material. No es
     cierto: "Valvula,Bola,Jaula,Bomba,NATIONAL,OIL,WEL" no cabe en la columna
     de descripción y el navegador la parte en dos, con lo que la fila mide el
     doble. Con seis materiales y nueve operaciones el error acumulado se comió
     los 1.50 cm de SEGURIDAD y la hoja se desbordó: el navegador partió la
     caja "¿Cómo quedó el equipo?" contra el borde del papel y mandó el resto a
     una hoja implícita, que nace sin cabecera y sin margen. Esa es la hoja
     casi en blanco.

     Arial 8.5 pt con el interlineado 1.1 del formato mide 0.330 cm por línea.
     El ancho medio de carácter se toma en 0.55 em, deliberadamente ancho: es
     preferible sobrestimar una fila y dejar un renglón de aire que quedarse
     corto y perder una hoja entera.                                        */

  const PT_CM    = 2.54 / 72;
  const LINEA_8  = 8.5 * 1.1 * PT_CM;    // 0.330 cm — una línea de texto
  const CHAR_8   = 8.5 * 0.55 * PT_CM;   // 0.165 cm — un carácter
  const PAD_FILA = 0.10;                 // relleno vertical + grosor de borde

  /** Cuántas líneas ocupa un texto en una celda de 'anchoCm'. */
  function lineasEn(txt, anchoCm) {
    const t = String(txt == null ? '' : txt).trim();
    if (!t) return 1;
    const n = Math.max(6, Math.floor((anchoCm - 0.18) / CHAR_8));
    return Math.max(1, renglonear(t, n).length);
  }

  /** Alto de una fila de operación, contando el texto que se parte. */
  function altoFilaOp(o) {
    const l = lineasEn(o && o.descripcion, W.oper[2]);
    return Math.max(H.opFila, l * LINEA_8 + PAD_FILA) + 0.06;
  }

  /** Alto de una fila de material. Manda la columna que más líneas gasta. */
  function altoFilaMat(m) {
    const l = Math.max(lineasEn(m && m.descripcion, W.mat[1]),
                       lineasEn(m && m.codigo,      W.mat[0]),
                       lineasEn(m && m.almacen,     W.mat[7]));
    return Math.max(H.matFila, l * LINEA_8 + PAD_FILA) + 0.06;
  }

  /** Alto del bloque de datos. Un "Desc Equipo" largo también parte línea. */
  function altoDatos(ot) {
    const izq = W.datos[1], der = W.datos[3] - 0.06;
    const par = (a, b) => Math.max(lineasEn(a, izq), lineasEn(b, der));
    const filas = [
      par(ot.descripcion,       ot.tag_equipo),
      par(ot.clase_orden,       ot.grp_planificador),
      par(ot.clase_actividad,   ot.puesto_responsable),
      par(ot.cod_equipo,        ot.fecha_inicio),
      par(ot.desc_equipo,       ot.autor_aviso),
      par(ot.ubicacion_tecnica, ot.clase_aviso),
      lineasEn(ot.des_ubi_tecnica,        /* a tres columnas */
               W.datos[1] + W.datos[2] + W.datos[3] - 0.2),
      par(ot.no_aviso,          ot.marca),
      par(ot.sintoma_averia,    ot.modelo),
      par(ot.causa,             ot.serie),
      par(ot.componente_falla,  ot.no_inventario),
    ];
    const alto = filas.reduce(
      (t, l) => t + Math.max(H.datos, l * LINEA_8 + PAD_FILA), 0);
    return alto + 0.02 + 0.20;            // marco + espaciador
  }

  const MIN_RENG   = 3;
  const MAX_RENG   = 16;
  const OPS_REF    = 9;
  const RENG_REF   = 8;

  /* Hoja 2: bajo los renglones va una retícula que viaja entera —tiempos de
     parada, estado de la orden y recepción de servicio—. El impreso de
     referencia deja 7 renglones encima de ella. */
  const P2_RENG_BASE  = 7;
  const P2_RENG_MIN   = 3;
  const ESPACIADOR_P2 = 0.11;
  const ALTO_CIERRE   = 14.50;

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

  /* El bloque de descripción va en Courier 10 pt, que es monoespaciada: el
     ancho de carácter es exacto (0.6 em = 2.12 mm), así que el texto se puede
     repartir en renglones de forma determinista y escribir cada uno SOBRE su
     línea, como se diligencia a mano. Con el texto en un solo bloque quedaba
     un párrafo suelto y debajo un montón de rayas vacías. */
  const CHARS_RENGLON = 85;

  /* Los emoji y los signos pictográficos no son monoespaciados: el navegador
     los saca de una fuente de respaldo y ocupan cerca del doble que una letra
     Courier. Contarlos como un carácter hacía que un renglón con tres visto
     buenos se pasara del ancho de la caja y el navegador lo partiera en dos,
     rompiendo la retícula. Se cuentan como dos. */
  function anchoCar(ch) {
    const c = ch.codePointAt(0);
    return (c >= 0x2600 && c <= 0x27bf) || (c >= 0x1f300 && c <= 0x1faff) ||
           (c >= 0x2b00 && c <= 0x2bff) || (c >= 0x1100 && c <= 0x115f) ||
           (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) ||
           (c >= 0xff00 && c <= 0xff60) ? 2 : 1;
  }
  function anchoTxt(s) {
    let w = 0;
    for (const ch of String(s)) w += anchoCar(ch);
    return w;
  }
  /** Corta una palabra más larga que la caja, midiendo por ancho, no por índice. */
  function partir(palabra, n) {
    const trozos = [];
    let act = '', w = 0;
    for (const ch of palabra) {
      const a = anchoCar(ch);
      if (w + a > n && act) { trozos.push(act); act = ''; w = 0; }
      act += ch; w += a;
    }
    if (act) trozos.push(act);
    return trozos;
  }

  function renglonear(txt, n) {
    const out = [];
    String(txt == null ? '' : txt).split('\n').forEach(parrafo => {
      const p = parrafo.trim();
      if (!p) { out.push(''); return; }
      let linea = '';
      p.split(/\s+/).forEach(palabra => {
        if (!linea) linea = palabra;
        else if (anchoTxt(linea) + 1 + anchoTxt(palabra) <= n) linea += ' ' + palabra;
        else { out.push(linea); linea = palabra; }
        if (anchoTxt(linea) > n) {
          const trozos = partir(linea, n);
          linea = trozos.pop();
          trozos.forEach(t => out.push(t));
        }
      });
      if (linea) out.push(linea);
    });
    return out;
  }

  /* Igual que renglonear, pero cada renglón puede tener un ancho distinto:
     la primera línea de Observaciones es más corta porque comparte fila con
     el rótulo. Va en Arial, que no es monoespaciada, así que los topes son
     conservadores para que ninguna línea se desborde. */
  function renglonearVar(txt, anchos) {
    const palabras = String(txt == null ? '' : txt).trim().split(/\s+/).filter(Boolean);
    const out = [];
    let i = 0;
    while (palabras.length) {
      const n = anchos[Math.min(i, anchos.length - 1)];
      let linea = '';
      while (palabras.length &&
             (linea ? linea.length + 1 + palabras[0].length : palabras[0].length) <= n) {
        linea = linea ? linea + ' ' + palabras.shift() : palabras.shift();
      }
      if (!linea) linea = palabras.shift().slice(0, n);
      out.push(linea);
      i++;
    }
    return out;
  }

  const cols = a => '<colgroup>' + a.map(w => `<col style="width:${w}cm">`).join('') + '</colgroup>';
  const col1 = w => `<colgroup><col style="width:${w}cm"></colgroup>`;

  /* --------------------------- estilos en línea ---------------------------- */

  const B     = '0.5pt solid #000';
  const ARIAL = 'font-family:Arial,Helvetica,sans-serif';
  const MONO  = "font-family:'Courier New',Courier,monospace;font-size:10pt";
  const TD    = `padding:1px 3px;vertical-align:top;${ARIAL};font-size:8.5pt`;
  const NB    = `padding:1px 3px;vertical-align:top;${ARIAL};font-size:8.5pt;border:none`;
  /* Word no interpreta la AUSENCIA de un borde: si una celda solo declara
     border-bottom, le aplica los cuatro lados. Hay que declarar los cuatro
     siempre, con "none" en los que no van. bord(arriba,derecha,abajo,izq). */
  const bord = (t, r, b, l) =>
    `border-top:${t ? B : 'none'};border-right:${r ? B : 'none'};` +
    `border-bottom:${b ? B : 'none'};border-left:${l ? B : 'none'}`;
  const BD    = bord(1, 1, 1, 1);
  const BB    = bord(0, 0, 1, 0);
  const BT    = bord(1, 0, 0, 0);
  const LAT   = bord(0, 1, 0, 1);
  const LAT_B = bord(0, 1, 1, 1);   // laterales + inferior
  const LAT_TB= bord(1, 1, 1, 1);   // laterales + superior + inferior
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
  const campo = (ancho, valor, alto, alinear) => `${tbl(ancho, ancho)}` +
    `<tr><td style="${TD};${BB};text-align:${alinear || 'center'};` +
    `height:${alto || 0.52}cm">${valor}</td></tr></table>`;

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
  /* La hoja se fija a la altura del papel y recorta lo que sobre. Es la red
     de última instancia: si una estimación se quedara corta pese al reajuste
     de imprimir(), el navegador ya no puede partir el div en dos y regalar
     una hoja implícita sin cabecera ni margen. Se pierde medio renglón al pie
     en vez de una hoja entera. No se aplica en la exportación a Word, donde el
     margen es real y una altura fija correría el contenido a la hoja de atrás. */
  /* El ancho tiene que declararse junto con el recorte. La hoja hereda su
     ancho de .fo016, que mide 18.58 cm —el área útil, no el papel—, así que
     con box-sizing:border-box y 2.42 cm de relleno lateral la caja de
     contenido quedaba en 16.16 cm y las tablas, que miden 18.58, se salían.
     Mientras el desbordamiento era visible no se notaba; al recortarlo, el
     documento apareció cortado por la derecha. La hoja mide el papel entero:
     21 cm menos el relleno dan exactamente los 18.58 de la retícula. */
  const PAGE_CSS =
    '@page{size:21.0cm 29.7cm;margin:0}' +
    /* Lleva !important porque render() escribe su propio <style> con
       .fo016{width:18.58cm} DESPUÉS de este, dentro del body, y a igual
       especificidad gana la última regla. Es la única forma de ganarle sin
       reordenar la construcción del documento, que vale para Word igual. */
    '.fo016{width:21.0cm!important}' +
    '.fo016-pag{width:21.0cm;padding:0.88cm 1.30cm 0.88cm 1.12cm;' +
    'box-sizing:border-box;height:29.70cm;overflow:hidden}';
  const PRINT_CSS = '@media print{' + PAGE_CSS + '}';

  /* ------------------------------ cabecera -------------------------------- */

  function cabecera(ot, pag, total) {
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
  <tr><td style="${cod}">Página ${pag} de ${total || TOTAL_PAG}</td></tr>
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
    /* Des.ubi.técnica: negrita y a tres columnas, como en el impreso SAP.
       Lleva nowrap porque allí nunca se parte, pero eso solo es inofensivo
       mientras quepa: con el recorte de hoja que ahora acota el papel, un
       texto más largo que las tres columnas se cortaría en seco contra el
       borde. Si no cabe se deja partir, que es preferible a perderlo. */
    const anchoDesUbi = W.datos[1] + W.datos[2] + W.datos[3] - 0.2;   // 14.71 cm
    const cabeDesUbi = lineasEn(ot.des_ubi_tecnica, anchoDesUbi) <= 1;
    const desUbi = `<tr>
  <td style="${LBL};${h};border:none">Des.ubi.técnica</td>
  <td colspan="3" style="${TD};${h};border:none;font-weight:bold${
    cabeDesUbi ? ';white-space:nowrap' : ''}">${escT(ot.des_ubi_tecnica)}</td>
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

  /* Recibe el trozo de operaciones que cabe en la hoja, no la orden completa:
     así el encabezado se repite en cada hoja de continuación, como en SAP.
     'base' es el índice de la primera operación del trozo, necesario para que
     la numeración por defecto (0010, 0020, ...) siga corrida. */
  function tablaOperaciones(lista, base) {
    if (!lista || !lista.length) return '';
    const off = base || 0;
    const h = `height:${H.opFila}cm`;
    const c = `${TD};${BD};text-align:center;${h}`;
    const filas = lista.map((o, k) => { const i = off + k; return `<tr>
  <td style="${TD};${BD};${MONO};font-size:9.5pt;${h}">${oper(o.oper, i)}</td>
  <td style="${c}">${escT(o.puesto)}</td>
  <td style="${TD};${BD};${h}">${escT(o.descripcion)}</td>
  <td style="${c}">${hora(o.hora_inicio)}</td>
  <td style="${c}">${hora(o.hora_fin)}</td>
  <td style="${c}">${escT(o.cant)}</td>
  <td style="${c}">${escT(o.duracion)}</td>
  <td style="${c}">${fechaSAP(o.fecha)}</td>
</tr>`; }).join('');

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

  /* Igual que las operaciones: recibe el trozo que cabe en la hoja. El relleno
     hasta H.matMin renglones en blanco solo se aplica en el último fragmento,
     porque es lo que se anota a mano cuando el material se toma en campo. */
  /* 'extras' son renglones en blanco que se agregan al final para anotar a
     mano. Antes era un booleano y la tabla completaba hasta H.matMin contando
     solo el trozo de la hoja, de modo que un reparto en dos hojas rellenaba
     dos veces. Ahora el paginador decide cuántos caben y los pasa. */
  function tablaMateriales(lista, base, extras) {
    const mats = lista || [];
    if (!mats.length) return '';
    const h = `height:${H.matFila}cm`;
    const c = `${TD};${BD};text-align:center;${h}`;
    const n = mats.length + Math.max(0, extras || 0);
    let filas = '';
    for (let i = 0; i < n; i++) {
      const m = mats[i] || {};
      filas += `<tr>
  <td style="${TD};${BD};${h}">${escT(m.codigo)}</td>
  <td style="${TD};${BD};${h}">${escT(m.descripcion)}</td>
  <td style="${c}">${escT(m.n_reserva)}</td>
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
  <tr><td colspan="8" style="${BANDA};height:${H.opBanda}cm">REPUESTOS Y MATERIALES</td></tr>
  <tr>
    <td style="${nw}">CÓDIGO</td><td style="${nw}">DESCRIPCIÓN</td>
    <td style="${t}">N.<br>RESERVA</td>
    <td style="${t}">CANT.<br>RESERVADA</td><td style="${nw}">UND</td>
    <td style="${t}">CANT.<br>TOMADA</td><td style="${t}">CANT.<br>DISPONER</td>
    <td style="${nw}">ALMACÉN</td>
  </tr>
${filas}
</table>`;
  }

  /** Alto que ocupa el bloque de materiales, en cm, fila por fila. */
  function altoMateriales(ot) {
    const mats = ot.materiales || [];
    if (!mats.length) return 0;
    const alto = mats.reduce((t, m) => t + altoFilaMat(m), 0);
    const faltan = Math.max(0, H.matMin - mats.length);
    return MAT_HEAD + alto + faltan * FILA_MAT;
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

  /* La caja va en tres piezas para poder cortarla entre hojas. Cada pieza es
     una tabla completa; como los renglones solo llevan borde lateral e
     inferior, al apilarse se ven como una sola caja continua y ninguna línea
     queda duplicada. La primera pieza de cada hoja de continuación sí lleva
     borde superior, para que la caja cierre arriba. */

  const dsQ  = t => `<tr><td style="${LAT};padding:2px 4px 0;${MONO};height:0.66cm">${t}</td></tr>`;
  const dsQB = t => `<tr><td style="${LAT_B};padding:1px 4px 0;${MONO};height:0.44cm">${t}</td></tr>`;
  const dsCB = m => `<tr><td style="${LAT};padding:0">${boxes(m)}</td></tr>`;

  function descCabeza(ot) {
    return `${tabla(W.total)}
  <tr><td style="${BANDA};height:${H.dsBanda}cm">DESCRIPCION DEL TRABAJO:(DEFINA EN FRASES CONCRETAS LA ACTIVIDAD&nbsp; REALIZADA)</td></tr>
${dsQ('¿Cómo encontró el equipo?')}
${dsCB(ot.como_encontro)}
${dsQB('¿Qué actividad adicional realizó sobre el equipo?')}
</table>`;
  }

  /** Renglones de la caja de descripción. 'cerrar' pone borde superior en el
      primero, para las hojas de continuación. */
  function descRenglones(lineas, desde, cuantos, cerrar) {
    if (cuantos <= 0) return '';
    const est = `${LAT_B};height:${H.dsRengl}cm;${MONO};` +
                'vertical-align:bottom;padding:0 4px 1px';
    let ren = '';
    for (let k = 0; k < cuantos; k++) {
      const txt = lineas[desde + k];
      const e = (cerrar && k === 0) ? est.replace(LAT_B, LAT_TB) : est;
      ren += `<tr><td style="${e}">${txt ? escT(txt) : '&nbsp;'}</td></tr>`;
    }
    return `${tabla(W.total)}
${ren}
</table>`;
  }

  function descCola(ot) {
    return `${tabla(W.total)}
${dsQ('¿Cómo quedó el equipo?')}
${dsCB(ot.como_quedo)}
${dsQB('Recomendaciones adicionales y/o trabajos pendientes?')}
</table>`;
  }

  /* ------- caja renglones + tiempos de parada (página 2) ------------------ */

  /* Renglones de "Recomendaciones adicionales". Van sueltos para poder
     repartirlos entre hojas: el bloque de tiempos siempre viaja pegado al
     último grupo, nunca se separa de la retícula que lo sigue. */
  function p2Renglones(lineas, desde, cuantos, cerrar) {
    if (cuantos <= 0) return '';
    const est = `${LAT_B};height:${H.p2Rengl}cm;${MONO};` +
                'vertical-align:bottom;padding:0 4px 1px';
    let ren = '';
    for (let k = 0; k < cuantos; k++) {
      const txt = lineas[desde + k];
      const e0 = (cerrar && k === 0) ? est.replace(bord(0, 1, 1, 1), LAT_TB) : est;
      ren += `<tr><td style="${e0}">${txt ? escT(txt) : '&nbsp;'}</td></tr>`;
    }
    return `${SPACER(0.11)}
${tabla(W.total)}
${ren}
</table>`;
  }

  function cajaTiempos(ot) {
    const e = `${NB};white-space:nowrap`;
    const bc = 'border:none;padding:0 0 0 2px;vertical-align:bottom';
    const u = (v, w) => `<td style="${bc}">${campo(w, escT(v))}</td>`;

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

    return `${tabla(W.total)}
  <tr><td style="${LAT};padding:0.42cm 4px 0.08cm;${MONO}">Tiempos de Parada e Intervención</td></tr>
  <tr><td style="${LAT};padding:0 3px">${interior}</td></tr>
  <tr><td style="${LAT_B};height:1.17cm">&nbsp;</td></tr>
</table>`;
  }

  /* ------------------------ estado de la orden ---------------------------- */

  function estadoOrden(ot) {
    const e = String(ot.estado_orden || '').toUpperCase().trim();
    const t = `${NB};text-align:center;font-weight:bold;font-size:10.5pt`;
    const bc = 'border:none;padding:0;text-align:center';
    /* El porcentaje de avance no existe en la versión 00 del formato: es un
       agregado deliberado, y solo se imprime si la orden va en proceso y hay
       un valor. Sin él la retícula queda idéntica al impreso de SAP. */
    const enProceso = e === 'EN PROCESO';
    const avance = (enProceso && ot.avance_pct != null && ot.avance_pct !== '')
      ? `<div style="${ARIAL};font-size:8pt;font-weight:bold;text-align:center;` +
        `padding-top:2px">Avance: ${esc(ot.avance_pct)}%</div>`
      : '';
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
    <td style="${bc}"><div style="width:0.72cm;margin:0 auto">${cuadro(enProceso ? 'X' : '&nbsp;', 0.72, 0.56)}</div>${avance}</td>
    <td style="border:none"></td>
    <td style="${bc}"><div style="width:0.72cm;margin:0 auto">${cuadro(e === 'FINALIZADA' ? 'X' : '&nbsp;', 0.72, 0.56)}</div></td>
    <td style="border:none"></td>
  </tr>
</table>`;
  }

  /* -------------------------- recepción de servicio ----------------------- */

  function recepcion(ot) {
    const r  = ot.recepcion || {};

    /* Nombre y área de quien recibe. Van sobre su raya, igual que el líder en
       el bloque de firmas.
       La firma manuscrita capturada en pantalla, si existe, ocupa la columna
       del medio. Se recorta contra un alto fijo para que no descuadre la hoja
       por más grande que venga la imagen.
       Lo que ocupa el renglón se descuenta del espacio que lo antecede para
       no correr la paginación. */
    const recTexto = v => v
      ? `<div style="${ARIAL};font-size:10pt;padding:0 0 1px 4px;` +
        `white-space:nowrap;overflow:hidden">${esc(v)}</div>`
      : '';

    const FIRMA_ALTO = 1.05;                       // cm
    const recFirma = r.firma
      ? `<div style="height:${FIRMA_ALTO}cm;text-align:center;overflow:hidden">` +
        `<img src="${r.firma}" alt="" ` +
        `style="max-height:${FIRMA_ALTO}cm;max-width:${W.nfa[3] - 0.2}cm;` +
        `width:auto;height:auto;display:inline-block"></div>`
      : '';

    /* El alto del renglón lo fija el elemento más alto que lleve. */
    const recBloque = r.firma ? FIRMA_ALTO
                     : ((r.nombre_recibe || r.area_recibe) ? 0.42 : 0);
    const recAlto = Math.max(0.10, 1.14 - recBloque);
    const mr = `border:none;text-align:right;vertical-align:middle;${MONO};font-size:10pt;padding-right:0.18cm`;
    const vb = 'border:none;padding:0 0 2px;vertical-align:bottom';
    const preg = (txt, v) => `<tr>
  <td style="${NB};height:0.65cm;vertical-align:middle;font-size:10pt">${txt}</td>
  <td style="${mr}">SI</td><td style="${vb}">${cuadro(v === true ? 'X' : '&nbsp;', 0.51)}</td>
  <td style="${mr}">NO</td><td style="${vb}">${cuadro(v === false ? 'X' : '&nbsp;', 0.51)}</td>
  <td style="border:none"></td>
</tr>`;
    const lineaObs = txt => `<tr><td style="border:none"></td>
      <td style="border:none;padding:0">${campo(15.89, txt || '&nbsp;', 0.44, 'left')}</td></tr>`;
    /* Cuatro renglones como mínimo, y los que haga falta si el texto es
       más largo. Topes en caracteres: 80 la primera línea, 98 las demás. */
    const lin = renglonearVar(r.observaciones, [80, 98]);
    const obs = lin.length >= 4 ? lin : lin.concat(Array(4 - lin.length).fill(''));

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
      <td style="border:none;padding:0">${campo(12.85, obs[0] ? escT(obs[0]) : '&nbsp;', 0.52, 'left')}</td></tr>
</table>
${tbN(W.rint, [0.51, 15.89])}
${obs.slice(1).map(l => lineaObs(escT(l))).join('')}
</table>
${SPACER(recAlto)}
${tbN(W.rint, W.nfa)}
  <tr><td style="border:none"></td>
      <td style="border:none;padding:0;vertical-align:bottom">${recTexto(r.nombre_recibe)}</td>
      <td style="border:none"></td>
      <td style="border:none;padding:0;vertical-align:bottom">${recFirma}</td>
      <td style="border:none"></td>
      <td style="border:none;padding:0;vertical-align:bottom">${recTexto(r.area_recibe)}</td>
      <td style="border:none"></td></tr>
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

  function firmas(ot) {
    const lb = `border:none;font-weight:bold;padding:2px 0 0 6px;${ARIAL};font-size:8.5pt`;
    const n = 'border:none';
    const p = 'border:none;padding:0';
    const F = W.firma;

    /* Ejecutores. La casilla "dejar en blanco" manda: si está marcada el
       espacio sale limpio para escribir a mano, que es como se firma en campo
       cuando el personal cambia respecto a lo programado.

       Cuando no está marcada, el primero de la lista es el líder y va sobre la
       raya, en el lugar donde firma. Los demás quedan bajo el rótulo, uno por
       renglón. Se acepta separar con "/" o con coma. */
    const nombres = (ot && ot.ejecutores_en_blanco)
      ? []
      : String((ot && ot.ejecutores) || '')
          .split(/[\/,;]+/).map(s => s.trim()).filter(Boolean);

    const lider = nombres[0] || '';
    const apoyo = nombres.slice(1);

    /* El formato es un clon a medida del impreso SAP: cada línea que se agrega
       corre el resto de la hoja. Por eso lo que ocupa el nombre del líder se
       descuenta del espacio que lo antecede, y lo que ocupan los nombres de
       apoyo, del espacio que sigue. Así la paginación no se mueve. */
    /* Cada columna del bloque puede llevar firma, nombre, los dos o nada. La
       firma va arriba y el nombre debajo, ambos sobre la raya: es el orden del
       papel firmado a mano. La imagen se recorta contra un alto fijo para que
       una foto grande no corra la hoja, igual que en recepción. */
    const FIRMA_ALTO = 1.05;                       // cm
    const ALTO_LINEA = 0.42;                       // cm por renglón a 10pt

    const imgFirma = (src, ancho) => src
      ? `<div style="height:${FIRMA_ALTO}cm;overflow:hidden;padding-left:6px">` +
        `<img src="${esc(src)}" alt="" ` +
        `style="max-height:${FIRMA_ALTO}cm;max-width:${ancho - 0.2}cm;` +
        `width:auto;height:auto;display:inline-block"></div>`
      : '';
    const txtNombre = v => v
      ? `<div style="${ARIAL};font-size:10pt;padding:0 0 1px 6px;` +
        `white-space:nowrap;overflow:hidden">${esc(v)}</div>`
      : '';

    const supNombre = (ot && ot.supervisor_nombre) || '';
    const supFirma  = (ot && ot.supervisor_firma)  || '';

    const celdaFirma = imgFirma((ot && ot.firma_ejecutor) || '', F[1]);
    const celdaLider = txtNombre(lider);
    const celdaSupF  = imgFirma(supFirma, F[3]);
    const celdaSupN  = txtNombre(supNombre);

    /* El alto de la fila lo fija la columna más alta, así que el espaciador
       que la antecede se descuenta de esa y no de la del ejecutor. Si no, con
       el supervisor firmado y el ejecutor en blanco la retícula se corría. */
    const altoCol = (f, n) => (f ? FIRMA_ALTO : 0) + (n ? ALTO_LINEA : 0);
    const arriba = Math.max(0, 2.40 - Math.max(altoCol(celdaFirma, lider),
                                               altoCol(celdaSupF, supNombre)));
    const abajo  = Math.max(0.60, 2.35 - apoyo.length * ALTO_LINEA);

    const celdaApoyo = apoyo.length
      ? apoyo.map(x => `<div style="${ARIAL};font-size:10pt;font-weight:normal;` +
                       `padding:1px 0 0 6px">${esc(x)}</div>`).join('')
      : '';

    return `
${SPACER(arriba)}
${tbN(W.total, F)}
  <tr>
    <td style="${n}"></td>
    <td style="${p};vertical-align:bottom">${celdaFirma}${celdaLider}</td>
    <td style="${n}"></td>
    <td style="${p};vertical-align:bottom">${celdaSupF}${celdaSupN}</td>
    <td style="${n}"></td><td style="${p}"></td>
    <td style="${n}"></td><td style="${p}"></td>
    <td style="${n}"></td>
  </tr>
  <tr>
    <td style="${n}"></td><td style="${p}">${raya(F[1])}</td>
    <td style="${n}"></td><td style="${p}">${raya(F[3])}</td>
    <td style="${n}"></td><td style="${p}">${raya(F[5])}</td>
    <td style="${n}"></td><td style="${p}">${raya(F[7])}</td>
    <td style="${n}"></td>
  </tr>
  <tr>
    <td style="${n}"></td><td style="${lb}">EJECUTOR DE MTTO${celdaApoyo}</td>
    <td style="${n}"></td><td style="${lb}">SUPERVISOR O&amp;M</td>
    <td style="${n}"></td><td style="${lb}">SENIOR / PLANEADOR DE<br>MTTO GTEC</td>
    <td style="${n}"></td><td style="${lb}">DOCUMENTADOR O&amp;M</td><td style="${n}"></td>
  </tr>
</table>
${SPACER(abajo)}
${tbN(W.total, W.clerk)}
  <tr><td style="${n}"></td><td style="${p}">${raya(W.clerk[1])}</td><td style="${n}"></td></tr>
  <tr><td style="${n}"></td>
      <td style="${NB};text-align:center;font-weight:bold;padding-top:2px">CLERK GTEC</td>
      <td style="${n}"></td></tr>
</table>`;
  }

  /* ------------------------------- render --------------------------------- */

  /** Renglones en blanco que el impreso de referencia deja en la caja de
      descripción: 8 con 9 operaciones y sin materiales. Cada operación que
      falta libera FILA_OP cm y la tabla de materiales los quita. */
  function rengDeseado(ot) {
    const nOps = (ot.operaciones || []).length;
    const cm = RENG_REF * RENGLON
             + (OPS_REF - nOps) * FILA_OP
             - altoMateriales(ot);
    return Math.min(MAX_RENG, Math.max(MIN_RENG, Math.round(cm / RENGLON)));
  }

  /* --------------------------- paginador ----------------------------------
     Una sola pasada sobre todo el documento, llevando la cuenta en cm de lo
     que queda libre en la hoja. Cuando un bloque no cabe, cierra la hoja y
     abre otra: la cabecera se vuelve a imprimir arriba y el relleno que hace
     de margen se aplica de nuevo, porque cada hoja es su propio .fo016-pag.

     El corte de la hoja 1 es el único que no depende del espacio: el impreso
     de SAP cierra siempre después de "Recomendaciones adicionales", con
     blanco al pie, y esa retícula se respeta. De ahí en adelante el reparto
     es por espacio, así que una hoja de continuación que arranque con dos
     renglones sigue de largo con las recomendaciones y con la retícula de
     tiempos, estado y recepción si alcanzan a caber. Antes esas dos partes
     las armaban paginadores distintos y la segunda abría hoja nueva sí o sí:
     de ahí la hoja con tres líneas arriba y el resto en blanco.            */

  function hojasDocumento(ot, extra) {
    const R          = reserva(extra);
    const P1_FLUJO   = ALTO_UTIL - ALTO_CAB - altoDatos(ot) - R;
    const CONT_FLUJO = ALTO_UTIL - ALTO_CAB - R;

    const ops    = ot.operaciones || [];
    const mats   = ot.materiales  || [];
    const lineas = ot.actividad_realizada
      ? renglonear(ot.actividad_realizada, CHARS_RENGLON) : [];
    const recom  = ot.recomendaciones
      ? renglonear(ot.recomendaciones, CHARS_RENGLON) : [];
    const nRengl = Math.max(rengDeseado(ot), lineas.length);

    /* La retícula de cierre viaja entera. Las observaciones de recepción son
       lo único que la hace crecer. */
    const obs = renglonearVar((ot.recepcion || {}).observaciones, [80, 98]);
    const altoCierre = ALTO_CIERRE + Math.max(0, obs.length - 4) * 0.44;
    /* Si las observaciones son tan largas que la retícula ya no cabe en una
       hoja entera, romper la página no arregla nada: solo agrega hojas casi
       vacías. En ese caso no se reserva espacio ni se corta, y el aviso de
       imprimir() delata el desborde con la medida real. */
    const cabeSuelta = ESPACIADOR_P2 + P2_RENG_BASE * RENGLON2
                     + altoCierre <= CONT_FLUJO;

    const hojas = [];
    let buf   = bloqueDatos(ot);         // el bloque de datos solo va en la 1.ª
    let libre = P1_FLUJO;
    let hoja1 = true;

    const cerrar = () => {
      hojas.push(buf);
      buf = '';
      libre = CONT_FLUJO;
      hoja1 = false;
    };

    /* --- operaciones ---
       Se miden una por una: una descripción que se parte en dos líneas ocupa
       el doble y contarla como una sola fue lo que desbordó la hoja. */
    let i = 0;
    while (i < ops.length) {
      let usado = OPS_HEAD, caben = 0;
      while (i + caben < ops.length &&
             usado + altoFilaOp(ops[i + caben]) <= libre) {
        usado += altoFilaOp(ops[i + caben]); caben++;
      }
      if (!caben) {
        if (buf) { cerrar(); continue; }   // hoja llena: se abre otra
        caben = 1;                         // hoja vacía: se fuerza para no ciclar
        usado = OPS_HEAD + altoFilaOp(ops[i]);
      }
      buf += tablaOperaciones(ops.slice(i, i + caben), i);
      libre -= usado;
      i += caben;
      if (i < ops.length) cerrar();
    }

    /* --- materiales --- */
    let j = 0;
    while (j < mats.length) {
      let usado = MAT_HEAD, caben = 0;
      while (j + caben < mats.length &&
             usado + altoFilaMat(mats[j + caben]) <= libre) {
        usado += altoFilaMat(mats[j + caben]); caben++;
      }
      if (!caben) {
        if (buf) { cerrar(); continue; }
        caben = 1;
        usado = MAT_HEAD + altoFilaMat(mats[j]);
      }
      /* Los renglones en blanco para anotar a mano se cuentan sobre el total
         de la orden, no sobre el trozo de esta hoja, y solo si sobra sitio. */
      const ultimo  = j + caben >= mats.length;
      const faltan  = ultimo ? Math.max(0, H.matMin - mats.length) : 0;
      const extras  = (faltan && usado + faltan * FILA_MAT <= libre) ? faltan : 0;
      buf += tablaMateriales(mats.slice(j, j + caben), j, extras);
      libre -= usado + extras * FILA_MAT;
      j += caben;
      if (j < mats.length) cerrar();
    }

    /* --- cabeza de la caja de descripción: no se deja huérfana ---
       Se exige sitio para el rótulo y al menos dos renglones. */
    if (libre < DESC_HEAD + 2 * RENGLON) cerrar();
    buf += descCabeza(ot);
    libre -= DESC_HEAD;
    let abierta = false;                 // ¿la caja viene abierta de la hoja anterior?

    /* --- renglones de la descripción --- */
    let r = 0;
    while (r < nRengl) {
      let caben = Math.floor(libre / RENGLON);
      /* La cola tiene que quedar con los últimos renglones, nunca sola. */
      const ultimos = nRengl - r;
      if (caben >= ultimos && libre - ultimos * RENGLON < DESC_COLA) {
        caben = Math.floor((libre - DESC_COLA) / RENGLON);
      }
      if (caben < 1) {
        if (buf) { cerrar(); abierta = true; continue; }
        caben = 1;
      }
      if (caben > ultimos) caben = ultimos;
      buf += descRenglones(lineas, r, caben, abierta);
      libre -= caben * RENGLON;
      r += caben;
      abierta = false;
      if (r < nRengl) { cerrar(); abierta = true; }
    }

    /* --- cola de la caja de descripción --- */
    if (libre < DESC_COLA) { cerrar(); abierta = true; }
    if (abierta) {
      /* Abre la hoja con un renglón de cierre para que la caja no arranque
         sin borde superior. */
      buf += descRenglones([], 0, 1, true);
      libre -= RENGLON;
    }
    buf += descCola(ot);
    libre -= DESC_COLA;

    /* Fin de la hoja 1 del formato. Si el contenido nunca se desbordó, aquí
       se corta por diseño; si ya venimos en continuación, se sigue llenando. */
    if (hoja1) cerrar();

    /* --- renglones de recomendaciones ---
       Los siete renglones del impreso de referencia son sitio para escribir a
       mano, no contenido. Cuando la hoja viene ocupada y esos siete empujan la
       retícula de cierre a una hoja nueva, se recortan hasta P2_RENG_MIN con
       tal de que todo quepa: es preferible un renglón menos que una hoja de
       más. Nunca se recorta texto escrito; el recorte solo toca el relleno. */
    let nRec = Math.max(P2_RENG_BASE, recom.length);
    if (recom.length <= P2_RENG_BASE) {
      const capaz = Math.floor((libre - ESPACIADOR_P2 - altoCierre) / RENGLON2);
      if (capaz < nRec && capaz >= Math.max(P2_RENG_MIN, recom.length)) nRec = capaz;
    }
    let q = 0;
    let abierta2 = true;   // la caja arranca de cero: lleva borde superior
    while (q < nRec) {
      let caben = Math.floor((libre - ESPACIADOR_P2) / RENGLON2);
      const ultimos = nRec - q;
      /* La retícula de cierre no se separa de los últimos renglones. */
      /* La retícula de cierre no se separa de los últimos renglones, pero
         solo tiene sentido reservarle sitio si en una hoja limpia sí caben
         juntos. Si no, se deja correr. */
      const juntos = ESPACIADOR_P2 + ultimos * RENGLON2 + altoCierre;
      if (caben >= ultimos && juntos > libre && juntos <= CONT_FLUJO && buf) {
        /* Caben los renglones pero no la retícula detrás. Antes se recortaba
           el grupo para hacerle sitio, y como el recorte dejaba renglones
           sueltos la retícula se iba igual a la hoja siguiente: la hoja se
           cerraba con quince centímetros en blanco y el sobrante era un solo
           renglón. Bajan juntos. */
        cerrar(); abierta2 = true; continue;
      }
      if (caben < 1) {
        if (buf) { cerrar(); abierta2 = true; continue; }
        caben = 1;                       // hoja vacía: se fuerza para no ciclar
      }
      if (caben > ultimos) caben = ultimos;
      buf += p2Renglones(recom, q, caben, abierta2);
      libre -= ESPACIADOR_P2 + caben * RENGLON2;
      q += caben;
      abierta2 = false;
      if (q < nRec) { cerrar(); abierta2 = true; }
    }

    /* --- retícula de cierre ---
       Si ni en una hoja limpia cabe (observaciones de recepción larguísimas),
       igual se abre hoja nueva cuando la actual ya viene ocupada: el desborde
       arranca desde arriba y se pierde lo menos posible. En una hoja limpia la
       condición es falsa, así que no puede ciclar. Los renglones de relleno
       solo se ponen cuando la retícula sí cabía: en el caso desbordado lo
       único que harían es empeorarlo. */
    if (libre < altoCierre && (cabeSuelta || libre < CONT_FLUJO - 0.01)) {
      cerrar();
      if (cabeSuelta) {
        /* Nunca queda sin renglones encima: es donde se sigue escribiendo. */
        buf += p2Renglones([], 0, P2_RENG_BASE, true);
        libre -= ESPACIADOR_P2 + P2_RENG_BASE * RENGLON2;
      }
    }
    buf += cajaTiempos(ot) + estadoOrden(ot) + recepcion(ot);
    libre -= altoCierre;
    cerrar();

    /* --- firmas: hoja propia, como en el original --- */
    hojas.push(firmas(ot));

    return hojas;
  }

  /* ------------------------------ render ---------------------------------- */

  function render(ot, extra) {
    const cuerpos = hojasDocumento(ot, extra);

    const total = cuerpos.length;
    const hojas = cuerpos.map((cuerpo, k) => {
      const ultima = k === total - 1;
      return `<div class="fo016-pag${ultima ? ' fo016-fin' : ''}">
${cabecera(ot, k + 1, total)}
${cuerpo}
</div>`;
    }).join('');

    return `<style>${CSS}</style><div class="fo016">${hojas}</div>`;
  }

  /* ------------------------------ impresión ------------------------------- */

  /* Se imprime desde un iframe oculto del mismo documento y no desde una
     ventana nueva. En Chrome de Android window.open('', '_blank') queda
     bloqueada o a medio construir, y el print() termina disparándose sobre la
     página visible: el resultado era el formulario de Programación impreso en
     veinticuatro hojas. El iframe no depende del bloqueador de ventanas
     emergentes y el navegador imprime únicamente su contenido, así que la
     interfaz de la aplicación queda fuera sin necesidad de reglas @media.

     El iframe queda de 1px y transparente en vez de display:none, porque
     varios navegadores se niegan a imprimir un marco oculto por completo. */
  function imprimir(ot) {
    const documento = extra => `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>&nbsp;</title><style>${PAGE_CSS} html,body{margin:0;padding:0}</style>
</head><body>${render(ot, extra)}</body></html>`;

    let extra = 0;
    let html  = documento(extra);

    const anterior = document.getElementById('fo016-marco-impresion');
    if (anterior) anterior.remove();

    const marco = document.createElement('iframe');
    marco.id = 'fo016-marco-impresion';
    marco.setAttribute('aria-hidden', 'true');
    marco.setAttribute('tabindex', '-1');
    /* El marco mide una hoja entera, no 1px. Con un ancho de un píxel el
       contenido se maqueta igual —las tablas llevan su ancho en centímetros—
       pero cualquier medición que se le pida al navegador sale sin sentido, y
       aquí se mide de verdad. Sigue invisible y fuera del flujo. */
    marco.style.cssText =
      'position:fixed;right:0;bottom:0;width:21cm;height:29.7cm;' +
      'opacity:0;border:0;pointer-events:none;z-index:-1;overflow:hidden';
    document.body.appendChild(marco);

    let lanzado = false;
    let limpieza = null;

    /* El logo viaja como data-URL, pero el navegador igual lo decodifica de
       forma asíncrona. Imprimir antes de que termine deja el encabezado en
       blanco, así que se espera a las imágenes con un tope de tiempo. */
    function esperarImagenes(doc) {
      const imgs = Array.from(doc.images || []);
      const faltan = imgs.filter(i => !i.complete);
      if (!faltan.length) return Promise.resolve();
      return Promise.race([
        Promise.all(faltan.map(i => new Promise(ok => {
          i.addEventListener('load', ok, { once: true });
          i.addEventListener('error', ok, { once: true });
        }))),
        new Promise(ok => setTimeout(ok, 3000)),
      ]);
    }

    function retirar() {
      if (limpieza) { clearTimeout(limpieza); limpieza = null; }
      const m = document.getElementById('fo016-marco-impresion');
      if (m) m.remove();
    }

    /* El reparto se calcula con alturas estimadas en centímetros: cuánto mide
       una fila cuyo texto se parte, cuánto ocupa la retícula de cierre. Una
       estimación corta antes significaba una hoja desbordada, y con ella la
       hoja implícita que el navegador abre sin cabecera y sin margen.

       Aquí el documento ya está maquetado y se puede medir de verdad. Devuelve
       el desborde de la hoja peor, en centímetros. */
    function desborde(doc) {
      try {
        const hojas = doc.querySelectorAll('.fo016-pag');
        if (!hojas.length) return 0;
        const cm = hojas[0].getBoundingClientRect().width / 21.00;
        if (!cm) return 0;
        let peor = 0;
        hojas.forEach(h => {
          /* Se mide hasta dónde llega el último hijo, no con scrollHeight:
             unos navegadores cuentan el relleno inferior en scrollHeight y
             otros no, y ahí se juegan los 0.88 cm del margen. El rectángulo
             de los hijos es el mismo en todos, y con overflow:hidden sigue
             siendo correcto aunque el dibujo esté recortado. */
          const arriba = h.getBoundingClientRect().top;
          let fondo = arriba;
          for (const n of h.children) {
            const b = n.getBoundingClientRect().bottom;
            if (b > fondo) fondo = b;
          }
          const sobra = (fondo - arriba) / cm - (29.70 - 0.88);
          if (sobra > peor) peor = sobra;
        });
        return peor;
      } catch (_) { return 0; }
    }

    function escribir(texto) {
      const d = marco.contentWindow.document;
      d.open(); d.write(texto); d.close();
    }

    /* Hasta cuatro reajustes. Cada uno le suma al presupuesto el sobrante que
       se acaba de medir más dos milímetros, así que converge en uno o dos.
       El tope evita que un contenido imposible de acomodar —unas observaciones
       de recepción más largas que la hoja— deje el diálogo sin abrirse. */
    function ajustar(intento) {
      const v = marco.contentWindow;
      return esperarImagenes(v.document).then(() => {
        const sobra = desborde(v.document);
        if (sobra <= 0.02 || intento >= 4 || extra > 6) {
          if (sobra > 0.02) {
            console.warn('[FO016] Queda una hoja desbordada ' +
              Math.round(sobra * 10) / 10 + ' cm tras ' + intento + ' reajustes.');
            /* El recorte de la hoja es una red contra la hoja fantasma, no una
               licencia para perder texto. Si tras los reajustes sigue sobrando
               —unas observaciones de recepción más largas que el papel—, se
               levanta el recorte: sale una hoja fea antes que un documento
               firmado al que le falta un renglón. */
            if (sobra > 0.30) {
              const e = v.document.createElement('style');
              e.textContent = '.fo016-pag{height:auto;overflow:visible}';
              v.document.head.appendChild(e);
            }
          }
          return;
        }
        extra += sobra + 0.20;
        html = documento(extra);
        escribir(html);
        return new Promise(ok => setTimeout(ok, 60)).then(() => ajustar(intento + 1));
      });
    }

    function lanzar() {
      if (lanzado) return;
      lanzado = true;
      const v = marco.contentWindow;
      ajustar(0).then(() => {
        /* Retirar el iframe mientras el diálogo sigue abierto cancela la
           impresión en Android. Se espera al evento y, si el navegador no lo
           emite, a un tiempo largo. */
        try { v.addEventListener('afterprint', () => setTimeout(retirar, 500), { once: true }); }
        catch (_) {}
        limpieza = setTimeout(retirar, 120000);
        try {
          v.focus();
          v.print();
        } catch (e) {
          /* Último recurso: ventana nueva. Si el navegador también la bloquea
             queda la exportación a Word, que no depende de la impresión. */
          retirar();
          const w = window.open('', '_blank');
          if (!w) {
            alert('El navegador bloqueó la impresión. Use "Descargar en Word" '
                + 'o habilite las ventanas emergentes para este sitio.');
            return;
          }
          w.document.write(html);
          w.document.close();
          w.focus();
          setTimeout(() => w.print(), 400);
        }
      });
    }

    marco.addEventListener('load', lanzar, { once: true });

    escribir(html);

    /* document.write no siempre dispara load en móviles: respaldo por tiempo. */
    setTimeout(lanzar, 600);
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
    avance_pct: null,        // solo se imprime si estado_orden es EN PROCESO
    recepcion: { conformidad:null, area:null, equipo:null, observaciones:'' }
  };

  return { render, imprimir, exportarWord, CSS, PAGE_CSS, PRINT_CSS, EJEMPLO,
           fechaSAP, oper, hojasDocumento, rengDeseado };
})();

if (typeof window !== 'undefined') window.FO016 = FO016;
