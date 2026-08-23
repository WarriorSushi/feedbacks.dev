export function escapeEmailHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getEmailCategory(subject: string) {
  const normalized = subject.toLowerCase()
  if (normalized.includes('daily feedback digest')) return 'Daily signal brief'
  if (normalized.includes('new ') && normalized.includes(' on ')) return 'New product signal'
  if (normalized.includes('webhook') || normalized.includes('integration')) return 'Integration health'
  if (normalized.includes('billing') || normalized.includes('pro plan')) return 'Account and billing'
  if (normalized.includes('early adopter')) return 'Early Adopter Programme'
  if (normalized.includes('public') || normalized.includes('watched request')) return 'Public board activity'
  return 'feedbacks.dev notification'
}

export function renderBrandedEmail(input: {
  subject: string
  contentHtml: string
  appOrigin: string
}) {
  const safeSubject = escapeEmailHtml(input.subject)
  const safeCategory = escapeEmailHtml(getEmailCategory(input.subject))
  const safeOrigin = escapeEmailHtml(input.appOrigin.replace(/\/$/, ''))
  const logoUrl = `${safeOrigin}/new_logo_feedbacks.dev.png`
  const settingsUrl = `${safeOrigin}/settings`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${safeSubject}</title>
    <style>
      body { margin: 0; padding: 0; background: #edf1eb; color: #18221c; font-family: Arial, Helvetica, sans-serif; }
      table { border-collapse: collapse; }
      img { border: 0; display: block; }
      .email-content h1, .email-content h2, .email-content h3 { color: #18221c; font-family: Arial, Helvetica, sans-serif; letter-spacing: -0.02em; }
      .email-content h2 { margin: 0 0 18px; font-size: 28px; line-height: 1.18; }
      .email-content h3 { margin: 24px 0 10px; font-size: 18px; line-height: 1.3; }
      .email-content p, .email-content li { color: #39473f; font-size: 15px; line-height: 1.65; }
      .email-content a { color: #286b12; }
      @media only screen and (max-width: 640px) {
        .email-frame { width: 100% !important; }
        .email-pad { padding-left: 24px !important; padding-right: 24px !important; }
        .email-content h2 { font-size: 24px !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safeSubject}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#edf1eb;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" class="email-frame" width="620" cellpadding="0" cellspacing="0" style="width:620px;max-width:620px;background:#f8faf7;border:1px solid #cfd8ce;">
            <tr><td style="height:5px;background:#a8ef34;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td class="email-pad" style="background:#173625;padding:24px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="54" valign="middle">
                      <div style="width:44px;height:44px;padding:3px;background:#f3f7ef;border:1px solid #8eaa8d;border-radius:11px;">
                        <img src="${logoUrl}" width="44" height="44" alt="feedbacks.dev" style="width:44px;height:44px;">
                      </div>
                    </td>
                    <td valign="middle" style="padding-left:12px;">
                      <p style="margin:0;color:#f3f7ef;font-size:18px;font-weight:700;letter-spacing:-0.02em;">feedbacks.dev</p>
                      <p style="margin:4px 0 0;color:#b8c9ba;font-size:11px;line-height:1.3;">Product signal, without the clutter.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad email-content" style="padding:38px 44px 42px;background:#f8faf7;">
                <p style="margin:0 0 16px;color:#4a6a50;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${safeCategory}</p>
                ${input.contentHtml}
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:22px 44px;background:#e5ebe3;border-top:1px solid #cfd8ce;">
                <p style="margin:0;color:#4f5f54;font-size:12px;line-height:1.6;">Sent by feedbacks.dev because this account enabled the relevant product or service notification.</p>
                <p style="margin:8px 0 0;color:#4f5f54;font-size:12px;line-height:1.6;"><a href="${settingsUrl}" style="color:#286b12;font-weight:700;text-decoration:none;">Manage notification settings</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="mailto:pashaseenainc@gmail.com" style="color:#286b12;text-decoration:none;">Get help</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
