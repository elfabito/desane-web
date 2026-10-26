import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localized = z.object({ es: z.string(), en: z.string() });

const profile = defineCollection({
  loader: file('src/content/profile.yaml'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      fullName: z.string(),
      role: localized,
      location: z.string(),
      photo: image(),
      photoAlt: localized,
      contact: z.object({
        email: z.email(),
        phone: z.string(),
        whatsapp: z.string().regex(/^\d+$/),
        linkedin: z.url(),
        github: z.url(),
      }),
      summary: localized,
      about: z.array(localized).min(1),
      values: z.array(
        z.object({
          icon: z.enum(['strategy', 'professionalism', 'creativity']),
          title: localized,
          text: localized,
        }),
      ),
      skills: z.array(
        z.object({
          label: localized,
          // Plain strings are names that read the same in both languages
          items: z.array(z.union([z.string(), localized])).min(1),
        }),
      ),
      noCodePlatforms: z.array(z.string()).default([]),
      education: z.array(localized).min(1),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: localized,
      stack: z.array(z.string()).min(1),
      description: localized,
      image: image(),
      imageAlt: localized,
      links: z
        .object({
          demo: z.url().optional(),
          github: z.url().optional(),
          youtube: z.url().optional(),
        })
        .default({}),
      order: z.number().int(),
      featured: z.boolean().default(false),
    }),
});

export const designCategories = ['diseno-3d', 'diseno-grafico', 'animaciones'] as const;

const designWorks = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/design-works' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: localized,
      description: localized,
      services: z.array(localized).min(1),
      categories: z.array(z.enum(designCategories)).min(1),
      images: z.array(z.object({ src: image(), alt: localized })).min(1),
      // Defaults to the first gallery image
      cover: image().optional(),
      videos: z.array(z.string().regex(/^[\w-]{11}$/)).default([]),
      order: z.number().int(),
      featured: z.boolean().default(false),
    }),
});

const certificates = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/certificates' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      institution: z.string(),
      // A full date, or just the year when the certificate only states that
      date: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/),
      image: image(),
      verifyUrl: z.url().optional(),
      credentialId: z.string().optional(),
    }),
});

const clientSites = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/client-sites' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        platform: z.enum(['wordpress', 'bubble', 'replit', 'lovable', 'webflow']),
        year: z.number().int(),
        desktop: image().optional(),
        mobile: image().optional(),
        order: z.number().int(),
        visible: z.boolean().default(true),
      })
      .refine((site) => !site.visible || site.desktop || site.mobile, {
        message: 'A visible client site needs a desktop or mobile screenshot',
      }),
});

export const collections = {
  profile,
  projects,
  'design-works': designWorks,
  certificates,
  'client-sites': clientSites,
};
