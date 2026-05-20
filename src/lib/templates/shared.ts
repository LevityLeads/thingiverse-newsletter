import { IMAGE_CDN, THINGIVERSE_URL } from '../config';
import type { Banner } from '../types';

const FONT_STACK = "'Barlow', Arial, Helvetica, sans-serif";
const PRIMARY_BLUE = '#2b52fe';
const BG_COLOR = '#f4f4f8';
const MUTED_TEXT = '#666666';

export function imageUrl(path: string | null): string {
  if (!path) {
    return 'https://cdn.thingiverse.com/site/img/default/G0x0.jpg';
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${IMAGE_CDN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function renderWrapper(content: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thingiverse</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap" rel="stylesheet" />
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${BG_COLOR}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td>
${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderHeader(): string {
  return `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PRIMARY_BLUE};">
                <tr>
                  <td align="center" height="48" style="height:48px; font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:#ffffff; letter-spacing:4px;">
                    <a href="${THINGIVERSE_URL}" style="color:#ffffff; text-decoration:none; letter-spacing:4px;">THINGIVERSE</a>
                  </td>
                </tr>
              </table>`;
}

export function renderFooter(): string {
  return `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG_COLOR};">
                <tr>
                  <td align="center" style="padding:24px 32px; font-family:${FONT_STACK}; font-size:12px; color:${MUTED_TEXT}; line-height:1.6;">
                    You're receiving this because you're part of the Thingiverse community.
                    <br />
                    <a href="{{{unsubscribe}}}" style="color:${MUTED_TEXT}; text-decoration:underline;">Unsubscribe</a>
                    &nbsp;&middot;&nbsp;
                    <a href="{{{unsubscribe_preferences}}}" style="color:${MUTED_TEXT}; text-decoration:underline;">Email Preferences</a>
                  </td>
                </tr>
              </table>`;
}

export function renderBanners(banners: Banner[]): string {
  const activeBanners = banners.filter((b) => b.active);
  if (activeBanners.length === 0) return '';

  const bannerRows = activeBanners
    .map(
      (banner, i) => `                <tr>
                  ${i > 0 ? `<td style="height:8px; font-size:0; line-height:0;">&nbsp;</td></tr><tr>` : ''}
                  <td align="center" style="padding:0 24px;">
                    <a href="${banner.linkUrl}" style="text-decoration:none;">
                      <img src="${banner.imageUrl}" alt="${banner.name}" width="552" style="display:block; width:100%; max-width:552px; height:auto; border-radius:8px; border:0;" />
                    </a>
                  </td>
                </tr>`
    )
    .join('\n');

  return `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:16px 0;">
${bannerRows}
              </table>`;
}

export function renderDivider(): string {
  return `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="border-top:1px solid #e5e7eb; height:1px; font-size:0; line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`;
}
