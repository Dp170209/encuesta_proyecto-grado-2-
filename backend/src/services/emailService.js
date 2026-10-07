const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

/**
 * Inicializa el transportador SMTP de correo electrónico
 */
function getTransporter() {
  if (transporter) return transporter;

  const smtpService = process.env.SMTP_SERVICE;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    if (smtpService === 'gmail' || smtpHost === 'smtp.gmail.com') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log(`[SMTP USEI] Configurado servicio Gmail con la cuenta: ${smtpUser}`);
    } else if (smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log(`[SMTP USEI] Configurado servidor SMTP (${smtpHost}:${smtpPort}) con: ${smtpUser}`);
    }
  }

  if (!transporter) {
    // Si no hay credenciales configuradas en el .env, se activa modo simulado
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.warn('[SMTP USEI] AVISO: No se encontraron credenciales SMTP en el .env. Modo simulado activo (los correos no se enviarán a buzones reales hasta configurar SMTP_USER y SMTP_PASS).');
  }

  return transporter;
}

/**
 * Despacha asíncronamente el correo oficial con el Certificado PDF adjunto
 * @param {Object} params - { destinatario, nombreCompleto, nroCertificado, pdfBuffer, urlWhatsapp, carrera }
 * @returns {Promise<Object>}
 */
async function enviarCertificadoGraduado({ destinatario, nombreCompleto, nroCertificado, pdfBuffer, urlWhatsapp, carrera }) {
  try {
    const transport = getTransporter();
    const remitente = process.env.SMTP_FROM || 'usei@ucb.edu.bo';
    const enlaceWs = urlWhatsapp || 'https://chat.whatsapp.com/H8ZOO6eqwo518VFLFM8eVJ';
    const nombreCarrera = carrera || 'tu carrera';

    const cuerpoTexto = `Buen día ${nombreCompleto || ''}.

Te damos la bienvenida a los ALUMNI UCB de la Universidad Católica Boliviana "San Pablo".

Ponemos a tu disposición las actividades realizadas por la USEI, para eso te sugerimos que te suscribas a las redes sociales de la unidad (USEI La Paz).

🎁 Beneficio Alumni UCB: Puedes optar al descuento del 10% en todos los cursos y programas de Postgrado de la universidad.

💬 Comunidad de WhatsApp:
Te invitamos a unirte al grupo oficial de Alumni UCB de ${nombreCarrera}:
${enlaceWs}

Adjunto a este mensaje encontrarás tu Certificado Oficial de Cumplimiento (N° USEI-2026-${String(nroCertificado).padStart(5, '0')}) en formato PDF, indispensable para la tramitación de tu titulación y firma de acta.

Saludos cordiales,
Unidad de Servicios Estudiantiles Integrales (USEI)
Universidad Católica Boliviana "San Pablo" - Sede La Paz`;

    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0e3d7a; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">Universidad Católica Boliviana "San Pablo"</h2>
          <p style="margin: 5px 0 0; font-size: 13px; color: #dbeafe;">Unidad de Servicios Estudiantiles Integrales (USEI)</p>
        </div>
        <div style="padding: 24px;">
          <p><strong>Buen día, ${nombreCompleto || 'Graduado(a)'}:</strong></p>
          <p>Te damos la bienvenida a los <strong>ALUMNI UCB</strong> de la Universidad Católica Boliviana "San Pablo".</p>
          <p>Ponemos a tu disposición las actividades realizadas por la USEI, para eso te sugerimos que te suscribas a las redes sociales de la unidad (USEI La Paz).</p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              🎁 <strong>Beneficio Alumni UCB:</strong> Recuerda que puedes optar al <strong>descuento del 10%</strong> en todos los cursos y programas de Postgrado de la universidad.
            </p>
          </div>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 18px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #166534; font-weight: bold;">
              💬 Únete al grupo oficial de Alumni UCB (${nombreCarrera}):
            </p>
            <a href="${enlaceWs}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; font-weight: bold; padding: 11px 22px; border-radius: 6px; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              👉 Unirme a la Comunidad de WhatsApp
            </a>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
              O ingresa mediante este enlace: <br><a href="${enlaceWs}" style="color: #059669;">${enlaceWs}</a>
            </p>
          </div>

          <p>Adjunto a este correo encontrarás tu <strong>Certificado Oficial de Cumplimiento (PDF)</strong> para adjuntarlo a tu trámite de titulación.</p>
          <p style="margin-top: 24px; color: #64748b; font-size: 13px;">
            Saludos cordiales,<br>
            <strong>Unidad de Servicios Estudiantiles Integrales - USEI UCB</strong><br>
            Sede Académica La Paz
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: `"USEI - UCB Alumni" <${remitente}>`,
      to: destinatario,
      subject: `Certificado Oficial Encuesta de Graduación - USEI UCB (N° ${nroCertificado})`,
      text: cuerpoTexto,
      html: cuerpoHtml,
      attachments: [
        {
          filename: `Certificado_USEI_2026_${String(nroCertificado).padStart(5, '0')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`[SMTP USEI] Correo de certificado enviado con éxito a: ${destinatario} (N° ${nroCertificado})`);
    return { exito: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[SMTP USEI Error] No se pudo enviar el correo a ${destinatario}:`, err.message);
    // Retornamos falso sin lanzar error para no interrumpir la experiencia del graduado (asincronía)
    return { exito: false, error: err.message };
  }
}

module.exports = {
  enviarCertificadoGraduado,
};
