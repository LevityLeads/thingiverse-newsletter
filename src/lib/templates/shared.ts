import { IMAGE_CDN, THINGIVERSE_URL } from '../config';
import type { CustomBlock } from '../types';

const PRIMARY_BLUE = '#2b52fe';

export function imageUrl(path: string | null): string {
  if (!path) {
    return 'https://cdn.thingiverse.com/site/img/default/G0x0.jpg';
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${IMAGE_CDN}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Full HTML document wrapper matching production emails.
 * Includes doctype, head with Barlow font, MSO conditionals, mobile responsive
 * styles, body with #f0f2f5 background, and the outer centering table.
 *
 * @param content - Inner table rows (header through footer)
 * @param title - Document <title> text
 * @param preheaderText - Hidden preview text for email clients
 * @param mobileStyles - Additional mobile CSS rules (e.g. .mobile-stack)
 */
export function renderWrapper(
  content: string,
  options: {
    title?: string;
    preheaderText?: string;
    mobileStyles?: string;
  } = {}
): string {
  const {
    title = 'Thingiverse',
    preheaderText = 'New from the Thingiverse community this week.',
    mobileStyles = '',
  } = options;

  const allMobileStyles = `
      .mobile-outer-pad { padding: 0 !important; }
      .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
      ${mobileStyles}`.trim();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      ${allMobileStyles}
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;word-break:break-word;-webkit-font-smoothing:antialiased;background-color:#f0f2f5;font-family:'Barlow',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f0f2f5;">${preheaderText} &#847; &#847; &#847;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr><td class="mobile-outer-pad" style="padding:16px 8px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 auto;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.08);">

${content}

    </table>
  </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Blue header bar with white Thingiverse logo image.
 * Optionally includes a subtitle line (e.g. "The Build").
 */
export function renderHeader(subtitle?: string): string {
  const subtitleHtml = subtitle
    ? `\n        <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:3px;font-weight:600;">${subtitle}</p>`
    : '';

  return `      <!-- Header -->
      <tr><td style="background-color:${PRIMARY_BLUE};padding:28px 40px ${subtitle ? '26px' : '24px'};text-align:center;" class="mobile-pad">
        <a href="${THINGIVERSE_URL}" style="text-decoration:none;">
          <img src="https://tg-content.vercel.app/assets/thingiverse-logo-white.png" alt="Thingiverse" style="height:42px;border:0;display:inline-block;">
        </a>${subtitleHtml}
      </td></tr>`;
}

/**
 * "Dare to be human" outro + divider + footer with unsubscribe links.
 */
export function renderFooter(): string {
  return `      <!-- Outro -->
      <tr><td style="background-color:#ffffff;padding:24px 40px 34px;text-align:center;" class="mobile-pad">
        <p style="margin:0 0 4px;font-size:13px;color:#999;line-height:1.6;">Built by humans. Shared openly.</p>
        <p style="margin:0;font-size:11px;font-weight:700;color:${PRIMARY_BLUE};text-transform:uppercase;letter-spacing:3px;">Dare to be human</p>
      </td></tr>

      <tr><td style="padding:0;"><hr style="border:none;border-top:1px solid #f0f2f5;margin:0;"></td></tr>

      <!-- Footer -->
      <tr><td style="background-color:#ffffff;padding:24px 40px 28px;text-align:center;border-top:1px solid #eee;" class="mobile-pad">
        <p style="margin:0 0 10px;font-size:13px;color:#999;line-height:1.5;">You are receiving this because you are part of the Thingiverse community.</p>
        <p style="margin:0;font-size:12px;color:#bbb;">
          <a href="{{{unsubscribe}}}" style="color:${PRIMARY_BLUE};text-decoration:underline;">Unsubscribe</a> &nbsp;|&nbsp; <a href="{{{unsubscribe_preferences}}}" style="color:${PRIMARY_BLUE};text-decoration:underline;">Email Preferences</a>
        </p>
      </td></tr>`;
}

/**
 * Render custom promotional blocks.
 * Each block: full-width linked image, bold title, description text.
 * Separated by a thin gray line. Email-safe table layout with inline styles.
 */
export function renderCustomBlocks(blocks: CustomBlock[]): string {
  if (!blocks || blocks.length === 0) return '';

  const rows = blocks
    .map(
      (block) =>
        `      <tr><td style="padding:24px 40px 0;" class="mobile-pad">
        <div style="border-top:1px solid #e5e7eb;"></div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:24px;">
          <tr><td style="padding:0;">
            <a href="${block.linkUrl}" style="display:block;text-decoration:none;">
              <img src="${block.imageUrl}" alt="${block.title}" width="520" style="width:100%;max-width:560px;display:block;border-radius:8px;border:0;">
            </a>
          </td></tr>
          <tr><td style="padding:12px 0 0;">
            <a href="${block.linkUrl}" style="text-decoration:none;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#333;line-height:1.3;">${block.title}</p>
            </a>
          </td></tr>
          <tr><td style="padding:6px 0 0;">
            <p style="margin:0;font-size:14px;color:#666;line-height:1.5;">${block.description}</p>
          </td></tr>
        </table>
      </td></tr>`
    )
    .join('\n');

  return rows;
}

/**
 * Horizontal divider line inside the card.
 */
export function renderDivider(): string {
  return `      <tr><td style="padding:28px 40px 0;" class="mobile-pad"><div style="border-top:1px solid #eee;"></div></td></tr>`;
}
