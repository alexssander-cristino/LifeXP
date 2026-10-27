/**
 * LifeXP — Servico de e-mail.
 *
 * Desenvolvimento: apenas registra os tokens nos logs (EMAIL_ENABLED=false).
 * Producao: defina EMAIL_ENABLED=true e configure SMTP_HOST/PORT/USER/PASS/FROM.
 * Nao armazene senhas ou tokens no corpo do log de produção.
 */

import { config } from "../config.js";

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (!config.emailEnabled) {
    // Em desenvolvimento nao enviamos e-mails reais. O token e exibido nos logs
    // para que o fluxo de verificao/redefinicao possa ser testado manualmente.
    console.log(`[EMAIL-DEV] Para: ${args.to}\nAssunto: ${args.subject}\n${args.text}`);
    return;
  }

  const transporter = await createTransporter();
  await transporter.sendMail({
    from: config.smtpFrom,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
  });
}

async function createTransporter(): Promise<any> {
  // nodemailer e carregado dinamicamente para nao ser dependencia obrigatoria
  // quando o e-mail esta desativado.
  const nodemailer = (await import("nodemailer")).default;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: config.smtpUser && config.smtpPass ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  });
}
