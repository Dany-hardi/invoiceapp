// =============================================================================
// lib/emails/invoice-email.ts
// Branded HTML invoice email — sent to the client when invoice is dispatched.
// Includes: summary table, pay button, portal link, PDF attachment note.
// =============================================================================

interface InvoiceEmailData {
  invoiceNumber: string;
  businessName:  string;
  businessEmail: string;
  customerName:  string;
  issueDate:     string;
  dueDate:       string;
  total:         string;      // Pre-formatted string e.g. "$1,234.56"
  currency:      string;
  lineItems: {
    description: string;
    quantity:    number;
    unitPrice:   string;
    total:       string;
  }[];
  taxRate:   number;
  taxAmount: string;
  subtotal:  string;
  notes?:    string | null;
  portalUrl: string;          // The /pay/[publicToken] URL
}

export function invoiceEmail(d: InvoiceEmailData): string {
  const lineItemRows = d.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:13px;color:#374151;line-height:1.5;">${item.description}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:13px;color:#6B7280;text-align:right;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:13px;color:#6B7280;text-align:right;">${item.unitPrice}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:13px;color:#111827;font-weight:600;text-align:right;">${item.total}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${d.invoiceNumber} from ${d.businessName}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── Header ───────────────────────────────────────── -->
          <tr>
            <td style="background:#0A0A0A;border-radius:12px 12px 0 0;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#3B82F6;border-radius:7px;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:14px;font-weight:700;">${d.businessName.charAt(0).toUpperCase()}</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:15px;font-weight:700;color:#F8F8F8;letter-spacing:-0.3px;">${d.businessName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align:right;">
                    <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#555;">Invoice</div>
                    <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.5px;margin-top:3px;">${d.invoiceNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Greeting ──────────────────────────────────────── -->
          <tr>
            <td style="background:#fff;padding:32px 36px 0;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0A0A0A;letter-spacing:-0.5px;">
                You have a new invoice
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6B7280;">
                Hi ${d.customerName}, ${d.businessName} has sent you an invoice for
                <strong style="color:#111827;">${d.total}</strong>
                due on <strong style="color:#111827;">${d.dueDate}</strong>.
                The PDF is attached to this email.
              </p>

              <!-- Pay Now CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#3B82F6;border-radius:8px;">
                    <a href="${d.portalUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;letter-spacing:-0.2px;">
                      View &amp; Pay Invoice →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Invoice details ───────────────────────────────── -->
          <tr>
            <td style="background:#fff;padding:0 36px 24px;">
              <!-- Meta row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;border-right:1px solid #E5E7EB;">
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:4px;">Invoice</div>
                    <div style="font-size:13px;font-weight:700;color:#111827;">${d.invoiceNumber}</div>
                  </td>
                  <td style="padding:14px 18px;border-right:1px solid #E5E7EB;">
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:4px;">Issued</div>
                    <div style="font-size:13px;font-weight:700;color:#111827;">${d.issueDate}</div>
                  </td>
                  <td style="padding:14px 18px;border-right:1px solid #E5E7EB;">
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:4px;">Due</div>
                    <div style="font-size:13px;font-weight:700;color:#EF4444;">${d.dueDate}</div>
                  </td>
                  <td style="padding:14px 18px;">
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:4px;">Total</div>
                    <div style="font-size:14px;font-weight:700;color:#0A0A0A;">${d.total}</div>
                  </td>
                </tr>
              </table>

              <!-- Line items table -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom:2px solid #0A0A0A;">
                    <th style="text-align:left;padding-bottom:8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#374151;">Description</th>
                    <th style="text-align:right;padding-bottom:8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#374151;">Qty</th>
                    <th style="text-align:right;padding-bottom:8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#374151;">Price</th>
                    <th style="text-align:right;padding-bottom:8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#374151;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemRows}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:12px;color:#6B7280;">Subtotal</td>
                        <td style="padding:4px 0;font-size:12px;color:#374151;text-align:right;">${d.subtotal}</td>
                      </tr>
                      ${d.taxRate > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:12px;color:#6B7280;">Tax (${d.taxRate.toFixed(2)}%)</td>
                        <td style="padding:4px 0;font-size:12px;color:#374151;text-align:right;">${d.taxAmount}</td>
                      </tr>` : ""}
                      <tr>
                        <td colspan="2" style="padding:8px 0 0;border-top:1px solid #E5E7EB;"></td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;font-weight:700;color:#0A0A0A;">Total Due</td>
                        <td style="padding:4px 0;font-size:15px;font-weight:700;color:#0A0A0A;text-align:right;">${d.total}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Notes ─────────────────────────────────────────── -->
          ${d.notes ? `
          <tr>
            <td style="background:#fff;padding:0 36px 24px;">
              <div style="background:#F0F9FF;border-radius:8px;border-left:3px solid #3B82F6;padding:14px 16px;">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#93C5FD;margin-bottom:6px;">Notes</div>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#374151;white-space:pre-wrap;">${d.notes}</p>
              </div>
            </td>
          </tr>` : ""}

          <!-- ── Portal reminder ───────────────────────────────── -->
          <tr>
            <td style="background:#fff;padding:0 36px 32px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Or paste this link in your browser to pay online:<br/>
                <a href="${d.portalUrl}" style="color:#3B82F6;word-break:break-all;">${d.portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- ── Footer ────────────────────────────────────────── -->
          <tr>
            <td style="background:#0A0A0A;border-radius:0 0 12px 12px;padding:20px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;color:#444;">
                    Sent by <strong style="color:#666;">${d.businessName}</strong>
                    via <strong style="color:#666;">InvoiceApp</strong>
                  </td>
                  <td style="text-align:right;font-size:11px;color:#444;">
                    <a href="${d.portalUrl}" style="color:#3B82F6;text-decoration:none;">
                      View invoice online →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
