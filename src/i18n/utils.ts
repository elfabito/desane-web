import { defaultLang, languages, ui, type Lang, type UiKey } from './ui';

export { defaultLang, languages, type Lang };

export const langs = Object.keys(languages) as Lang[];

/** `t('dev.link.demo', { title })` fills `{title}` placeholders in the string. */
export function useTranslations(lang: Lang) {
  return (key: UiKey, vars: Record<string, string> = {}): string =>
    Object.entries(vars).reduce<string>(
      (text, [name, value]) => text.replaceAll(`{${name}}`, value),
      ui[lang][key],
    );
}

// 'projects.count' for the 'projects.count.one' / 'projects.count.other' pair
type PluralKey<K = UiKey> = K extends `${infer Base}.one` ? Base : never;

/** `tn('projects.count', 3)` picks the plural form the language uses for 3 and fills `{count}`. */
export function usePlural(lang: Lang) {
  const t = useTranslations(lang);
  const rules = new Intl.PluralRules(lang);
  return (key: PluralKey, count: number): string =>
    t(`${key}.${rules.select(count) === 'one' ? 'one' : 'other'}`, { count: String(count) });
}

/** Formats `YYYY` as is and `YYYY-MM-DD` as a short month and year. */
export function formatDate(date: string, lang: Lang): string {
  if (/^\d{4}$/.test(date)) return date;
  return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

// Route segments that change with the language; anything else (slugs) stays as is
const segments: Record<string, Record<Lang, string>> = {
  projects: { es: 'proyectos', en: 'projects' },
};

/**
 * Turns a pathname from any language into its equivalent in `target`.
 * `/proyectos/john-deere/` -> `/en/projects/john-deere/` and back.
 */
export function translatePath(pathname: string, target: Lang): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] && parts[0] in languages) parts.shift();

  if (parts[0]) {
    const entry = Object.values(segments).find((s) => Object.values(s).includes(parts[0]));
    if (entry) parts[0] = entry[target];
  }

  const prefix = target === defaultLang ? '' : `/${target}`;
  return parts.length ? `${prefix}/${parts.join('/')}/` : `${prefix}/`;
}

/** Builds a path for `lang` from its Spanish form, e.g. localizePath('/proyectos/', 'en'). */
export const localizePath = (path: string, lang: Lang) => translatePath(path, lang);
