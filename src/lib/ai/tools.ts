import { tool } from 'ai';
import { z } from 'zod';
import { fetchThings, fetchCreators } from '@/lib/metabase';
import { renderTheBuild } from '@/lib/templates/the-build';
import { renderCreatorSpotlight } from '@/lib/templates/creator-spotlight';
import { sendTestEmail, createSingleSend, scheduleSend } from '@/lib/sendgrid';
import { BANNERS, SEGMENTS } from '@/lib/config';
import type { Thing, Creator } from '@/lib/types';

export const newsletterTools = {
  pullThingData: tool({
    description:
      'Pull data for Thingiverse things from the database. Takes thing IDs (numbers). Returns name, creator, stats, image path for each thing.',
    inputSchema: z.object({
      thingIds: z
        .array(z.number())
        .describe('Thing IDs to fetch, e.g. [7340214, 531244]'),
    }),
    execute: async ({ thingIds }: { thingIds: number[] }) => {
      const things = await fetchThings(thingIds);
      return { things };
    },
  }),

  pullCreatorData: tool({
    description:
      'Pull data for Thingiverse creators from the database. Takes usernames. Returns name, bio, avatar, top designs.',
    inputSchema: z.object({
      usernames: z
        .array(z.string())
        .describe('Creator usernames to fetch'),
    }),
    execute: async ({ usernames }: { usernames: string[] }) => {
      const creators = await fetchCreators(usernames);
      return { creators };
    },
  }),

  renderNewsletter: tool({
    description:
      'Render a newsletter email to HTML. For The Build: pass things array with descriptions filled in. For Creator Spotlight: pass creators array with taglines and bios.',
    inputSchema: z.object({
      type: z.enum(['the-build', 'creator-spotlight']),
      introText: z
        .string()
        .optional()
        .describe('Custom intro paragraph for The Build'),
      things: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            description: z.string().describe('Editorial description you wrote'),
            likeCount: z.number(),
            collectCount: z.number(),
            commentCount: z.number(),
            imagePath: z.string().nullable(),
            secondaryImages: z.array(z.string()),
            creator: z.object({
              username: z.string(),
              firstName: z.string(),
              lastName: z.string(),
            }),
          })
        )
        .optional(),
      creators: z
        .array(
          z.object({
            id: z.number(),
            username: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            bio: z.string().describe('Editorial bio you wrote'),
            tagline: z.string().describe('Short tagline you wrote'),
            avatarPath: z.string().nullable(),
            designs: z.array(
              z.object({
                id: z.number(),
                name: z.string(),
                likeCount: z.number(),
                collectCount: z.number(),
                commentCount: z.number(),
                imagePath: z.string().nullable(),
              })
            ),
          })
        )
        .optional(),
    }),
    execute: async ({
      type,
      introText,
      things,
      creators,
    }: {
      type: 'the-build' | 'creator-spotlight';
      introText?: string;
      things?: unknown[];
      creators?: unknown[];
    }) => {
      const activeBanners = BANNERS.filter((b) => b.active);
      let html: string;
      if (type === 'the-build' && things) {
        html = renderTheBuild(things as unknown as Thing[], activeBanners, introText);
      } else if (type === 'creator-spotlight' && creators) {
        html = renderCreatorSpotlight(creators as unknown as Creator[], activeBanners);
      } else {
        return {
          error:
            'Invalid parameters: provide things for the-build or creators for creator-spotlight',
        };
      }
      return { html, charCount: html.length };
    },
  }),

  sendTestEmail: tool({
    description:
      'Send a test email to preview the newsletter. Default recipient: rees@thingiverse.com',
    inputSchema: z.object({
      to: z.string().email().describe('Recipient email address'),
      subject: z.string().describe('Email subject line'),
      html: z.string().describe('Full HTML content of the newsletter'),
    }),
    execute: async ({
      to,
      subject,
      html,
    }: {
      to: string;
      subject: string;
      html: string;
    }) => {
      await sendTestEmail(to, subject, html);
      return { success: true, sentTo: to };
    },
  }),

  scheduleNewsletter: tool({
    description:
      'Schedule the newsletter to go out in 3 batches to different segments. Each batch needs a time: "now" for immediate send, or an ISO datetime string.',
    inputSchema: z.object({
      name: z
        .string()
        .max(80)
        .describe(
          'Internal send name (max 80 chars, batch suffix is appended)'
        ),
      subject: z.string().describe('Email subject line'),
      html: z.string().describe('Full HTML content'),
      batch1Time: z
        .string()
        .describe('"now" or ISO datetime like "2026-05-20T17:00:00Z"'),
      batch2Time: z.string().describe('ISO datetime for batch 2'),
      batch3Time: z.string().describe('ISO datetime for batch 3'),
    }),
    execute: async ({
      name,
      subject,
      html,
      batch1Time,
      batch2Time,
      batch3Time,
    }: {
      name: string;
      subject: string;
      html: string;
      batch1Time: string;
      batch2Time: string;
      batch3Time: string;
    }) => {
      const segmentKeys = ['batch1', 'batch2', 'batch3'] as const;
      const times = [batch1Time, batch2Time, batch3Time];
      const results = [];

      for (let i = 0; i < 3; i++) {
        const segmentId = SEGMENTS[segmentKeys[i]];
        const sendName = `${name} - Batch ${i + 1}`;

        const sendId = await createSingleSend(
          sendName,
          subject,
          html,
          segmentId
        );

        if (times[i] === 'now') {
          await scheduleSend(sendId, 'now');
        } else {
          await scheduleSend(sendId, times[i]);
        }

        results.push({
          id: sendId,
          name: sendName,
          scheduledAt: times[i],
        });
      }

      return { sends: results };
    },
  }),
};
