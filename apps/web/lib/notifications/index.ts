import nodemailer from 'nodemailer';
import { getOpsSettings } from '@/lib/directus/opsSettings';

type NotificationType = 'contact' | 'suggestions' | 'submissions';

type SendNotificationInput = {
  type: NotificationType;
  subject: string;
  lines: string[];
};

function enabled(value: string | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function notificationsEnabledFor(
  type: NotificationType,
  settings: Awaited<ReturnType<typeof getOpsSettings>>,
): boolean {
  if (!settings.notifications_enabled) return false;
  if (type === 'contact') return settings.notify_contact_enabled;
  if (type === 'suggestions') return settings.notify_suggestions_enabled;
  return settings.notify_submissions_enabled;
}

function smtpReady(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFY_TO_EMAIL &&
      process.env.NOTIFY_FROM_EMAIL,
  );
}

async function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: enabled(process.env.SMTP_SECURE, false),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  const settings = await getOpsSettings();
  if (!notificationsEnabledFor(input.type, settings)) return;
  if (!smtpReady()) {
    console.warn(`[notify:${input.type}] skipped: SMTP env not fully configured`);
    return;
  }
  const recipients = settings.notify_to_emails.length
    ? settings.notify_to_emails.join(',')
    : process.env.NOTIFY_TO_EMAIL;
  if (!recipients) {
    console.warn(`[notify:${input.type}] skipped: no recipients configured`);
    return;
  }
  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: process.env.NOTIFY_FROM_EMAIL,
      to: recipients,
      subject: input.subject,
      text: input.lines.join('\n'),
    });
  } catch (error) {
    console.error(`[notify:${input.type}] failed`, error);
  }
}
