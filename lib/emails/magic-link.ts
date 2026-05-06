// =============================================================================
// lib/emails/magic-link.ts
// Branded HTML email for passwordless magic link authentication.
// Rendered inline — no external template engine required.
// =============================================================================

interface MagicLinkEmailProps {
  url: string;
  email: string;
}

export function magicLinkEmail({ url, email }: MagicLinkEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to InvoiceApp</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #0A0A0A;
  font-family: -apple-system, 'Inter', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="
          max-width: 560px;
          width: 100%;
          background-color: #111111;
          border: 1px solid #1F1F1F;
          border-radius: 12px;
          overflow: hidden;
        ">
          <!-- Header -->
          <tr>
            <td style="
              padding: 36px 40px 28px;
              border-bottom: 1px solid #1F1F1F;
            ">
              <div style="display: flex; align-items: center; gap: 10px;">
                <!-- Logo mark -->
                <div style="
                  width: 32px;
                  height: 32px;
                  background-color: #3B82F6;
                  border-radius: 8px;
                  display: inline-block;
                  vertical-align: middle;
                "></div>
                <span style="
                  display: inline-block;
                  vertical-align: middle;
                  margin-left: 10px;
                  font-size: 18px;
                  font-weight: 700;
                  color: #F8F8F8;
                  letter-spacing: -0.03em;
                ">InvoiceApp</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <h1 style="
                margin: 0 0 12px;
                font-size: 24px;
                font-weight: 700;
                color: #F8F8F8;
                letter-spacing: -0.04em;
                line-height: 1.2;
              ">Your sign-in link</h1>
              <p style="
                margin: 0 0 32px;
                font-size: 15px;
                line-height: 1.6;
                color: #888888;
              ">
                We received a sign-in request for <strong style="color: #BBBBBB;">${email}</strong>.
                Click the button below to securely access your workspace.
                This link expires in <strong style="color: #BBBBBB;">24 hours</strong> and can only be used once.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="
                    background-color: #3B82F6;
                    border-radius: 8px;
                  ">
                    <a
                      href="${url}"
                      style="
                        display: inline-block;
                        padding: 14px 28px;
                        font-size: 15px;
                        font-weight: 600;
                        color: #FFFFFF;
                        text-decoration: none;
                        letter-spacing: -0.01em;
                      "
                    >Sign in to InvoiceApp →</a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="
                margin: 0 0 8px;
                font-size: 12px;
                color: #555555;
              ">Or paste this link directly into your browser:</p>
              <p style="
                margin: 0;
                font-size: 11px;
                color: #3B82F6;
                word-break: break-all;
                font-family: 'Courier New', monospace;
              ">${url}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding: 20px 40px;
              border-top: 1px solid #1A1A1A;
            ">
              <p style="
                margin: 0;
                font-size: 12px;
                color: #444444;
                line-height: 1.5;
              ">
                If you didn't request this link, you can safely ignore this email.
                No one can access your account without clicking the link.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
