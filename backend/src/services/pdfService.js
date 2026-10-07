const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Formatea una fecha en formato exacto YYYY-MM-DD HH:mm:ss
 */
function formatearFechaHora(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const anio = d.getFullYear();
  const mes = pad(d.getMonth() + 1);
  const dia = pad(d.getDate());
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());
  return `${anio}-${mes}-${dia} ${hora}:${min}:${seg}`;
}

/**
 * Busca un archivo de imagen en assets probando distintas extensiones (.png, .jpg, .jpeg)
 */
function buscarAsset(assetsDir, baseName) {
  const extensiones = ['.png', '.jpg', '.jpeg'];
  for (const ext of extensiones) {
    const fullPath = path.join(assetsDir, `${baseName}${ext}`);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

/**
 * Genera el Certificado Oficial en orientación Horizontal (Landscape)
 * calcado al modelo oficial de la USEI-UCB.
 * @param {Object} datos - { nro_certificado, nombre_completo, carrera, fecha_emision }
 * @returns {Promise<Buffer>}
 */
function generarCertificadoPDF(datos) {
  return new Promise((resolve, reject) => {
    try {
      // Formato Carta Horizontal (Landscape: 792 x 612 puntos)
      const doc = new PDFDocument({
        size: 'LETTER',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const {
        nro_certificado,
        nombre_completo,
        carrera,
        fecha_emision,
      } = datos;

      const assetsDir = path.join(__dirname, '../../assets');
      const logoUcbPath = buscarAsset(assetsDir, 'logo_ucb');
      const logoUseiPath = buscarAsset(assetsDir, 'logo_usei');
      const logoAlumniPath = buscarAsset(assetsDir, 'logo_alumni');
      const firmaPath = buscarAsset(assetsDir, 'firma');

      const pageWidth = doc.page.width; // 792
      const pageHeight = doc.page.height; // 612

      // =====================================================================
      // 1. CABECERA: LOGOTIPOS INSTITUCIONALES (UCB, USEI, ALUMNI UCB)
      // =====================================================================
      const headerY = 32;

      // 1.1 Logo UCB (Extremo Izquierdo - tamaño prominente como el original)
      if (logoUcbPath) {
        doc.image(logoUcbPath, 38, headerY, { height: 74 });
      } else {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#64748b')
          .text('UNIVERSIDAD', 42, headerY + 12, { characterSpacing: 1.5 });
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#0e3d7a')
          .text('CATÓLICA', 42, headerY + 26, { characterSpacing: 1.2 });
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#64748b')
          .text('B O L I V I A N A', 42, headerY + 48, { characterSpacing: 2 });
      }

      // 1.2 Logo USEI (Centro-Derecha - ajustado horizontalmente para dar espacio a Alumni)
      if (logoUseiPath) {
        doc.image(logoUseiPath, 485, headerY + 4, { height: 64 });
      } else {
        doc
          .fontSize(32)
          .font('Helvetica-Bold')
          .fillColor('#0e3d7a')
          .text('use', 485, headerY + 4, { continued: true });
        doc
          .fillColor('#f59e0b')
          .text('i', { continued: false });
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748b')
          .text('Unidad de Servicios\nEstudiantiles Integrales', 485, headerY + 40);
      }

      // 1.3 Logo Alumni UCB (Extremo Derecho - tamaño significativamente ampliado para coincidir con el original)
      if (logoAlumniPath) {
        doc.image(logoAlumniPath, 585, headerY - 24, { width: 175 });
      } else {
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#0e3d7a')
          .text('Alumni', 590, headerY + 14, { continued: true });
        doc
          .fillColor('#f59e0b')
          .text('UCB');
      }

      // =====================================================================
      // 2. CORRELATIVO Y FECHA (PARTE SUPERIOR DERECHA)
      // =====================================================================
      const correlativoY = 142;
      const numCertificado = nro_certificado || 1;
      const fechaTexto = formatearFechaHora(fecha_emision);

      doc
        .fontSize(13.5)
        .font('Helvetica-Bold')
        .fillColor('#103663')
        .text(`CERTIFICADO Nº ${numCertificado}`, 440, correlativoY, {
          width: 308,
          align: 'right',
        });

      doc
        .fontSize(12.5)
        .font('Helvetica-Bold')
        .fillColor('#103663')
        .text(fechaTexto, 440, correlativoY + 18, {
          width: 308,
          align: 'right',
        });

      // =====================================================================
      // 3. TÍTULOS CENTRALES
      // =====================================================================
      const certTitleY = 222;

      doc
        .fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#103663')
        .text('CERTIFICACIÓN', 0, certTitleY, {
          width: pageWidth,
          align: 'center',
          characterSpacing: 0.3,
        });

      doc
        .fontSize(15.5)
        .font('Helvetica-Bold')
        .fillColor('#103663')
        .text('ENCUESTA PARA GRADUADOS', 0, certTitleY + 42, {
          width: pageWidth,
          align: 'center',
          characterSpacing: 0.3,
        });

      // =====================================================================
      // 4. CUERPO DEL CERTIFICADO (TEXTO Y NOMBRE EN MAYÚSCULAS)
      // =====================================================================
      const bodyY = 320;

      // Línea 1: "La Unidad de Servicios Estudiantiles Integrales certifica que el/la estudiante"
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text(
          'La Unidad de Servicios Estudiantiles Integrales certifica que el/la estudiante',
          0,
          bodyY,
          { width: pageWidth, align: 'center' }
        );

      // Línea 2: Nombre Completo del graduado (en negrita grande y centrado)
      const nombreEstudiante = (nombre_completo || 'NOMBRE DEL GRADUADO').toUpperCase();
      doc
        .fontSize(21)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(nombreEstudiante, 0, bodyY + 40, {
          width: pageWidth,
          align: 'center',
        });

      // Línea 3: Texto de carrera y cumplimiento
      const carreraNombre = carrera || 'su respectiva carrera';
      const parte1 = 'de la carrera de ';
      const parte2 = carreraNombre;
      const parte3 = ' completó la Encuesta de Seguimiento para graduados a tiempo de Titularse.';

      doc.font('Helvetica').fontSize(13);
      const anchoP1 = doc.widthOfString(parte1);
      doc.font('Helvetica-Bold').fontSize(13);
      const anchoP2 = doc.widthOfString(parte2);
      doc.font('Helvetica').fontSize(13);
      const anchoP3 = doc.widthOfString(parte3);

      const anchoTotal = anchoP1 + anchoP2 + anchoP3;
      const inicioX = Math.max(30, (pageWidth - anchoTotal) / 2);
      const linea3Y = bodyY + 80;

      doc
        .font('Helvetica')
        .fontSize(13)
        .fillColor('#1a1a1a')
        .text(parte1, inicioX, linea3Y, { continued: true });

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#1a1a1a')
        .text(parte2, { continued: true });

      doc
        .font('Helvetica')
        .fontSize(13)
        .fillColor('#1a1a1a')
        .text(parte3, { continued: false });

      // =====================================================================
      // 5. SECCIÓN DE FIRMA OFICIAL (CENTRO INFERIOR)
      // =====================================================================
      const firmaY = 472;

      if (firmaPath) {
        doc.image(firmaPath, pageWidth / 2 - 60, firmaY - 45, { width: 120 });
      } else {
        // Trazo vectorial simulando fielmente la firma en tinta azul del original
        const cx = pageWidth / 2 - 38;
        const cy = firmaY - 14;

        doc
          .save()
          .lineWidth(1.1)
          .strokeColor('#2b5d88') // Tinta azul bolígrafo como en el documento original
          // Bucle inicial alto 'P'
          .moveTo(cx - 15, cy + 12)
          .bezierCurveTo(cx - 12, cy - 32, cx - 4, cy - 42, cx + 6, cy - 30)
          .bezierCurveTo(cx + 14, cy - 18, cx - 2, cy + 4, cx + 2, cy + 18)
          // Lazos cursivos intermedios
          .moveTo(cx + 4, cy - 6)
          .bezierCurveTo(cx + 14, cy - 20, cx + 20, cy + 10, cx + 28, cy - 4)
          .bezierCurveTo(cx + 34, cy - 18, cx + 42, cy + 8, cx + 48, cy - 10)
          .bezierCurveTo(cx + 56, cy - 24, cx + 62, cy + 6, cx + 68, cy - 6)
          // Rúbrica inferior / trazo horizontal dinámico
          .moveTo(cx - 20, cy + 6)
          .bezierCurveTo(cx + 15, cy + 14, cx + 50, cy + 2, cx + 82, cy - 20)
          .stroke()
          .restore();
      }

      // Pie institucional idéntico al original
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text('Paola Zapana C.', 0, firmaY + 22, {
          width: pageWidth,
          align: 'center',
        });

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Encargada Unidad de Servicios Estudiantiles Integrales', 0, firmaY + 37, {
          width: pageWidth,
          align: 'center',
        });

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Universidad Católica Boliviana “San Pablo”', 0, firmaY + 52, {
          width: pageWidth,
          align: 'center',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generarCertificadoPDF,
};
