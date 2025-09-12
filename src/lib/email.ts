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
