import type { ImageMetadata } from 'astro';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export async function getProfile() {
  const entry = await getEntry('profile', 'fabian');
  if (!entry) throw new Error('Missing profile entry "fabian" in src/content/profile.yaml');
  return entry.data;
}

const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) =>
  a.data.order - b.data.order;

export async function getProjects() {
  return (await getCollection('projects')).sort(byOrder);
}

export async function getDesignWorks() {
  return (await getCollection('design-works')).sort(byOrder);
}

/** Up to four works marked `featured`, shown on the home page. */
export async function getFeaturedDesignWorks() {
  return (await getDesignWorks()).filter((work) => work.data.featured).slice(0, 4);
}

export async function getClientSites() {
  return (await getCollection('client-sites', ({ data }) => data.visible)).sort(byOrder);
}

export async function getCertificates() {
  // Newest first; ISO dates and bare years compare correctly as strings
  return (await getCollection('certificates')).sort((a, b) => b.data.date.localeCompare(a.data.date));
}

/** Static paths for the design work detail pages, the same in both languages. */
export async function getDesignWorkPaths() {
  return (await getDesignWorks()).map((work) => ({ params: { slug: work.id }, props: { work } }));
}

export const coverOf = (work: CollectionEntry<'design-works'>) =>
  work.data.cover ?? work.data.images[0].src;

/** GIFs only stay animated when served as is: Picture and getImage keep the first frame. */
export const isAnimated = (image: ImageMetadata) => image.format === 'gif';
