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
    console.log("Verification email generated");
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
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // @ts-ignore
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
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
    console.log("Email send skipped");
  }
}

export async function sendInvitationEmail(email: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/register?email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: "You're invited to join",
    html: `<p>You have been invited to join an organization. <a href="${url}">Create your account</a>.</p>`,
  });
}
