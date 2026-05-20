import { THINGIVERSE_URL } from '../config';
import type { Thing, Banner } from '../types';
import {
  imageUrl,
  renderWrapper,
  renderHeader,
  renderFooter,
  renderBanners,
  renderDivider,
} from './shared';

const FONT_STACK = "'Barlow', Arial, Helvetica, sans-serif";
const PRIMARY_BLUE = '#2b52fe';
const DARK_TEXT = '#1a1a2e';
const BODY_TEXT = '#333333';
const MUTED_TEXT = '#666666';

function truncateDescription(description: string, maxLength = 200): string {
  if (!description) return '';
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength).trimEnd() + '...';
}

function renderThing(thing: Thing): string {
  const imgSrc = imageUrl(thing.imagePath);
  const thingUrl = `${THINGIVERSE_URL}/thing:${thing.id}`;
  const byLine = `${thing.creator.firstName} ${thing.creator.lastName}`.trim();
  const desc = truncateDescription(thing.description);

  return `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 24px 0 24px;">
                    <a href="${thingUrl}" style="text-decoration:none;">
                      <img src="${imgSrc}" alt="${thing.name}" width="552" style="display:block; width:100%; max-width:552px; height:300px; object-fit:cover; border-radius:8px; border:0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px 0 24px; font-family:${FONT_STACK}; font-size:20px; font-weight:700;">
                    <a href="${thingUrl}" style="color:${PRIMARY_BLUE}; text-decoration:none;">${thing.name}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px 0 24px; font-family:${FONT_STACK}; font-size:14px; color:${MUTED_TEXT};">
                    by ${byLine}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 24px 0 24px; font-family:${FONT_STACK}; font-size:14px; color:${BODY_TEXT}; line-height:1.5;">
                    ${desc}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 24px 24px 24px; font-family:${FONT_STACK}; font-size:12px; color:${MUTED_TEXT};">
                    ${thing.likeCount} like${thing.likeCount !== 1 ? 's' : ''} &middot; ${thing.collectCount} collect${thing.collectCount !== 1 ? 's' : ''} &middot; ${thing.commentCount} comment${thing.commentCount !== 1 ? 's' : ''}
                  </td>
                </tr>
              </table>`;
}

export function renderTheBuild(
  things: Thing[],
  banners: Banner[]
): string {
  const titleSection = `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:32px 24px 0 24px; font-family:${FONT_STACK}; font-size:13px; font-weight:700; color:${PRIMARY_BLUE}; letter-spacing:3px; text-transform:uppercase;">
                    THE BUILD
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 24px 0 24px; font-family:${FONT_STACK}; font-size:22px; font-weight:700; color:${DARK_TEXT}; line-height:1.3;">
                    This Week's Featured Projects
                  </td>
                </tr>
              </table>`;

  const thingSections = things
    .map((thing, i) => {
      const section = renderThing(thing);
      if (i < things.length - 1) {
        return section + '\n' + renderDivider();
      }
      return section;
    })
    .join('\n');

  const content = [
    renderHeader(),
    titleSection,
    thingSections,
    renderBanners(banners),
    renderFooter(),
  ].join('\n');

  return renderWrapper(content);
}
