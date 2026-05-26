import { THINGIVERSE_URL } from '../config';
import type { Thing, CustomBlock } from '../types';
import {
  imageUrl,
  renderWrapper,
  renderHeader,
  renderFooter,
  renderCustomBlocks,
} from './shared';

const PRIMARY_BLUE = '#2b52fe';

/**
 * Render secondary images row (up to 3 images in a horizontal strip).
 * Only called when the thing has secondary images.
 */
function renderSecondaryImages(thing: Thing, bgColor: string): string {
  if (thing.secondaryImages.length === 0) return '';

  const thingUrl = `${THINGIVERSE_URL}/thing:${thing.id}`;
  const images = thing.secondaryImages.slice(0, 3);

  const cells = images
    .map((path) => {
      const src = imageUrl(path);
      return `        <td style="width:33.33%;padding:0 4px;">
          <a href="${thingUrl}" style="display:block;text-decoration:none;">
            <img src="${src}" alt="" width="168" style="width:100%;height:130px;object-fit:cover;display:block;border:0;border-radius:6px;">
          </a>
        </td>`;
    })
    .join('\n');

  return `      <tr><td style="padding:4px 12px 16px;background-color:${bgColor};text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      <tr>
${cells}
      </tr>
    </table>
  </td></tr>`;
}

/**
 * Render a single featured thing card.
 * Cards alternate between white (#ffffff) and light blue (#f5f7ff) backgrounds.
 */
function renderThingCard(thing: Thing, index: number): string {
  const isEven = index % 2 === 0;
  const bgColor = isEven ? '#ffffff' : '#f5f7ff';
  const imgSrc = imageUrl(thing.imagePath);
  const thingUrl = `${THINGIVERSE_URL}/thing:${thing.id}`;
  const creatorUrl = `${THINGIVERSE_URL}/${thing.creator.username}`;
  const creatorName =
    thing.creator.firstName || thing.creator.lastName
      ? `${thing.creator.firstName} ${thing.creator.lastName}`.trim()
      : thing.creator.username;

  const descriptionHtml = thing.description
    ? `\n        <p style="margin:10px 0 14px;font-size:14px;color:#444;line-height:1.7;">${thing.description}</p>`
    : '';

  const secondaryHtml = renderSecondaryImages(thing, bgColor);

  return `      <tr><td style="background-color:${bgColor};padding:16px 32px 16px;" class="mobile-pad">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${bgColor};border:1px solid #e8ecff;border-radius:10px;overflow:hidden;box-shadow:0 4px 14px rgba(43,82,254,0.08);">
      <tr><td style="padding:0;line-height:0;background-color:${bgColor};">
        <a href="${thingUrl}" style="display:block;text-decoration:none;">
          <img src="${imgSrc}" alt="${thing.name}" width="540" style="width:100%;height:auto;display:block;border:0;">
        </a>
      </td></tr>
      <tr><td style="padding:24px 22px 6px;text-align:center;background-color:${bgColor};">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${PRIMARY_BLUE};text-transform:uppercase;letter-spacing:1.8px;">Featured</p>
        <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1a1a1a;line-height:1.2;letter-spacing:-0.3px;">${thing.name}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#999;">by <a href="${creatorUrl}" style="color:${PRIMARY_BLUE};text-decoration:none;font-weight:600;">${creatorName}</a></p>${descriptionHtml}
        <a href="${thingUrl}" style="display:inline-block;margin-top:14px;background-color:${PRIMARY_BLUE};color:#ffffff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">View on Thingiverse</a>
      </td></tr>
${secondaryHtml}
    </table>
  </td></tr>`;
}

/**
 * Render the full "The Build" newsletter HTML.
 *
 * @param things - Featured things to include
 * @param introText - Optional custom intro paragraph text
 * @param customBlocks - Optional promotional blocks rendered after thing cards
 */
export function renderTheBuild(
  things: Thing[],
  introText?: string,
  customBlocks?: CustomBlock[],
): string {
  const intro = introText || 'Here are some projects that caught our eye this week.';

  const introSection = `      <!-- Intro -->
      <tr><td style="background-color:#f5f7ff;padding:34px 40px 28px;text-align:center;" class="mobile-pad">
        <p style="margin:0 0 10px;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.2;letter-spacing:-0.5px;">This week on Thingiverse.</p>
        <p style="margin:0 0 0;font-size:15px;color:#444;line-height:1.65;">${intro}</p>
      </td></tr>`;

  const thingCards = things
    .map((thing, i) => renderThingCard(thing, i))
    .join('\n\n');

  const customBlocksHtml = customBlocks ? renderCustomBlocks(customBlocks) : '';

  const content = [
    renderHeader('The Build'),
    introSection,
    thingCards,
    customBlocksHtml,
    renderFooter(),
  ].filter(Boolean).join('\n\n');

  return renderWrapper(content, {
    title: 'The Build',
    preheaderText:
      'This week on Thingiverse: featured projects from the community.',
  });
}
