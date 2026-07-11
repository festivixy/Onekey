import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore, TeamMember, SectionKey } from '../../store/teamStore';
import { useTimelineStore } from '../../store/timelineStore';

type LineType = 'input' | 'output' | 'success' | 'error' | 'info' | 'header' | 'dim' | 'warn';
interface Line { id: number; text: string; type: LineType; isPrompt?: boolean }

let _id = 0;
const L = (text: string, type: LineType = 'output', isPrompt = false): Line =>
  ({ id: _id++, text, type, isPrompt });

// ── Quoted-string-aware argument parser ─────────────────────────────────────
function parseArgs(input: string): string[] {
  const args: string[] = [];
  let cur = '', inQ = false, qc = '';
  for (const c of input) {
    if (inQ) { if (c === qc) { inQ = false; if (cur) { args.push(cur); cur = ''; } } else cur += c; }
    else if (c === '"' || c === "'") { inQ = true; qc = c; }
    else if (c === ' ') { if (cur) { args.push(cur); cur = ''; } }
    else cur += c;
  }
  if (cur) args.push(cur);
  return args;
}

const SECTIONS: SectionKey[] =
  ['founders','leadership','communications','coordinators','finance','concertmasters','techdesign','alumni'];

const BANNER: Line[] = [
  L('┌──────────────────────────────────────────────────────┐', 'dim'),
  L('│  OneKey Admin Terminal  v2.0                         │', 'info'),
  L('│  Full team management via command line               │', 'dim'),
  L('│  type "help" for all commands                        │', 'dim'),
  L('└──────────────────────────────────────────────────────┘', 'dim'),
  L('', 'output'),
];

// ── Wizard state ────────────────────────────────────────────────────────────
interface WizardStep {
  key: string;
  label: string;
  optional?: boolean;
  options?: string[];
  skipIf?: (d: Record<string, string>) => boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  { key: 'name',     label: 'Full name' },
  { key: 'role',     label: 'Title/position (e.g. Co-Founder, Violin)' },
  { key: 'school',   label: 'School/university' },
  { key: 'sections', label: `Sections — comma-separated (${SECTIONS.join('|')})` },
  { key: 'group',    label: 'Group (onekey|vanstring)', optional: true, options: ['onekey','vanstring'],
    skipIf: d => !d.sections?.includes('leadership') && !d.sections?.includes('communications') },
  { key: 'cm_type',  label: 'Concertmaster type (concertmaster|principal_second)', optional: true,
    options: ['concertmaster','principal_second'],
    skipIf: d => !d.sections?.includes('concertmasters') },
  { key: 'bio',      label: 'Bio (wrap in quotes if it has spaces, or just type freely)' },
  { key: 'instagram',label: 'Instagram URL', optional: true },
];

interface WizardState { step: number; data: Record<string, string> }
type Mode =
  | { type: 'normal' }
  | { type: 'confirm'; onYes: () => void }
  | { type: 'wizard'; wizard: WizardState };

// ── Find member helper ───────────────────────────────────────────────────────
function findMember(query: string): TeamMember | undefined {
  const q = query.toLowerCase();
  const members = useTeamStore.getState().teamMembers;
  return members.find(m => m.name.toLowerCase().includes(q));
}

