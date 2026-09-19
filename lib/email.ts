/**
 * Single email path for the whole app: EmailJS REST API.
 *
 * EmailJS is a client-oriented email service — the service ID, template ID
 * and public key are safe to ship to the browser (they are "public by
 * design"). They must still be configured via env vars so every deployment
 * can point at its own EmailJS account.
 *
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID  service_xxx
 *   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID template_xxx
 *   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  the "public key" shown in EmailJS → Account
 *
 * The EmailJS template must use the params: {{to_email}}, {{subject}},
 * {{html_content}} (same template the app has always used).
 */

const EMAILJS_API = "https://api.emailjs.com/api/v1.0/email/send";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} env var — email sending is not configured. Add it to .env.local (see .env.local.example).`
    );
  }
  return value;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const serviceId = required("NEXT_PUBLIC_EMAILJS_SERVICE_ID");
  const templateId = required("NEXT_PUBLIC_EMAILJS_TEMPLATE_ID");
  const publicKey = required("NEXT_PUBLIC_EMAILJS_PUBLIC_KEY");

  const res = await fetch(EMAILJS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: to,
        subject,
        html_content: html,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("EmailJS error:", res.status, text);
    throw new Error(`EmailJS failed (${res.status}): ${text.slice(0, 300)}`);
  }

  return res.text();
}