import React, { useState, useMemo, useEffect, useRef } from 'react';
import { photoUrl as P } from '../utils/photoUrl';
import { AnimatePresence, motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useTimelineStore, TimelineEvent } from '../store/timelineStore';
import { apiService } from '../services/firebaseService';
import { useNkPageMotion } from '../components/nocturne/motion';



// ─── Category config (Nocturne tags) ─────────────────────────────────────────
const CAT = {
  performances: { label: 'Performance', style: { color: 'var(--nk-accent-400)', borderColor: 'rgba(124,92,255,0.5)' } },
  homework: { label: 'Homework help', style: { color: 'var(--nk-ink-90)', borderColor: 'rgba(43,39,64,0.55)' } },
  charity: { label: 'Charity', style: { color: 'var(--nk-accent-300)', borderColor: 'rgba(124,92,255,0.5)' } },
  recognition: {
    label: 'Recognition',
    style: { color: 'var(--nk-accent-200)', borderColor: 'rgba(124,92,255,0.7)', background: 'rgba(59,116,232,0.1)' },
  },
} as const;

type CatKey = keyof typeof CAT;
type FilterKey = 'all' | CatKey;

// Permanent events hardcoded into the site — merged with stored events and
// immune to admin-panel edits. Synthetic `__`-prefixed ids hide admin controls.
const BUILTIN_EVENTS: TimelineEvent[] = [
  {
    id: '__builtin_award_2020',
    name: 'Youth Role Model award',
    date: '2020-01-01',
    dateLabel: '2020',
    category: 'recognition',
    description:
      'The four co-founders honoured by CCTV and the Greater Vancouver Parents Association — Vanstring recognized at the same ceremony.',
    photo: P('/pics/onekey_award_2020_stage.jpg'),
    createdAt: new Date().toISOString(),
    createdBy: 'onekey',
  },
];

const UPCOMING_EVENTS: TimelineEvent[] = [
  {
    id: '__upcoming_vanstring_cinema_four_seasons',
    name: 'Cinema and Four Seasons: Vanstring Concert',
    date: '2026-05-23',
    category: 'performances',
    location: 'Roy Barnett Hall, UBC',
    time: '18:00',
    duration: '2.5 hours',
    createdAt: new Date().toISOString(),
    createdBy: 'onekey',
  },
];

const BLANK = {
  name: '', date: '', category: 'performances' as CatKey,
  location: '', time: '', attendees: '', performers: '',
  duration: '', description: '', photo: null as File | null,
};

function safeFormat(dateStr: string, fmt: string): string {
  try { return format(parseISO(dateStr), fmt); }
  catch { return dateStr; }
}

function dateValue(dateStr: string): number {
  const value = parseISO(dateStr).getTime();
  return Number.isNaN(value) ? 0 : value;
}

const TInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`tlm-input ${props.className ?? ''}`} />
);
const TTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`tlm-input resize-none ${props.className ?? ''}`} />
);
const TSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} className={`tlm-input ${props.className ?? ''}`}>{children}</select>
);

// small inline icons (from the design)
const Ic = {
  cal: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>,
  pin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
  clock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  users: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
  award: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>,
  pencil: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>,
  download: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M19 21H5" /></svg>,
};

const adminBtnStyle: React.CSSProperties = {
  width: 26, height: 26, display: 'grid', placeItems: 'center',
  border: '1px solid var(--nk-line-20)', borderRadius: 999, background: '#ffffff',
  color: 'rgba(43,39,64,0.82)', cursor: 'pointer',
};

const yearPill = (year: string, active: boolean): React.CSSProperties => ({
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
  padding: '6px 22px',
  borderRadius: 999,
  border: active ? '1px solid var(--nk-accent)' : '1px solid var(--nk-line-20)',
  color: active ? 'var(--nk-accent-400)' : 'var(--nk-ink-85)',
  background: '#ffffff',
  position: 'relative',
  zIndex: 2,
});

