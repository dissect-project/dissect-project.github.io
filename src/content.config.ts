import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const optionalUrl = z.union([z.url(), z.literal('')]).optional();

const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      photo: image().optional(),
      bibNames: z.array(z.string()).optional(),
      order: z.number().default(100),
      alumni: z.boolean().default(false),
      links: z
        .object({
          email: z.union([z.email(), z.literal('')]).optional(),
          orcid: optionalUrl,
          scholar: optionalUrl,
          github: optionalUrl,
          linkedin: optionalUrl,
          website: optionalUrl,
        })
        .default({}),
    }),
});

export const collections = { team };
