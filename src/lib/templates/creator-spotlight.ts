import { THINGIVERSE_URL } from '../config';
import type { Creator, Banner, Design } from '../types';
import {
  imageUrl,
  renderWrapper,
  renderHeader,
  renderFooter,
  renderDivider,
} from './shared';

const PRIMARY_BLUE = '#2b52fe';

/**
 * Render a single design card within a creator's 2x2 grid.
 * Card: image (100% width, 130px height, object-fit cover), name (13px semibold).
 * Shadow and rounded corners match production.
 */
function renderDesignCard(design: Design, isRight: boolean, isBottom: boolean): string {
  const imgSrc = imageUrl(design.imagePath);
  const thingUrl = `${THINGIVERSE_URL}/thing:${design.id}`;
  const paddingStyle = isRight
    ? `padding:0 0 ${isBottom ? '0' : '10px'} 5px`
    : `padding:0 5px ${isBottom ? '0' : '10px'} 0`;

  return `<td width="50%" style="${paddingStyle};vertical-align:top;" class="mobile-stack">
      <a href="${thingUrl}" style="display:block;text-decoration:none;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <tr><td><img src="${imgSrc}" alt="${design.name}" style="width:100%;height:130px;object-fit:cover;object-position:center;border:0;display:block;"></td></tr>
          <tr><td style="padding:10px 12px 12px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a;line-height:1.3;">${design.name}</p>
          </td></tr>
        </table>
      </a>
    </td>`;
}

/**
 * Render the 2x2 design grid for a creator.
 * Takes up to 4 designs. If fewer than 4, only renders what's available.
 */
function renderDesignGrid(designs: Design[]): string {
  const top4 = designs.slice(0, 4);
  if (top4.length === 0) return '';

  const rows: string[] = [];

  // Row 1: designs 0 and 1
  if (top4.length >= 1) {
    const left = renderDesignCard(top4[0], false, top4.length <= 2);
    const right = top4[1]
      ? renderDesignCard(top4[1], true, top4.length <= 2)
      : '<td width="50%" style="vertical-align:top;" class="mobile-stack">&nbsp;</td>';
    rows.push(`                        <tr>${left}${right}</tr>`);
  }

  // Row 2: designs 2 and 3
  if (top4.length >= 3) {
    const left = renderDesignCard(top4[2], false, true);
    const right = top4[3]
      ? renderDesignCard(top4[3], true, true)
      : '<td width="50%" style="vertical-align:top;" class="mobile-stack">&nbsp;</td>';
    rows.push(`                        <tr>${left}${right}</tr>`);
  }

  return `                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
${rows.join('\n')}
                    </table>`;
}

/**
 * Render banner section with descriptions.
 * Each banner gets a full-width image and a description line beneath it.
 */
function renderBannerSection(banners: Banner[]): string {
  const activeBanners = banners.filter((b) => b.active);
  if (activeBanners.length === 0) return '';

  const divider = `      <tr><td style="padding:28px 40px 0;" class="mobile-pad"><div style="border-top:1px solid #eee;"></div></td></tr>`;

  const bannerRows = activeBanners
    .map((banner, i) => {
      const topPad = i === 0 ? '24px' : '16px';
      return `      <tr><td style="padding:${topPad} 0 0;">
        <a href="${banner.linkUrl}" style="text-decoration:none;">
          <img src="${banner.imageUrl}" alt="${banner.name}" width="600" style="width:100%;display:block;border-radius:8px;" />
        </a>
        <p style="margin:8px 0 0;font-size:13px;color:#555;line-height:1.5;text-align:center;padding:0 40px;">${banner.description}</p>
      </td></tr>`;
    })
    .join('\n');

  return `${divider}\n\n${bannerRows}`;
}

/**
 * Render a single creator section: avatar, name, tagline, bio, design grid.
 */
function renderCreator(creator: Creator): string {
  const avatarSrc = imageUrl(creator.avatarPath);
  const profileUrl = `${THINGIVERSE_URL}/${creator.username}`;
  const fullName = `${creator.firstName} ${creator.lastName}`.trim() || creator.username;

  // Use custom tagline if provided, otherwise auto-generate from stats
  let tagline: string;
  if (creator.tagline) {
    tagline = creator.tagline;
  } else {
    const totalLikes = creator.designs.reduce((sum, d) => sum + d.likeCount, 0);
    tagline =
      totalLikes > 1000
        ? `${creator.designs.length} Designs, ${Math.round(totalLikes / 1000)}K Likes`
        : `${creator.designs.length} Designs`;
  }

  const bioHtml = creator.bio
    ? `\n                <tr><td style="padding:10px 50px 0;text-align:center;" class="mobile-pad">
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${creator.bio}</p>
                </td></tr>`
    : '';

  return `                <!-- ${fullName} -->
                <tr><td style="padding:32px 40px 0;text-align:center;" class="mobile-pad">
                    <a href="${profileUrl}" style="text-decoration:none;">
                        <img src="${avatarSrc}" alt="${fullName}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${PRIMARY_BLUE};display:inline-block;object-fit:cover;">
                    </a>
                </td></tr>
                <tr><td style="padding:12px 40px 0;text-align:center;" class="mobile-pad">
                    <h2 style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a;">
                        <a href="${profileUrl}" style="color:#1a1a1a;text-decoration:none;">${fullName}</a>
                    </h2>
                    <p style="margin:4px 0 0;font-size:13px;color:${PRIMARY_BLUE};font-weight:500;">${tagline}</p>
                </td></tr>${bioHtml}
                <tr><td style="padding:20px 34px 28px;" class="mobile-pad">
${renderDesignGrid(creator.designs)}
                </td></tr>`;
}

/**
 * Render the full "Creator Spotlight" newsletter HTML.
 *
 * @param creators - Featured creators with their designs
 * @param banners - Banners to render at the bottom with descriptions
 */
export function renderCreatorSpotlight(
  creators: Creator[],
  banners: Banner[]
): string {
  const titleSection = `                <!-- Title -->
                <tr><td style="padding:28px 40px 24px;text-align:center;" class="mobile-pad">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:1.5px;">Creator Spotlight</h1>
                </td></tr>

                <!-- Divider -->
                <tr><td style="padding:0 40px;" class="mobile-pad"><div style="border-top:1px solid #eee;"></div></td></tr>`;

  const creatorSections = creators
    .map((creator, i) => {
      const section = renderCreator(creator);
      if (i < creators.length - 1) {
        return section + '\n' + renderDivider();
      }
      return section;
    })
    .join('\n\n');

  const bannerSection = renderBannerSection(banners);

  const content = [
    renderHeader(),
    titleSection,
    creatorSections,
    bannerSection,
    renderFooter(),
  ].filter(Boolean).join('\n\n');

  return renderWrapper(content, {
    title: 'Creator Spotlight',
    preheaderText: 'Meet this week\'s featured creators from the Thingiverse community.',
    mobileStyles: '.mobile-stack { width:100% !important; display:block !important; padding:0 0 10px 0 !important; }',
  });
}
