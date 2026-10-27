import type { APIRoute, GetStaticPaths } from 'astro';
import { designCategories } from '../../../content.config';
import { coverOf, getDesignWorks, getFeaturedDesignWorks, getProfile } from '../../../lib/content';
import { renderSocialCard, type SocialCard } from '../../../lib/social-card';
import { langs, useTranslations } from '../../../i18n/utils';

// One share image per page and language, named as BaseLayout's `card` prop
export const getStaticPaths = (async () => {
  const profile = await getProfile();
  const works = await getDesignWorks();
  const featured = await getFeaturedDesignWorks();

  return langs.flatMap((lang) => {
    const t = useTranslations(lang);
    const cards: [string, SocialCard][] = [
      [
        'index',
        {
          title: profile.name,
          lines: [profile.role[lang], profile.location],
          visual: { kind: 'photo', image: profile.photo },
        },
      ],
      [
        'proyectos',
        {
          title: t('projects.title'),
          lines: [profile.name, designCategories.map((category) => t(`projects.category.${category}`)).join(' · ')],
          visual: { kind: 'collage', images: featured.map(coverOf) },
        },
      ],
      ...works.map((work): [string, SocialCard] => [
        work.id,
        {
          eyebrow: work.data.subtitle[lang],
          title: work.data.title,
          lines: [work.data.services.map((service) => service[lang]).join(' · '), profile.name],
          visual: { kind: 'cover', image: coverOf(work) },
        },
      ]),
    ];
    return cards.map(([card, props]) => ({ params: { lang, card }, props }));
  });
}) satisfies GetStaticPaths;

export const GET: APIRoute<SocialCard> = async ({ props }) =>
  new Response(await renderSocialCard(props), { headers: { 'Content-Type': 'image/jpeg' } });
