export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "noreply@example.com",
        to: email,
        subject: "Verify your email",
        html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
      }),
    });
  } else {
    console.log(`Verification link for ${email}: ${verifyUrl}`);
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions) {
  if (
    process.env.ZOHO_SMTP_HOST &&
    process.env.ZOHO_SMTP_USER &&
    process.env.ZOHO_SMTP_PASS
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // @ts-ignore
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.ZOHO_SMTP_HOST,
        port: Number(process.env.ZOHO_SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.ZOHO_SMTP_USER,
          pass: process.env.ZOHO_SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.ZOHO_SMTP_FROM || process.env.ZOHO_SMTP_USER,
        to,
        subject,
        html,
        text,
      });
      return;
    } catch (err) {
      console.error("SMTP send failed", err);
    }
  }

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "noreply@example.com",
        to,
        subject,
        html,
      }),
    });
  } else {
    console.log(`Email to ${to}: ${subject}\n${text || ""}`);
  }
}
