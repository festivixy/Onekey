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

// Seed data — written to Firestore once if the collection is empty
const SEED_MEMBERS: Omit<TeamMember, 'id'>[] = [
  {
    name: 'Alex Zhang',
    role: 'General Manager',
    school: 'Fraser Heights Secondary',
    bio: 'Currently a senior at Fraser Heights Secondary School, Alex Zhang is honored to serve as the General Manager of Vanstring and as the Principal Second Violinist. Outside of music, Alex enjoys playing volleyball and basketball, spending time in nature, and reading a wide range of literature. With a strong interest in the sciences, Alex aspires to study biomedicine with the goal of pursuing a career in medicine.',
    instagram: 'https://www.instagram.com/alexzhang_05/',
    image: '/pics/alexzhang.jpg',
    sections: ['leadership'],
    group: 'vanstring',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Curtis Wei',
    role: 'General Manager',
    school: 'Collingwood School',
    bio: "I'm Curtis, a grade 10 student at Collingwood Secondary School. I'm grateful to be serving as one of the founders of Onekey as well as the General Manager of Vanstring. I have a passion for sciences and I waste much of my time preparing for the international science olympiads. In my spare time, I play the piano and conduct research on group theory as well as doing my little engineering projects.",
    instagram: 'https://www.instagram.com/icyz_wx/',
    image: '/pics/curtiswei.jpg',
    sections: ['founders', 'leadership'],
    group: 'onekey',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Jessica Yu',
    role: 'Communications Coordinator',
    school: 'R.C. Palmer Secondary School',
    bio: "Hi, I'm Jessica! I'm super passionate about music and spreading joy through music. As part of the communications team, I help young musicians gain more experience through performances in senior homes. In my spare time, I love to crochet and listen to music!",
    instagram: 'https://www.instagram.com/j.1ca0/',
    image: '/pics/jessicayu.jpg',
    sections: ['communications'],
    group: 'onekey',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Gabrielle Liu',
    role: 'Communications Coordinator',
    school: 'Lord Byng Secondary School',
    bio: 'Gabrielle is a grade 11 student at Lord Byng Secondary School, where she is part of the Byng Arts mini school program for music. Her musical journey began when she was five, and since then, she has competed in, and won numerous music competitions. In addition to performing, Gabrielle shares her passion by teaching violin and piano to students of all ages. She has a strong passion for the arts, especially singing and painting. Alongside her artistic interests, Gabrielle is passionate about science and aspires to pursue a career in dermatology.',
    instagram: 'https://www.instagram.com/gabriel_w.le/',
    image: '/pics/gabbyliu.jpg',
    sections: ['communications'],
    group: 'onekey',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Ethan Xie',
    role: 'Tech & Design',
    school: 'West Point Grey Academy',
    bio: "Hi there! I'm a student entering grade 10, and I'm passionate about music, technology, and engineering. I enjoy creating projects such as building drones. At OneKey, I've volunteered through music, and this year, I've been one of the main developers of this site. I look forward to working with OneKey in the future!",
    instagram: 'https://www.instagram.com/ethanx421/',
    image: '/pics/ethanxie.jpg',
    sections: ['techdesign'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Shane Zhang',
    role: 'Homework Help Coordinator',
    school: 'St Georges School',
    bio: 'Shane is a student entering Grade 10 who is passionate about science, outdoor activities, and history. He also has ample volunteering and tutoring experience. For two years, he has tutored Math and English to younger students both with and outside of Onekey. This year, he took on the role of helping coordinate homework help at Onekey. He has also volunteered with ski school at Grouse Mountain, helping classes of various age groups and abilities. He hopes to further develop his leadership abilities by continuing to participate in the Onekey team.',
    instagram: 'https://www.instagram.com/shanezhang021/',
    image: '/pics/shanezhang.jpg',
    sections: ['coordinators'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Selena Yu',
    role: 'Homework Help Coordinator',
    school: 'Crofton House School',
    bio: "Selena is a Grade 9 student at Crofton House school. She is a part of the executive of Vankey Onekey and serves as the concertmaster of Vanstring, as well as playing as a first violinist of her school's orchestra. Selena loves playing badminton and skiing in the winter.",
    instagram: 'https://www.instagram.com/selena.yxy/',
    image: '/pics/selenayu.jpg',
    sections: ['coordinators', 'concertmasters'],
    concertmasterType: 'concertmaster',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Eliza Sun',
    role: 'Co-Founder',
    school: 'Haverford University',
    bio: "Eliza is one of the co-founders and co-managers at Onekey. She is currently attending university in Philadelphia at Haverford University. One fun fact about her is that she has an extensive collection of stuffed animals, most of which are… jellycat pigs. When she's not performing at senior homes, Eliza enjoys spending her free time participating in robotics and making pottery.",
    instagram: 'https://www.instagram.com/elizasun530/',
    image: '/pics/elizasun.jpg',
    sections: ['founders'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Grace Xu',
    role: 'Co-Founder',
    school: 'University Name',
    bio: 'Grace is a passionate musician and one of the co-founders of OneKey. With an ARCT-level piano background and a love for community, Grace helped create OneKey to connect music students and let others see the joy of sharing music and knowledge. She finds fulfillment in sharing joy through student-led concerts and tutoring to create a meaningful impact. Grace is dedicated to fostering supportive, inspiring spaces where young musicians can grow and support one another.',
    instagram: 'https://www.instagram.com/joyleaf7/',
    image: '/pics/grace.jpg',
    sections: ['founders'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Jack Wang',
    role: 'Co-Founder',
    school: 'Pomona College',
    bio: "Jack is an undergraduate student at Pomona College studying International Relations. He's greatly enjoyed working with the Onekey team and sharing his love for music with seniors and young performers.",
    instagram: 'https://www.instagram.com/jiawei_wang_06/',
    image: '/pics/jiaweiwang.jpg',
    sections: ['founders'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Rachel Xu',
    role: 'Concertmaster',
    school: 'Collingwood School',
    bio: "Hi, I'm Rachel, a grade 10 student at Collingwood school. Ever since beginning my musical journey at the age of 9 with the piano and violin, it has become an integral part of my life that I cannot live without. I am thrilled to be given the opportunity to be the concertmaster of Vanstring and coordinate with senior homes as the communications exec, allowing me to share my passion for the arts to others. In my free time, I enjoy travelling the world, reading new novels, and exploring new fields in both the tech world and biology.",
    instagram: '',
    image: '',
    sections: ['concertmasters', 'communications'],
    group: 'vanstring',
    concertmasterType: 'concertmaster',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    name: 'Johnny Yang',
    role: 'General Manager',
    school: 'Fraser Heights Secondary School',
    bio: "Johnny is a grade 9 student at Fraser Heights Secondary School. He is extremely passionate about music and technology, and enjoys challenging himself through math and science competitions. Johnny wishes to gain leadership experience as a general manager of Vanstring and to help fellow students share their passion for music by coordinating weekly performances with senior homes. Using these skills, his goal is to pursue a career in engineering, where he will be able to bring his ideas into reality. Johnny also enjoys reading in his free time.",
    instagram: '',
    image: '',
    sections: ['leadership'],
    group: 'vanstring',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

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

      // Seed Firestore only on first run (empty collection)
      if (members.length === 0) {
        await Promise.all(SEED_MEMBERS.map(m => apiService.createTeamMember(m)));
        const refreshed = await apiService.getTeamMembers();
        members = (refreshed.data?.members ?? []) as TeamMemberRecord[];
      }

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
