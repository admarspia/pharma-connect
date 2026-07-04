import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../common/logger";

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.secure,
  auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
});

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: env.mail.from, to, subject, html });
  } catch (err) {
    // Notification failures must not break core account/reservation flows
    // (CON-019 style graceful degradation applied to the notification domain).
    logger.warn(`Failed to send email to ${to}`, { error: (err as Error).message });
  }
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.APP_PUBLIC_URL ?? "http://localhost:3000"}/verify-email?token=${token}`;
  await sendMail(
    to,
    "Verify your email - PDPMRS",
    `<p>Welcome to PDPMRS. Please verify your email by clicking the link below:</p>
     <p><a href="${link}">${link}</a></p>
     <p>This link expires in 24 hours.</p>`
  );
}

export async function sendReservationStatusEmail(
  to: string,
  status: string,
  pharmacyName: string
): Promise<void> {
  await sendMail(
    to,
    `Reservation ${status.toLowerCase()} - PDPMRS`,
    `<p>Your reservation with <strong>${pharmacyName}</strong> is now <strong>${status}</strong>.</p>`
  );
}
