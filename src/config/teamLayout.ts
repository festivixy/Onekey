import { SectionKey } from '../store/teamStore';

export type CardsPerRow = { desktop: number; tablet: number; phone: number };
export type SectionLayout = {
  mode: 'carousel' | 'grid';
  perRow: CardsPerRow;
  size: 'compact' | 'standard' | 'large';
  shape: 'circle' | 'rounded';
};

export interface TeamLayout {
  order: SectionKey[];
  hidden: SectionKey[];
  sections: Partial<Record<SectionKey, SectionLayout>>;
  intro: string;
  ctaText: string;
  ctaLink: string;
}

export const ALL_SECTIONS: SectionKey[] = [
  'founders', 'leadership', 'communications', 'coordinators', 'finance', 'concertmasters', 'techdesign', 'alumni',
];

export const DEFAULT_SECTION_LAYOUT: SectionLayout = {
  mode: 'grid',
  perRow: { desktop: 4, tablet: 3, phone: 1 },
  size: 'standard',
  shape: 'rounded',
};

export const DEFAULT_TEAM_LAYOUT: TeamLayout = {
  order: ALL_SECTIONS,
  hidden: ['alumni', 'finance', 'concertmasters'],
  sections: {},
  intro: '',
  ctaText: 'Take your seat',
  ctaLink: 'mailto:on3keymusic@gmail.com?subject=Joining%20OneKey',
};

const clampRow = (v: unknown, fallback: number, max: number): number => {
  const n = typeof v === 'number' ? Math.round(v) : NaN;
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : fallback;
};

export function sectionLayoutOf(layout: TeamLayout, key: SectionKey): SectionLayout {
  return { ...DEFAULT_SECTION_LAYOUT, ...(layout.sections[key] ?? {}) };
}

/** Coerce an untrusted stored value into a safe TeamLayout. */
export function normalizeTeamLayout(raw: unknown): TeamLayout {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_TEAM_LAYOUT;
  const r = raw as Record<string, unknown>;
  const isSection = (v: unknown): v is SectionKey => typeof v === 'string' && (ALL_SECTIONS as string[]).includes(v);

  const orderRaw = Array.isArray(r.order) ? r.order.filter(isSection) : [];
  const order = [...orderRaw, ...ALL_SECTIONS.filter(s => !orderRaw.includes(s))];
  const hidden = Array.isArray(r.hidden) ? r.hidden.filter(isSection) : DEFAULT_TEAM_LAYOUT.hidden;

  const sections: Partial<Record<SectionKey, SectionLayout>> = {};
  if (r.sections && typeof r.sections === 'object' && !Array.isArray(r.sections)) {
    for (const [key, val] of Object.entries(r.sections as Record<string, unknown>)) {
      if (!isSection(key) || val === null || typeof val !== 'object') continue;
      const v = val as Record<string, unknown>;
      const perRowRaw = (v.perRow ?? {}) as Record<string, unknown>;
      sections[key] = {
        mode: v.mode === 'carousel' ? 'carousel' : 'grid',
        perRow: {
          desktop: clampRow(perRowRaw.desktop, DEFAULT_SECTION_LAYOUT.perRow.desktop, 6),
          tablet: clampRow(perRowRaw.tablet, DEFAULT_SECTION_LAYOUT.perRow.tablet, 4),
          phone: clampRow(perRowRaw.phone, DEFAULT_SECTION_LAYOUT.perRow.phone, 2),
        },
        size: v.size === 'compact' || v.size === 'large' ? v.size : 'standard',
        shape: v.shape === 'circle' ? 'circle' : 'rounded',
      };
    }
  }

  return {
    order,
    hidden,
    sections,
    intro: typeof r.intro === 'string' ? r.intro : '',
    ctaText: typeof r.ctaText === 'string' && r.ctaText ? r.ctaText : DEFAULT_TEAM_LAYOUT.ctaText,
    ctaLink: typeof r.ctaLink === 'string' && r.ctaLink ? r.ctaLink : DEFAULT_TEAM_LAYOUT.ctaLink,
  };
}