const Timeline: React.FC = () => {
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const { events, addEvent, removeEvent, updateEvent, fetchEvents, isLoading } = useTimelineStore();

  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [expandedId, setExpand] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [photoPreview, setPreview] = useState<string | null>(null);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const canManage = !!(isAuthenticated && user && hasPermission('manage_timeline'));

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  const upcomingEvents = useMemo(() => {
    const merged = [...UPCOMING_EVENTS, ...events];
    const unique = new Map<string, TimelineEvent>();
    merged.forEach(event => unique.set(event.id || `synthetic-${event.name}-${event.date}`, event));
    return Array.from(unique.values())
      .filter(event => dateValue(event.date) >= today)
      .sort((a, b) => dateValue(a.date) - dateValue(b.date));
  }, [events, today]);

  const chronicle = useMemo(() => {
    const historical = [...BUILTIN_EVENTS, ...events].filter(event => dateValue(event.date) < today);
    return historical.sort((a, b) => {
      const d = dateValue(a.date) - dateValue(b.date);
      return sortDir === 'desc' ? -d : d;
    });
  }, [events, today, sortDir]);

  // year groups with a global alternating index for the desktop spine
  const yearGroups = useMemo(() => {
    let gi = 0;
    const map = new Map<string, (TimelineEvent & { _left: boolean })[]>();
    chronicle.forEach(ev => {
      const yr = ev.dateLabel ?? safeFormat(ev.date, 'yyyy');
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)?.push({ ...ev, _left: gi++ % 2 === 0 });
    });
    return Array.from(map.entries()).map(([year, evs]) => ({ year, events: evs }));
  }, [chronicle]);

  const stats = useMemo(() => {
    const all = [...BUILTIN_EVENTS, ...events];
    return {
      total: all.length,
      performances: all.filter(e => e.category === 'performances').length,
      homework: all.filter(e => e.category === 'homework').length,
      charity: all.filter(e => e.category === 'charity').length,
    };
  }, [events]);

  // ── modal helpers (unchanged behaviour) ────────────────────────────────────
  const openAdd = () => { setForm({ ...BLANK }); setPreview(null); setFormError(null); setShowAdd(true); };
  const openEdit = (ev: TimelineEvent) => {
    setForm({
      name: ev.name, date: ev.date, category: ev.category as CatKey,
      location: ev.location ?? '', time: ev.time ?? '',
      attendees: ev.attendees ?? '', performers: ev.performers ?? '',
      duration: ev.duration ?? '', description: ev.description ?? '',
      photo: null,
    });
    setPreview(ev.photo ?? null);
    setFormError(null);
    setEditing(ev);
  };
  const closeModal = () => { setShowAdd(false); setEditing(null); setFormError(null); setSubmitting(false); };
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(p => ({ ...p, photo: file }));
    setPreview(URL.createObjectURL(file));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      let photoUrl: string | null = editing?.photo ?? null;
      if (form.photo) {
        const res = await apiService.uploadImage(form.photo);
        if (res.success && res.data) photoUrl = res.data.filePath;
        else setFormError('Photo upload failed — event saved without new photo.');
      }
      const payload = {
        name: form.name, date: form.date, category: form.category,
        location: form.location || undefined,
        time: form.time || undefined,
        attendees: form.attendees || undefined,
        performers: form.performers || undefined,
        duration: form.duration || undefined,
        description: form.description || undefined,
        photo: photoUrl,
        createdBy: user.id,
      };
      if (editing) await updateEvent(editing.id, payload);
      else await addEvent(payload);
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    await removeEvent(deleteId);
    if (expandedId === deleteId) setExpand(null);
    setDeleteId(null);
  };

  // ── event card (shared desktop / phone) ────────────────────────────────────
  const EventCard: React.FC<{ ev: TimelineEvent; compact?: boolean }> = ({ ev, compact }) => {
    const meta = CAT[ev.category as CatKey] ?? CAT.performances;
    const isExpanded = expandedId === ev.id;
    const isDim = filter !== 'all' && ev.category !== filter;
    const dateShown = ev.dateLabel ?? safeFormat(ev.date, 'MMM d, yyyy');
    return (
      <div className={`nk-ev ${isDim ? 'nk-dim' : ''}`} style={compact ? { padding: 20 } : undefined}>
        {canManage && !ev.id.startsWith('__') && (
          <span className="nk-admin">
            <button aria-label="Edit event" style={adminBtnStyle} onClick={() => openEdit(ev)}>{Ic.pencil}</button>
            <button aria-label="Delete event" style={adminBtnStyle} onClick={() => setDeleteId(ev.id)}>{Ic.trash}</button>
          </span>
        )}
        <span className="nk-tag" style={meta.style}>{meta.label}</span>
        <div style={{ fontFamily: 'var(--nk-serif)', fontSize: compact ? 20 : 24, fontWeight: 700, lineHeight: 1.15 }}>{ev.name}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span className="nk-chip">{dateShown}</span>
          {ev.location && <span className="nk-chip">{Ic.pin}{ev.location}</span>}
          {ev.duration && <span className="nk-chip">{Ic.clock}{ev.duration}</span>}
          {(ev.performers || ev.attendees) && (
            <span className="nk-chip">
              {Ic.users}
              {[ev.performers && `${ev.performers} performers`, ev.attendees && `${ev.attendees} attendees`].filter(Boolean).join(' · ')}
            </span>
          )}
          {ev.category === 'recognition' && <span className="nk-chip">{Ic.award}Public-welfare category</span>}
        </div>
        {ev.photo && (
          <img
            className="nk-plate"
            src={ev.photo}
            alt={ev.name}
            loading="lazy"
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', marginTop: 6 }}
          />
        )}
        {ev.description && (
          <p
            style={{
              fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--nk-ink-85)',
              ...(isExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
            }}
          >
            {ev.description}
          </p>
        )}
        {ev.description && ev.description.length > 120 && (
          <button
            onClick={() => setExpand(isExpanded ? null : ev.id)}
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--nk-accent-400)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    );
  };

  const spineDot = (filled: boolean): React.CSSProperties => ({
    position: 'absolute', left: '50%', top: 34, transform: 'translateX(-50%)',
    width: 11, height: 11, borderRadius: '50%',
    ...(filled
      ? { background: 'var(--nk-accent)', boxShadow: '0 0 0 5px rgba(124,92,255,0.18)' }
      : { border: '1.5px solid var(--nk-accent)', background: '#ffffff' }),
  });

  let dotIndex = 0;

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      {/* masthead: the register */}
      <div className="px-6 pt-10 md:px-16 md:pt-11">
        <div className="flex flex-wrap items-baseline gap-4 md:gap-6" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 22 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>Events &amp; timeline</span>
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--nk-ink-78)' }}>
            2020 — today · {sortDir === 'desc' ? 'newest first' : 'oldest first'}
          </span>
          <span className="md:ml-auto flex flex-wrap items-baseline gap-5 md:gap-8">
            {[
              { n: stats.total, label: 'events' },
              { n: stats.performances, label: 'performances' },
              { n: stats.homework, label: 'tutoring' },
              { n: stats.charity, label: 'charity' },
            ].map(s => (
              <span key={s.label} style={{ fontSize: 12, color: 'var(--nk-ink-78)' }}>
                <b style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, fontSize: 24, color: 'var(--nk-ink)', fontVariantNumeric: 'tabular-nums' }}>{s.n}</b>{' '}
                {s.label}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* upcoming */}
      <div className="nk-fade px-6 pt-10 md:px-16 md:pt-[72px]">
        <div className="flex flex-wrap items-baseline justify-between gap-3" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>Upcoming</h2>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>next on the bill</span>
          </div>
          {canManage && (
            <button className="nk-pill" onClick={openAdd}>+ Add event</button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {upcomingEvents.slice(0, 3).map(ev => {
            const meta = CAT[ev.category as CatKey] ?? CAT.performances;
            return (
              <div key={ev.id} className="nk-ev" style={{ borderColor: 'rgba(124,92,255,0.45)' }}>
                <span className="nk-tag" style={meta.style}>{meta.label}</span>
                <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 24, fontWeight: 700, lineHeight: 1.15 }}>{ev.name}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span className="nk-chip">{Ic.cal}{safeFormat(ev.date, 'EEE, MMM d')}{ev.time ? ` · ${ev.time}` : ''}</span>
                  {ev.location && <span className="nk-chip">{Ic.pin}{ev.location}</span>}
                </div>
                {ev.description && <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--nk-ink-85)' }}>{ev.description}</p>}
              </div>
            );
          })}
          {upcomingEvents.length === 0 && (
            <div
              style={{
                borderRadius: 16, border: '1px dashed rgba(59,52,95,0.18)', padding: '26px 28px',
                display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(43,39,64,0.62)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
              <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 19, fontWeight: 700, color: 'var(--nk-ink-90)' }}>No upcoming events posted yet</div>
              <div style={{ fontSize: 12, color: 'rgba(43,39,64,0.68)' }}>Follow @on3keymusic for announcements</div>
            </div>
          )}
        </div>
      </div>

      {/* sticky filter bar */}
      <div
        className="mt-10 flex items-center gap-2 overflow-x-auto px-6 py-3 md:mt-16 md:gap-[10px] md:px-16 md:py-[18px]"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--nk-line-20)', borderBottom: '1px solid var(--nk-line-20)',
          scrollbarWidth: 'none',
        }}
      >
        {(['all', 'performances', 'homework', 'charity', 'recognition'] as const).map(cat => (
          <button
            key={cat}
            className={`nk-pill ${filter === cat ? 'on' : ''}`}
            style={{ flex: 'none' }}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All events' : CAT[cat].label}
          </button>
        ))}
        <span className="ml-auto hidden md:flex" style={{ border: '1px solid rgba(59,52,95,0.18)', borderRadius: 999, overflow: 'hidden' }}>
          <button
            onClick={() => setSortDir('desc')}
            style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: sortDir === 'desc' ? 'rgba(59,116,232,0.12)' : 'transparent',
              color: sortDir === 'desc' ? 'var(--nk-accent-400)' : 'var(--nk-ink-78)',
            }}
          >
            Newest first
          </button>
          <button
            onClick={() => setSortDir('asc')}
            style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: sortDir === 'asc' ? 'rgba(59,116,232,0.12)' : 'transparent',
              color: sortDir === 'asc' ? 'var(--nk-accent-400)' : 'var(--nk-ink-78)',
            }}
          >
            Oldest first
          </button>
        </span>
      </div>

      {/* loading */}
      {isLoading && chronicle.length <= BUILTIN_EVENTS.length && (
        <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, border: '2px solid var(--nk-line-20)', borderTopColor: 'var(--nk-accent)', borderRadius: '50%', animation: 'ok-spin 0.9s linear infinite' }} />
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--nk-ink-58)' }}>Loading the chronicle…</span>
        </div>
      )}

      {/* chronicle spine — desktop */}
      <div className="hidden md:block" style={{ position: 'relative', padding: '56px 64px 20px' }}>
        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--nk-line-17)' }} />
        {yearGroups.map((group, groupIdx) => (
          <React.Fragment key={group.year}>
            <div style={{ display: 'flex', justifyContent: 'center', margin: groupIdx === 0 ? '0 0 36px' : '36px 0', position: 'relative' }}>
              <span style={yearPill(group.year, groupIdx === 0)}>{group.year}</span>
            </div>
            {group.events.map(ev => {
              const filled = dotIndex++ % 3 === 0;
              return (
                <div key={ev.id} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 1fr', marginBottom: 8 }}>
                  {ev._left ? <EventCard ev={ev} /> : <div />}
                  <div style={{ position: 'relative' }}>
                    <span style={spineDot(filled)} />
                  </div>
                  {ev._left ? <div /> : <EventCard ev={ev} />}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* chronicle — phone rail */}
      <div className="md:hidden" style={{ position: 'relative', padding: '32px 24px 20px 44px' }}>
        <span style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 1, background: 'var(--nk-line-17)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {yearGroups.map((group, groupIdx) => (
            <React.Fragment key={group.year}>
              <span style={{ ...yearPill(group.year, groupIdx === 0), alignSelf: 'flex-start', marginLeft: -30, fontSize: 12, padding: '5px 16px' }}>
                {group.year}
              </span>
              {group.events.map(ev => (
                <div key={ev.id} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -17, top: 26, width: 9, height: 9, borderRadius: '50%', border: '1.5px solid var(--nk-accent)', background: '#ffffff', zIndex: 2 }} />
                  <EventCard ev={ev} compact />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* archive link */}
      <div style={{ textAlign: 'center', padding: '28px 24px 56px' }}>
        <a
          href="https://drive.google.com/drive/u/0/folders/1SASLgBECg8h7-37JtEGAVDpu0_5hwyHZ"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(43,39,64,0.68)', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {Ic.download}View full photo archive on Google Drive
        </a>
      </div>

      {/* ── add / edit modal (dark, unchanged behaviour) ── */}
      <AnimatePresence>
        {(showAdd || editing) && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="w-full max-w-2xl bg-stone-900 border border-white/12 rounded-2xl shadow-2xl"
              initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">{editing ? 'Edit Event' : 'Add New Event'}</h2>
                <button onClick={closeModal} className="p-1.5 rounded-lg text-stone-500 hover:text-white hover:bg-white/10 transition-all">
                  <i className="fas fa-times" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[78vh]">
                <div className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-sm text-red-300">{formError}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="tlm-label">Event Name *</label>
                      <TInput type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Spring Concert at Sunrise Manor" required />
                    </div>
                    <div>
                      <label className="tlm-label">Category *</label>
                      <TSelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as CatKey }))} required>
                        <option value="performances">Performances</option>
                        <option value="homework">Homework Help</option>
                        <option value="charity">Charity Events</option>
                      </TSelect>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="tlm-label">Date *</label>
                      <TInput type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="tlm-label">Time</label>
                      <TInput type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="tlm-label">Location</label>
                      <TInput type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Sunrise Manor, Room 4" />
                    </div>
                    <div>
                      <label className="tlm-label">Duration</label>
                      <TInput type="text" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 hours" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="tlm-label">Attendees</label>
                      <TInput type="text" value={form.attendees} onChange={e => setForm(p => ({ ...p, attendees: e.target.value }))} placeholder="e.g. 45 seniors" />
                    </div>
                    <div>
                      <label className="tlm-label">Performers / Volunteers</label>
                      <TInput type="text" value={form.performers} onChange={e => setForm(p => ({ ...p, performers: e.target.value }))} placeholder="e.g. 8 student volunteers" />
                    </div>
                  </div>
                  <div>
                    <label className="tlm-label">Description</label>
                    <TTextarea rows={6} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tell the story of this event — what happened, who was there, what made it meaningful…" />
                  </div>
                  <div>
                    <label className="tlm-label">Cover Photo</label>
                    <label className="block cursor-pointer">
                      <div className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/12 rounded-xl overflow-hidden transition-all hover:border-white/30 ${photoPreview ? 'h-44' : 'h-28'}`}>
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <i className="fas fa-cloud-upload-alt text-2xl text-stone-600" />
                            <span className="text-xs text-stone-500">Click to choose a cover photo</span>
                          </>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => { setPreview(null); setForm(p => ({ ...p, photo: null })); }}
                        className="mt-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors" disabled={submitting}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                      disabled={submitting}
                    >
                      {submitting
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                        : editing ? 'Update Event' : 'Add Event'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── delete confirmation ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              className="w-full max-w-sm bg-stone-900 border border-white/12 rounded-2xl shadow-2xl p-6"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-400/25 flex items-center justify-center mb-4">
                <i className="fas fa-trash-alt text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Delete this event?</h3>
              <p className="text-sm text-stone-400 mb-6">This cannot be undone. The event will be permanently removed from the chronicle.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
