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

/**
 * Envía un correo recordatorio formal e institucional al estudiante habilitado
 * que aún no ha completado la encuesta obligatoria de graduación.
 */
async function enviarRecordatorioEncuesta({ destinatario, nombreCompleto, carnetIdentidad, linkEncuesta, carrera }) {
  try {
    const transport = getTransporter();
    const remitente = process.env.SMTP_USER || process.env.SMTP_FROM || 'usei.lapaz@ucb.edu.bo';
    const enlace = linkEncuesta || 'http://localhost:5173';
    const nombreCarrera = carrera || 'tu carrera';

    const cuerpoTexto = `Estimado(a) ${nombreCompleto || 'Estudiante'}:

Recibe un cordial saludo de la Unidad de Servicios Estudiantiles Integrales (USEI) de la Universidad Católica Boliviana "San Pablo".

Te recordamos que te encuentras en la nómina oficial de habilitados para el proceso de titulación en la carrera de ${nombreCarrera} (CI: ${carnetIdentidad}).

Para continuar con la programación de tu defensa de grado y firma de acta, es requisito institucional completar la "Encuesta a Tiempo de Graduación". Al finalizarla, el sistema generará automáticamente tu Certificado Oficial de Cumplimiento en PDF y te lo enviará por correo.

Puedes ingresar a completar la encuesta en el siguiente enlace:
${enlace}

Ten a mano tu Carnet de Identidad y un correo personal activo para recibir tu certificado digital.

Atentamente,
Unidad de Servicios Estudiantiles Integrales (USEI)
Universidad Católica Boliviana "San Pablo" · Sede La Paz`;

    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0e3d7a; color: #ffffff; padding: 22px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Universidad Católica Boliviana "San Pablo"</h2>
          <p style="margin: 5px 0 0; font-size: 13px; color: #f59e0b; font-weight: 600;">Unidad de Servicios Estudiantiles Integrales (USEI) · Sede La Paz</p>
        </div>
        <div style="padding: 26px;">
          <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${nombreCompleto || 'Estudiante'}</strong>:</p>
          <p style="color: #475569; font-size: 14px;">
            Te recordamos que te encuentras en la nómina de habilitados para la obtención de tu título profesional en la carrera de <strong>${nombreCarrera}</strong>.
          </p>
          <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 14px; margin: 18px 0; border-radius: 4px;">
            <p style="margin: 0; color: #0f172a; font-size: 13.5px;">
              <strong>Requisito Institucional de Titulación:</strong> Completar la <em>Encuesta a Tiempo de Graduación</em> es necesario para la emisión de tu <strong>Certificado Oficial USEI</strong> requerido para tu defensa de grado y acta de graduación.
            </p>
          </div>
          <div style="text-align: center; margin: 26px 0;">
            <a href="${enlace}" target="_blank" rel="noopener noreferrer" style="background-color: #0e3d7a; color: #ffffff; padding: 13px 26px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Completar Encuesta de Graduación →
            </a>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 22px; font-size: 12px; color: #64748b;">
            <p style="margin: 0;"><strong>Carnet de Identidad registrado:</strong> ${carnetIdentidad}</p>
            <p style="margin: 4px 0 0;">Si ya completaste la encuesta recientemente, por favor desestima este mensaje.</p>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px 20px; font-size: 11.5px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
          USEI La Paz · Av. 14 de Septiembre N° 4807, Obrajes · usei.lapaz@ucb.edu.bo
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: `"USEI - UCB La Paz" <${remitente}>`,
      to: destinatario,
      subject: `Recordatorio: Encuesta Oficial a Tiempo de Graduación - USEI U.C.B. (${nombreCompleto})`,
      text: cuerpoTexto,
      html: cuerpoHtml,
    });

    console.log(`[SMTP USEI Recordatorio] Correo enviado exitosamente a: ${destinatario}`);
    return { exito: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[SMTP USEI Error] Falló el recordatorio a ${destinatario}:`, err.message);
    throw new Error(`No se pudo enviar el correo a ${destinatario}: ${err.message}`);
  }
}

module.exports = {
  enviarCertificadoGraduado,
  enviarRecordatorioEncuesta,
};