const AdminTerminal: React.FC = () => {
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [mode, setMode] = useState<Mode>({ type: 'normal' });
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; }, 20);
  }, [lines]);

  const push = useCallback((...ls: Line[]) => setLines(prev => [...prev, ...ls]), []);

  // ── Wizard helpers ─────────────────────────────────────────────────────────
  const wizardPrompt = (wizard: WizardState) => {
    let step = wizard.step;
    while (step < WIZARD_STEPS.length && WIZARD_STEPS[step].skipIf?.(wizard.data)) step++;
    if (step >= WIZARD_STEPS.length) return null;
    const s = WIZARD_STEPS[step];
    return `${s.label}${s.optional ? ' (optional, enter to skip)' : ''} > `;
  };

  const advanceWizard = async (wizard: WizardState, value: string) => {
    let step = wizard.step;
    while (step < WIZARD_STEPS.length && WIZARD_STEPS[step].skipIf?.(wizard.data)) step++;
    const currentStep = WIZARD_STEPS[step];
    if (!currentStep) return;

    const data = { ...wizard.data };

    // Validate options
    if (value && currentStep.options && !currentStep.options.includes(value)) {
      push(L(`invalid value. options: ${currentStep.options.join(' | ')}`, 'error'));
      setMode({ type: 'wizard', wizard: { ...wizard, step } });
      return;
    }
    // Required check
    if (!value && !currentStep.optional) {
      push(L('this field is required', 'error'));
      setMode({ type: 'wizard', wizard: { ...wizard, step } });
      return;
    }

    data[currentStep.key] = value;

    // Find next non-skipped step
    let nextStep = step + 1;
    while (nextStep < WIZARD_STEPS.length && WIZARD_STEPS[nextStep].skipIf?.(data)) nextStep++;

    if (nextStep < WIZARD_STEPS.length) {
      const newWizard = { step: nextStep, data };
      const prompt = wizardPrompt(newWizard);
      if (prompt) push(L(prompt, 'info', true));
      setMode({ type: 'wizard', wizard: newWizard });
    } else {
      // All steps done — create member
      setMode({ type: 'normal' });
      push(L('', 'output'), L('creating member…', 'dim'));
      const parsedSections = (data.sections ?? '').split(',').map(s => s.trim()).filter(s => SECTIONS.includes(s as SectionKey)) as SectionKey[];
      const payload: Partial<TeamMember> = {
        name: data.name,
        role: data.role,
        school: data.school,
        bio: data.bio || '',
        instagram: data.instagram || '',
        image: '',
        sections: parsedSections.length ? parsedSections : ['leadership'],
        group: (data.group as 'onekey' | 'vanstring' | undefined) || undefined,
        concertmasterType: (data.cm_type as TeamMember['concertmasterType']) || undefined,
        isActive: true,
      };
      const result = await useTeamStore.getState().addTeamMember(payload as Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>);
      if (result) push(L(`✓ ${data.name} added successfully`, 'success'));
      else push(L(`failed: ${useTeamStore.getState().error || 'unknown error'}`, 'error'));
    }
  };

  // ── Main execute ─────────────────────────────────────────────────────────
  const execute = useCallback(async (raw: string) => {
    const val = raw.trim();

    // Wizard mode
    if (mode.type === 'wizard') {
      push(L(val, 'input'));
      await advanceWizard(mode.wizard, val);
      return;
    }

    // Confirm mode
    if (mode.type === 'confirm') {
      push(L(val, 'input'));
      const { onYes } = mode;
      setMode({ type: 'normal' });
      if (val.toLowerCase() === 'y' || val.toLowerCase() === 'yes') await onYes();
      else push(L('cancelled.', 'warn'));
      return;
    }

    if (!val) return;
    push(L(val, 'input'));
    setCmdHistory(h => [val, ...h.slice(0, 99)]);
    setHistIdx(-1);

    const args = parseArgs(val);
    const verb = args[0]?.toLowerCase();

    // ── clear ──────────────────────────────────────────────────────────────
    if (verb === 'clear') { setLines(BANNER); return; }

    // ── help ──────────────────────────────────────────────────────────────
    if (verb === 'help') {
      push(
        L('', 'output'),
        L('TEAM MANAGEMENT', 'header'),
        L('  ls team [section] [--all|--hidden]   list members', 'output'),
        L('  info <name>                          detailed member view', 'output'),
        L('  new member                           interactive creation wizard', 'output'),
        L('  set name <name> <new-name>           rename member', 'output'),
        L('  set title <name> <title>             change position/title', 'output'),
        L('  set school <name> <school>           change school', 'output'),
        L('  set bio <name> "<bio text>"          update bio', 'output'),
        L('  set instagram <name> <url>           set instagram url', 'output'),
        L('  set section <name> <section>         replace sections with one section', 'output'),
        L('  add section <name> <section>         add to sections list', 'output'),
        L('  rm section <name> <section>          remove from sections list', 'output'),
        L('  set group <name> <onekey|vanstring>  set group', 'output'),
        L('  set cm-type <name> <type>            set concertmaster type', 'output'),
        L('  hide <name>                          hide from site', 'output'),
        L('  show <name>                          unhide', 'output'),
        L('  delete member <name>                 permanently delete', 'output'),
        L('', 'output'),
        L('USER MANAGEMENT', 'header'),
        L('  ls users [role]                      list users', 'output'),
        L('  set role <email> <admin|user>        change user role', 'output'),
        L('', 'output'),
        L('OTHER', 'header'),
        L('  ls events                            list timeline events', 'output'),
        L('  reload                               refresh data from Firestore', 'output'),
        L('  whoami                               current session', 'output'),
        L('  clear                                clear output', 'output'),
        L('', 'output'),
        L('Wrap values with spaces in "quotes". Name matching is partial.', 'dim'),
        L('', 'output'),
      );
      return;
    }

    // ── whoami ─────────────────────────────────────────────────────────────
    if (verb === 'whoami') {
      const u = useAuthStore.getState().user;
      if (!u) { push(L('not authenticated', 'error')); return; }
      push(L(`email  : ${u.email}`, 'output'), L(`role   : ${u.role}`, 'output'), L(`id     : ${u.id}`, 'dim'));
      return;
    }

    // ── reload ─────────────────────────────────────────────────────────────
    if (verb === 'reload') {
      push(L('fetching…', 'dim'));
      await Promise.all([
        useAuthStore.getState().fetchUsers(),
        useTeamStore.getState().fetchTeamMembers(),
        useTimelineStore.getState().fetchEvents(),
      ]);
      push(L('✓ data refreshed', 'success'));
      return;
    }

    // ── new member (wizard) ────────────────────────────────────────────────
    if (verb === 'new' && args[1]?.toLowerCase() === 'member') {
      push(L('', 'output'), L('Starting member creation wizard…', 'info'), L('(press Enter to skip optional fields)', 'dim'), L('', 'output'));
      const wizard: WizardState = { step: 0, data: {} };
      const prompt = wizardPrompt(wizard);
      if (prompt) push(L(prompt, 'info', true));
      setMode({ type: 'wizard', wizard });
      return;
    }

    // ── info ───────────────────────────────────────────────────────────────
    if (verb === 'info') {
      const query = args.slice(1).join(' ');
      if (!query) { push(L('usage: info <name>', 'error')); return; }
      const m = findMember(query);
      if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
      const sep = '─'.repeat(54);
      push(
        L('', 'output'),
        L(sep, 'dim'),
        L(`NAME       : ${m.name}`, 'output'),
        L(`TITLE      : ${m.role}`, 'output'),
        L(`SCHOOL     : ${m.school}`, 'output'),
        L(`SECTIONS   : ${(m.sections ?? []).join(', ')}`, 'output'),
        L(`GROUP      : ${m.group ?? '—'}`, 'output'),
        L(`CM TYPE    : ${m.concertmasterType ?? '—'}`, 'output'),
        L(`VISIBLE    : ${m.isActive ? 'yes' : 'no'}`, m.isActive ? 'output' : 'warn'),
        L(`INSTAGRAM  : ${m.instagram || '—'}`, 'output'),
        L(`ID         : ${m.id}`, 'dim'),
        L(`BIO        :`, 'output'),
        ...(m.bio ? m.bio.match(/.{1,60}/g)?.map(chunk => L(`  ${chunk}`, 'output')) ?? [] : [L('  —', 'dim')]),
        L(sep, 'dim'),
        L('', 'output'),
      );
      return;
    }

    // ── ls ─────────────────────────────────────────────────────────────────
    if (verb === 'ls') {
      const sub = args[1]?.toLowerCase();

      if (sub === 'team') {
        const { teamMembers } = useTeamStore.getState();
        const flags = args.filter(a => a.startsWith('--'));
        const showAll  = flags.includes('--all');
        const showHidden = flags.includes('--hidden');
        const sectionArg = args.find(a => !a.startsWith('--') && a !== 'ls' && a !== 'team');
        let list = teamMembers;
        if (showHidden) list = list.filter(m => !m.isActive);
        else if (!showAll) list = list.filter(m => m.isActive);
        if (sectionArg && SECTIONS.includes(sectionArg as SectionKey)) list = list.filter(m => m.sections?.includes(sectionArg as SectionKey));
        if (!list.length) { push(L('no members found', 'warn')); return; }
        push(
          L('', 'output'),
          L(`${'NAME'.padEnd(24)}${'SECTIONS'.padEnd(22)}${'GROUP'.padEnd(12)}${'VISIBLE'.padEnd(9)}TITLE`, 'header'),
          L('─'.repeat(84), 'dim'),
          ...list.map(m => L(
            `${m.name.padEnd(24)}${(m.sections ?? []).join(',').padEnd(22)}${(m.group ?? '—').padEnd(12)}${(m.isActive ? 'yes' : 'no').padEnd(9)}${m.role}`,
            m.isActive ? 'output' : 'dim',
          )),
          L('', 'output'),
        );
        return;
      }

      if (sub === 'users') {
        const { users } = useAuthStore.getState();
        const roleArg = args[2];
        const list = roleArg ? users.filter(u => u.role === roleArg) : users;
        if (!list.length) { push(L('no users found', 'warn')); return; }
        push(
          L('', 'output'),
          L(`${'EMAIL'.padEnd(36)}${'ROLE'.padEnd(14)}STATUS`, 'header'),
          L('─'.repeat(60), 'dim'),
          ...list.map(u => L(`${u.email.padEnd(36)}${u.role.padEnd(14)}${u.isActive ? 'active' : 'inactive'}`, u.isActive ? 'output' : 'dim')),
          L('', 'output'),
        );
        return;
      }

      if (sub === 'events') {
        const { events } = useTimelineStore.getState();
        if (!events.length) { push(L('no events found', 'warn')); return; }
        push(
          L('', 'output'),
          L(`${'DATE'.padEnd(14)}${'CATEGORY'.padEnd(16)}NAME`, 'header'),
          L('─'.repeat(60), 'dim'),
          ...events.map(e => L(`${e.date.slice(0, 10).padEnd(14)}${e.category.padEnd(16)}${e.name}`, 'output')),
          L('', 'output'),
        );
        return;
      }

      push(L(`unknown: ls ${sub ?? ''}. try: ls team | ls users | ls events`, 'error'));
      return;
    }

    // ── set (multi-purpose) ────────────────────────────────────────────────
    if (verb === 'set') {
      const field = args[1]?.toLowerCase();

      // set role <email> <role> — user role
      if (field === 'role' && args[2]?.includes('@')) {
        const email = args[2], role = args[3];
        if (!email || !role) { push(L('usage: set role <email> <admin|user>', 'error')); return; }
        if (!['admin', 'user'].includes(role)) { push(L('role must be admin or user', 'error')); return; }
        const { users, updateUserRole } = useAuthStore.getState();
        const target = users.find(u => u.email === email);
        if (!target) { push(L(`user not found: ${email}`, 'error')); return; }
        push(L(`setting ${email} → ${role}…`, 'dim'));
        const ok = await updateUserRole(target.id, role);
        push(ok ? L(`✓ ${email} is now ${role}`, 'success') : L(`failed: ${useAuthStore.getState().error}`, 'error'));
        return;
      }

      // Team member field setters — args: set <field> <name-query> <value...>
      const TEAM_FIELDS: Record<string, string> = {
        name: 'name', title: 'role', school: 'school', bio: 'bio',
        instagram: 'instagram', group: 'group',
        'cm-type': 'concertmasterType',
      };

      // set section <name> <section> — replaces sections[] with a single section
      if (field === 'section' || field === 'sections') {
        const query = args[2];
        const value = args[3] as SectionKey;
        if (!query || !value) { push(L('usage: set section <name> <section>', 'error')); return; }
        if (!SECTIONS.includes(value)) { push(L(`invalid section. options: ${SECTIONS.join(' | ')}`, 'error')); return; }
        const m = findMember(query);
        if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
        push(L(`updating ${m.name}…`, 'dim'));
        const ok = await useTeamStore.getState().updateTeamMember(m.id, { sections: [value] } as Partial<Omit<TeamMember, 'id' | 'createdAt'>>);
        push(ok ? L(`✓ ${m.name}: sections → [${value}]`, 'success') : L(`failed: ${useTeamStore.getState().error}`, 'error'));
        return;
      }

      if (field && field in TEAM_FIELDS) {
        const query = args[2];
        const value = args.slice(3).join(' ');
        if (!query || !value) { push(L(`usage: set ${field} <name> <value>`, 'error')); return; }
        const m = findMember(query);
        if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }

        if (field === 'group' && !['onekey', 'vanstring'].includes(value)) {
          push(L('group must be onekey or vanstring', 'error')); return;
        }
        if (field === 'cm-type' && !['concertmaster','principal_second'].includes(value)) {
          push(L('type must be concertmaster | principal_second', 'error')); return;
        }

        push(L(`updating ${m.name}…`, 'dim'));
        const dbField = TEAM_FIELDS[field];
        const ok = await useTeamStore.getState().updateTeamMember(m.id, { [dbField]: value } as Partial<Omit<TeamMember, 'id' | 'createdAt'>>);
        push(ok ? L(`✓ ${m.name}: ${field} → ${value}`, 'success') : L(`failed: ${useTeamStore.getState().error}`, 'error'));
        return;
      }

      push(L(`unknown field: ${field}. type "help" for set commands`, 'error'));
      return;
    }

    // ── add section ────────────────────────────────────────────────────────
    if (verb === 'add' && args[1]?.toLowerCase() === 'section') {
      const query = args[2], section = args[3] as SectionKey;
      if (!query || !section) { push(L('usage: add section <name> <section>', 'error')); return; }
      if (!SECTIONS.includes(section)) { push(L(`invalid section. options: ${SECTIONS.join(' | ')}`, 'error')); return; }
      const m = findMember(query);
      if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
      const sections = Array.from(new Set([...(m.sections ?? []), section]));
      const ok = await useTeamStore.getState().updateTeamMember(m.id, { sections } as Partial<Omit<TeamMember, 'id' | 'createdAt'>>);
      push(ok ? L(`✓ ${m.name}: added to ${section}`, 'success') : L(`failed: ${useTeamStore.getState().error}`, 'error'));
      return;
    }

    // ── rm section ─────────────────────────────────────────────────────────
    if (verb === 'rm' && args[1]?.toLowerCase() === 'section') {
      const query = args[2], section = args[3] as SectionKey;
      if (!query || !section) { push(L('usage: rm section <name> <section>', 'error')); return; }
      const m = findMember(query);
      if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
      const sections = (m.sections ?? []).filter(s => s !== section);
      if (!sections.length) { push(L('cannot remove last section — member must belong to at least one', 'error')); return; }
      const ok = await useTeamStore.getState().updateTeamMember(m.id, { sections } as Partial<Omit<TeamMember, 'id' | 'createdAt'>>);
      push(ok ? L(`✓ ${m.name}: removed from ${section}`, 'success') : L(`failed: ${useTeamStore.getState().error}`, 'error'));
      return;
    }

    // ── hide / show ────────────────────────────────────────────────────────
    if (verb === 'hide' || verb === 'show') {
      const query = args.slice(1).join(' ');
      if (!query) { push(L(`usage: ${verb} <name>`, 'error')); return; }
      const m = findMember(query);
      if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
      const active = verb === 'show';
      await useTeamStore.getState().updateTeamMember(m.id, { isActive: active });
      push(L(`✓ ${m.name} → ${active ? 'visible' : 'hidden'}`, 'success'));
      return;
    }

    // ── delete member ──────────────────────────────────────────────────────
    if (verb === 'delete' && args[1]?.toLowerCase() === 'member') {
      const query = args.slice(2).join(' ');
      if (!query) { push(L('usage: delete member <name>', 'error')); return; }
      const m = findMember(query);
      if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
      push(L(`permanently delete "${m.name}"? (y/n)`, 'warn'));
      setMode({ type: 'confirm', onYes: async () => {
        await useTeamStore.getState().removeTeamMember(m.id);
        push(L(`✓ deleted ${m.name}`, 'success'));
      }});
      return;
    }

    // ── delete team (legacy alias) ────────────────────────────────────────
    if (verb === 'delete' && args[1]?.toLowerCase() === 'team') {
      const query = args.slice(2).join(' ');
      if (!query) { push(L('usage: delete team <name>', 'error')); return; }
      const m = findMember(query);
      if (!m) { push(L(`no member matching: ${query}`, 'error')); return; }
      push(L(`permanently delete "${m.name}"? (y/n)`, 'warn'));
      setMode({ type: 'confirm', onYes: async () => {
        await useTeamStore.getState().removeTeamMember(m.id);
        push(L(`✓ deleted ${m.name}`, 'success'));
      }});
      return;
    }

    push(L(`command not found: ${verb}`, 'error'), L('type "help" for available commands', 'dim'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, push]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = input;
      setInput('');
      execute(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : cmdHistory[next]);
    }
  };

  const promptLabel =
    mode.type === 'confirm' ? '(y/n) ❯ ' :
    mode.type === 'wizard'  ? '' :
    'admin@onekey ❯ ';

  return (
    <div className="admin-terminal" onClick={() => inputRef.current?.focus()}>
      <div className="admin-terminal__bar">
        <span className="admin-terminal__dot" />
        <span className="admin-terminal__dot" />
        <span className="admin-terminal__dot" />
        <span className="admin-terminal__bar-title">admin terminal — onekey</span>
      </div>

      <div className="admin-terminal__output" ref={outputRef}>
        {lines.map(l => (
          <div key={l.id} className={`admin-terminal__line admin-terminal__line--${l.type}`}>
            {l.type === 'input' && <span className="admin-terminal__prompt-span">admin@onekey ❯ </span>}
            {l.text}
          </div>
        ))}
      </div>

      <div className="admin-terminal__input-row">
        <span className="admin-terminal__prompt-label">{promptLabel}</span>
        <input
          ref={inputRef}
          className="admin-terminal__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default AdminTerminal;
