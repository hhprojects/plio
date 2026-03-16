import { Resend } from 'resend';
import { render } from '@react-email/components';
import nodemailer from 'nodemailer';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SMTP_HOST = process.env.SMTP_HOST || '127.0.0.1';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '54325', 10);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

async function sendViaSmtp({
  to,
  subject,
  react,
  from,
}: Required<SendEmailOptions>): Promise<{ success: boolean; error?: string }> {
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
  });

  const html = await render(react);

  await transport.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  });

  console.log(`[email] Sent via local SMTP (${SMTP_HOST}:${SMTP_PORT}): "${subject}" → ${to}`);
  return { success: true };
}

export async function sendEmail({
  to,
  subject,
  react,
  from = 'Plio <noreply@plio.app>',
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // Production: use Resend
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        react,
      });

      if (error) {
        console.error('[email] Send failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('[email] Unexpected error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  // Local dev: use SMTP (Supabase Inbucket)
  try {
    return await sendViaSmtp({ to, subject, react, from });
  } catch (err) {
    console.error('[email] Local SMTP send failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
