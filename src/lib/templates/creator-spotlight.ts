import { THINGIVERSE_URL } from '../config';
import type { Creator, Banner, Design } from '../types';
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

function renderDesignGrid(designs: Design[]): string {
  const top4 = designs.slice(0, 4);
  if (top4.length === 0) return '';

  // Pad to 4 if fewer designs
  while (top4.length < 4) {
    top4.push(null as unknown as Design);
  }

  const rows: string[] = [];
  for (let r = 0; r < 2; r++) {
    const left = top4[r * 2];
    const right = top4[r * 2 + 1];
    rows.push(`                        <tr>
                          <td width="50%" valign="top" style="padding:4px;">
                            ${left ? renderDesignCard(left) : '&nbsp;'}
                          </td>
                          <td width="50%" valign="top" style="padding:4px;">
                            ${right ? renderDesignCard(right) : '&nbsp;'}
                          </td>
                        </tr>`);
  }

  return `                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${rows.join('\n')}
                      </table>`;
}

function renderDesignCard(design: Design): string {
  const imgSrc = imageUrl(design.imagePath);
  const thingUrl = `${THINGIVERSE_URL}/thing:${design.id}`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td>
                                  <a href="${thingUrl}" style="text-decoration:none;">
                                    <img src="${imgSrc}" alt="${design.name}" width="270" style="display:block; width:100%; max-width:270px; height:180px; object-fit:cover; border-radius:8px; border:0;" />
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0 2px 0; font-family:${FONT_STACK}; font-size:13px; line-height:1.3;">
                                  <a href="${thingUrl}" style="color:${BODY_TEXT}; text-decoration:none;">${design.name}</a>
                                </td>
                              </tr>
                              <tr>
                                <td style="font-family:${FONT_STACK}; font-size:11px; color:${MUTED_TEXT};">
                                  ${design.likeCount} like${design.likeCount !== 1 ? 's' : ''}
                                </td>
                              </tr>
                            </table>`;
}

function renderCreator(creator: Creator): string {
  const avatarSrc = imageUrl(creator.avatarPath);
  const profileUrl = `${THINGIVERSE_URL}/${creator.username}`;
  const fullName = `${creator.firstName} ${creator.lastName}`.trim();

  return `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:24px 24px 0 24px;">
                    <a href="${profileUrl}" style="text-decoration:none;">
                      <img src="${avatarSrc}" alt="${fullName}" width="80" height="80" style="display:block; width:80px; height:80px; border-radius:50%; border:3px solid ${PRIMARY_BLUE}; object-fit:cover;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:12px 24px 0 24px; font-family:${FONT_STACK}; font-size:18px; font-weight:700;">
                    <a href="${profileUrl}" style="color:${PRIMARY_BLUE}; text-decoration:none;">${fullName}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:2px 24px 0 24px; font-family:${FONT_STACK}; font-size:13px; color:${MUTED_TEXT}; font-style:italic;">
                    Thingiverse Creator
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 24px 0 24px; font-family:${FONT_STACK}; font-size:14px; color:${BODY_TEXT}; line-height:1.5;">
                    ${creator.bio}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px 24px 20px;">
${renderDesignGrid(creator.designs)}
                  </td>
                </tr>
              </table>`;
}

export function renderCreatorSpotlight(
  creators: Creator[],
  banners: Banner[]
): string {
  const titleSection = `              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:32px 24px 0 24px; font-family:${FONT_STACK}; font-size:13px; font-weight:700; color:${PRIMARY_BLUE}; letter-spacing:3px; text-transform:uppercase;">
                    CREATOR SPOTLIGHT
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 24px 0 24px; font-family:${FONT_STACK}; font-size:22px; font-weight:700; color:${DARK_TEXT}; line-height:1.3;">
                    Meet This Week's Featured Makers
                  </td>
                </tr>
              </table>`;

  const creatorSections = creators
    .map((creator, i) => {
      const section = renderCreator(creator);
      if (i < creators.length - 1) {
        return section + '\n' + renderDivider();
      }
      return section;
    })
    .join('\n');

  const content = [
    renderHeader(),
    titleSection,
    creatorSections,
    renderBanners(banners),
    renderFooter(),
  ].join('\n');

  return renderWrapper(content);
}
