import { create } from 'zustand';
import { apiService } from '../services/firebaseService';

export type SectionKey = 'founders' | 'leadership' | 'communications' | 'coordinators' | 'finance' | 'concertmasters' | 'techdesign' | 'alumni';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  school: string;
  bio: string;
  instagram: string;
  image: string;
  sections: SectionKey[];
  group?: 'onekey' | 'vanstring';
  concertmasterType?: 'concertmaster' | 'principal_second';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SECTION_KEYS: SectionKey[] = ['founders', 'leadership', 'communications', 'coordinators', 'finance', 'concertmasters', 'techdesign', 'alumni'];

type TeamMemberRecord = Record<string, unknown> & {
  id?: unknown;
  section?: unknown;
  extraSections?: unknown;
  sections?: unknown;
};

const isSectionKey = (value: unknown): value is SectionKey =>
  typeof value === 'string' && SECTION_KEYS.includes(value as SectionKey);

const stringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const optionalGroup = (value: unknown): TeamMember['group'] =>
  value === 'onekey' || value === 'vanstring' ? value : undefined;

const optionalConcertmasterType = (value: unknown): TeamMember['concertmasterType'] =>
  value === 'concertmaster' || value === 'principal_second' ? value : undefined;

const normalizeSections = (member: TeamMemberRecord): SectionKey[] => {
  if (Array.isArray(member.sections)) {
    return member.sections.filter(isSectionKey);
  }

  const legacySections = [
    member.section,
    ...(Array.isArray(member.extraSections) ? member.extraSections : []),
  ].filter(isSectionKey);

  return legacySections.length > 0 ? legacySections : ['leadership'];
};

const normalizeTeamMember = (member: TeamMemberRecord): TeamMember => ({
  id: stringValue(member.id),
  name: stringValue(member.name),
  role: stringValue(member.role),
  school: stringValue(member.school),
  bio: stringValue(member.bio),
  instagram: stringValue(member.instagram),
  image: stringValue(member.image),
  sections: normalizeSections(member),
  group: optionalGroup(member.group),
  concertmasterType: optionalConcertmasterType(member.concertmasterType),
  isActive: typeof member.isActive === 'boolean' ? member.isActive : true,
  createdAt: stringValue(member.createdAt, new Date().toISOString()),
  updatedAt: stringValue(member.updatedAt, new Date().toISOString()),
});


// Founders promoted to the top-of-page Founders section (matched by display name)
const FOUNDER_NAMES = new Set(['Curtis Wei', 'Eliza Sun', 'Grace Xu', 'Jack Wang']);

interface TeamState {
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
  fetchTeamMembers: () => Promise<void>;
  addTeamMember: (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => Promise<TeamMember | null>;
  updateTeamMember: (id: string, updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>) => Promise<boolean>;
  removeTeamMember: (id: string) => Promise<boolean>;
  getTeamMembersBySection: (section: SectionKey) => TeamMember[];
  getTeamMembersBySectionAndGroup: (section: SectionKey, group: 'onekey' | 'vanstring') => TeamMember[];
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  teamMembers: [],
  isLoading: false,
  error: null,

  fetchTeamMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiService.getTeamMembers();
      if (!res.success || !res.data) {
        set({ isLoading: false, error: res.error ?? 'Failed to fetch team' });
        return;
      }

      let members = res.data.members as TeamMemberRecord[];

      // Migrate old schema (section + extraSections) → sections[]
      const toMigrate = members.filter(m => !Array.isArray(m.sections) && m.section);
      if (toMigrate.length > 0) {
        await Promise.all(toMigrate.map(m => {
          const sections = normalizeSections(m);
          return apiService.updateTeamMember(stringValue(m.id), { sections });
        }));
        toMigrate.forEach(m => {
          m.sections = normalizeSections(m);
        });
      }

      // Promote the four founders → add 'founders', drop 'alumni' (one-time, idempotent, matched by name)
      const foundersToMigrate = members.filter(m => {
        if (!FOUNDER_NAMES.has(stringValue(m.name))) return false;
        const current = normalizeSections(m);
        return !current.includes('founders') || current.includes('alumni');
      });
      if (foundersToMigrate.length > 0) {
        await Promise.all(foundersToMigrate.map(m => {
          const next: SectionKey[] = Array.from(
            new Set<SectionKey>([...normalizeSections(m).filter(s => s !== 'alumni'), 'founders'])
          );
          m.sections = next;
          return apiService.updateTeamMember(stringValue(m.id), { sections: next });
        }));
      }

      set({ teamMembers: members.map(normalizeTeamMember).filter(m => m.isActive !== false), isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'An error occurred' });
    }
  },

  addTeamMember: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiService.createTeamMember({ ...data, isActive: true });
      if (!res.success || !res.data) {
        set({ isLoading: false, error: res.error ?? 'Failed to add member' });
        return null;
      }
      await get().fetchTeamMembers();
      const newId = res.data?.id;
      return newId ? get().teamMembers.find(m => m.id === newId) ?? null : null;
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'An error occurred' });
      return null;
    }
  },

  updateTeamMember: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiService.updateTeamMember(id, updates);
      if (!res.success) {
        set({ isLoading: false, error: res.error ?? 'Failed to update member' });
        return false;
      }
      await get().fetchTeamMembers();
      return true;
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'An error occurred' });
      return false;
    }
  },

  removeTeamMember: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiService.deleteTeamMember(id);
      if (!res.success) {
        set({ isLoading: false, error: res.error ?? 'Failed to delete member' });
        return false;
      }
      await get().fetchTeamMembers();
      return true;
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'An error occurred' });
      return false;
    }
  },

  getTeamMembersBySection: (section) => {
    const CONCERTMASTER_RANK: Record<string, number> = {
      concertmaster: 0, principal_second: 1,
    };
    return get().teamMembers
      .filter(m => m.isActive !== false && m.sections?.includes(section))
      .sort((a, b) => {
        if (section !== 'concertmasters') return 0;
        return (CONCERTMASTER_RANK[a.concertmasterType ?? ''] ?? 99) - (CONCERTMASTER_RANK[b.concertmasterType ?? ''] ?? 99);
      });
  },

  getTeamMembersBySectionAndGroup: (section, group) =>
    get().teamMembers.filter(m => {
      if (m.isActive === false || !m.sections?.includes(section)) return false;
      const g = m.group ?? 'onekey';
      return group === 'onekey' ? g === 'onekey' : g === 'vanstring';
    }),
}));
