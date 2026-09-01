import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeamStore, TeamMember, SectionKey } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/firebaseService';
import { resolveTeamImageSrc } from '../utils/teamImageUrl';
import { useNkPageMotion } from '../components/nocturne/motion';
import { DEFAULT_TEAM_LAYOUT, TeamLayout, SectionLayout, normalizeTeamLayout, sectionLayoutOf } from '../config/teamLayout';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

export const SECTION_LABELS: Record<SectionKey, string> = {
  founders: 'Founders',
  leadership: 'Leadership',
  communications: 'Senior Home Communications',
  coordinators: 'Homework Help Coordinators',
  finance: 'Finance',
  concertmasters: 'Concertmasters',
  techdesign: 'Tech & Design',
  alumni: 'Alumni',
};

const SECTION_SUBTITLES: Partial<Record<SectionKey, string>> = {
  founders: 'the four who began it, 2020',
  alumni: 'the members who came before',
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

const PencilOverlay: React.FC<{ id: string }> = ({ id }) => {
  const navigate = useNavigate();
  return (
    <button
      aria-label="Edit member"
      onClick={e => {
        e.preventDefault();
        navigate(`/admin?tab=team&edit=${id}`);
      }}
      style={{
        position: 'absolute', top: 10, right: 10, zIndex: 5, width: 28, height: 28,
        display: 'grid', placeItems: 'center', border: '1px solid rgba(124,92,255,0.5)',
        borderRadius: 999, background: '#ffffff', color: 'var(--nk-accent-400)', cursor: 'pointer',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      </svg>
    </button>
  );
};

const MemberCard: React.FC<{ member: TeamMember; layout: SectionLayout; editable: boolean }> = ({ member, layout, editable }) => {
  const img = resolveTeamImageSrc(member.image);
  const radius = layout.shape === 'circle' ? '50%' : 8;

  if (layout.size === 'compact') {
    return (
      <div className="nk-pcard nk-compact" style={{ position: 'relative' }}>
        {editable && <PencilOverlay id={member.id} />}
        {img ? (
          <img className="nk-smallphoto" src={img} alt={member.name} style={{ borderRadius: radius }} />
        ) : (
          <div className="nk-smallinit" style={{ borderRadius: radius }}>{initialsOf(member.name)}</div>
        )}
        <span style={{ fontFamily: 'var(--nk-serif)', fontWeight: 700, fontSize: 17, color: 'var(--nk-accent-300)', marginTop: 8 }}>{member.name}</span>
        {member.role && <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', marginTop: 2 }}>{member.role}</span>}
      </div>
    );
  }

  return (
    <div className="nk-pcard" style={{ position: 'relative' }}>
      {editable && <PencilOverlay id={member.id} />}
      {img ? (
        <img className="nk-photo" src={img} alt={member.name} style={layout.size === 'large' ? { aspectRatio: '4/5' } : undefined} />
      ) : (
        <div className="nk-noimg" style={layout.size === 'large' ? { aspectRatio: '4/5' } : undefined}>{initialsOf(member.name)}</div>
      )}
      <div className="nk-body">
        <div className="nk-name">{member.name}</div>
        {member.role && <div className="nk-sec">{member.role}</div>}
        {member.school && <div className="nk-school">{member.school}</div>}
        {member.bio ? (
          <div className="nk-bio">{member.bio}</div>
        ) : (
          <div className="nk-bio empty">bio to come — space reserved</div>
        )}
      </div>
    </div>
  );
};

const SectionHead: React.FC<{ numeral: string; title: string; subtitle?: string }> = ({ numeral, title, subtitle }) => (
  <div
    className="flex items-baseline gap-3 md:gap-[18px]"
    style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}
  >
    <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 30, color: 'var(--nk-accent)' }}>{numeral}.</span>
    <h2 className="text-[24px] md:text-[34px]" style={{ fontWeight: 700 }}>{title}</h2>
    {subtitle && (
      <span className="hidden md:inline" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>
        {subtitle}
      </span>
    )}
  </div>
);

const Carousel: React.FC<{ vars: React.CSSProperties; children: React.ReactNode }> = ({ vars, children }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const nudge = (dir: number) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    row.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 16), behavior: 'smooth' });
  };
  return (
    <div style={{ position: 'relative' }}>
      <div ref={rowRef} className="nk-teamrow" style={vars}>{children}</div>
      {[-1, 1].map(dir => (
        <button
          key={dir}
          aria-label={dir < 0 ? 'Previous members' : 'More members'}
          onClick={() => nudge(dir)}
          className="hidden md:grid"
          style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            [dir < 0 ? 'left' : 'right']: -14, width: 34, height: 34, placeItems: 'center',
            borderRadius: 999, border: '1px solid var(--nk-line-20)', background: '#ffffff',
            color: 'var(--nk-ink-72)', cursor: 'pointer', boxShadow: '0 6px 18px rgba(59,52,95,0.14)', zIndex: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {dir < 0 ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
          </svg>
        </button>
      ))}
    </div>
  );
};

const MeetOurTeam: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);
  const navigate = useNavigate();

  const { teamMembers, fetchTeamMembers, isLoading } = useTeamStore();
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const [layout, setLayout] = useState<TeamLayout>(DEFAULT_TEAM_LAYOUT);
  const [alumniOpen, setAlumniOpen] = useState(false);

  const canManage = !!(isAuthenticated && user && hasPermission('basic_admin'));

  useEffect(() => { fetchTeamMembers(); }, [fetchTeamMembers]);
  useEffect(() => {
    let alive = true;
    apiService.getTeamLayout().then(res => {
      if (alive && res.success && res.data && res.data.layout) setLayout(normalizeTeamLayout(res.data.layout));
    });
    return () => { alive = false; };
  }, []);

  const bySection = useMemo(() => {
    const map = new Map<SectionKey, TeamMember[]>();
    layout.order.forEach(key => {
      const members = teamMembers.filter(m => m.sections.includes(key));
      if (members.length > 0) map.set(key, members);
    });
    return map;
  }, [teamMembers, layout.order]);

  const visibleSections = layout.order.filter(key => bySection.has(key) && !layout.hidden.includes(key) && key !== 'alumni');
  const alumniVisible = !layout.hidden.includes('alumni') && bySection.has('alumni');
  const alumniMembers = bySection.get('alumni') ?? [];
  const sectionCount = visibleSections.length + (alumniVisible ? 1 : 0);
  let numeralIdx = 0;

  const renderSectionBody = (members: TeamMember[], sl: SectionLayout) => {
    const vars = {
      ['--cols-d' as string]: sl.perRow.desktop,
      ['--cols-t' as string]: sl.perRow.tablet,
      ['--cols-p' as string]: sl.perRow.phone,
    } as React.CSSProperties;
    const cards = members.map(m => <MemberCard key={m.id} member={m} layout={sl} editable={canManage} />);
    return sl.mode === 'carousel' ? <Carousel vars={vars}>{cards}</Carousel> : <div className="nk-teamgrid" style={vars}>{cards}</div>;
  };

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      {/* admin edit bar */}
      {canManage && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px',
            background: 'rgba(124,92,255,0.07)', borderBottom: '1px solid rgba(124,92,255,0.35)',
            fontSize: 12, color: 'var(--nk-accent-300)', position: 'relative', zIndex: 5,
          }}
        >
          <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</span>
          <button onClick={() => navigate('/admin?tab=team')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nk-accent-400)', fontFamily: 'inherit', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Edit members
          </button>
          <button onClick={() => navigate('/admin?tab=team&view=layout')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nk-accent-400)', fontFamily: 'inherit', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Edit page layout
          </button>
          <span style={{ marginLeft: 'auto', color: 'var(--nk-ink-58)' }}>the pencil on any card opens its editor</span>
        </div>
      )}

      {/* masthead */}
      <div className="px-6 pt-8 md:px-16 md:pt-11">
        <div className="flex flex-wrap items-baseline gap-4 md:gap-6" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 22 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>Meet the team</span>
          <span className="hidden md:inline" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--nk-ink-78)' }}>
            listed by section, the way a programme lists its players
          </span>
          <span className="ml-auto" style={{ fontSize: 12, color: 'var(--nk-ink-78)' }}>
            <b style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, fontSize: 24, color: 'var(--nk-ink)', fontVariantNumeric: 'tabular-nums' }}>{teamMembers.length}</b>{' '}
            students ·{' '}
            <b style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, fontSize: 24, color: 'var(--nk-ink)', fontVariantNumeric: 'tabular-nums' }}>{sectionCount}</b>{' '}
            sections
          </span>
        </div>
        {layout.intro && (
          <p style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--nk-ink-78)', margin: '18px 0 0', maxWidth: '70ch' }}>
            {layout.intro}
          </p>
        )}
      </div>

      {isLoading && teamMembers.length === 0 && (
        <div style={{ padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, border: '2px solid var(--nk-line-20)', borderTopColor: 'var(--nk-accent)', borderRadius: '50%', animation: 'ok-spin 0.9s linear infinite' }} />
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--nk-ink-58)' }}>Tuning up…</span>
        </div>
      )}

      {/* sections */}
      {visibleSections.map(key => {
        const members = bySection.get(key) ?? [];
        const numeral = ROMAN[numeralIdx++] ?? '·';
        const sl = sectionLayoutOf(layout, key);
        return (
          <div key={key} className="nk-fade px-6 pt-10 md:px-16 md:pt-14">
            <SectionHead numeral={numeral} title={SECTION_LABELS[key]} subtitle={SECTION_SUBTITLES[key]} />
            {renderSectionBody(members, sl)}
          </div>
        );
      })}

      {/* alumni — collapsed disclosure */}
      {alumniVisible && (
        <div className="nk-fade px-6 pt-10 md:px-16 md:pt-14">
          <SectionHead numeral={ROMAN[numeralIdx++] ?? '·'} title={SECTION_LABELS.alumni} subtitle={SECTION_SUBTITLES.alumni} />
          <button
            onClick={() => setAlumniOpen(o => !o)}
            style={{
              width: '100%', borderRadius: 16, border: '1px solid var(--nk-line-17)', padding: '20px 26px',
              display: 'flex', alignItems: 'center', gap: 16, background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', color: 'inherit',
            }}
          >
            <span style={{ fontSize: 12, color: 'rgba(43,39,64,0.68)' }}>
              {alumniOpen ? 'shown below' : `${alumniMembers.length} alumni · kept in the data, shown on demand`}
            </span>
            <svg
              style={{ marginLeft: 'auto', transform: alumniOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(43,39,64,0.72)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {alumniOpen && <div style={{ marginTop: 16 }}>{renderSectionBody(alumniMembers, sectionLayoutOf(layout, 'alumni'))}</div>}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 px-6 py-12 text-center md:mt-[72px] md:px-16 md:py-[76px]" style={{ borderTop: '1px solid var(--nk-line-20)', position: 'relative', overflow: 'hidden' }}>
        <div
          className="hidden md:block"
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 300, color: 'rgba(124,92,255,0.07)',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}
        >
          no. {teamMembers.length + 1}
        </div>
        <div className="nk-fade" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>Performers · Tutors · Friends</span>
          <div className="text-[30px] md:text-[58px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.05, maxWidth: '24ch' }}>
            The next card on this page <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>could be yours.</span>
          </div>
          {layout.ctaLink.startsWith('/') ? (
            <Link
              to={layout.ctaLink}
              style={{ fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', border: '1px solid var(--nk-accent)', padding: '16px 38px', borderRadius: 999, marginTop: 8 }}
            >
              {layout.ctaText}
            </Link>
          ) : (
            <a
              href={layout.ctaLink}
              style={{ fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', border: '1px solid var(--nk-accent)', padding: '16px 38px', borderRadius: 999, marginTop: 8 }}
            >
              {layout.ctaText}
            </a>
          )}
          <div style={{ fontSize: 13, color: 'var(--nk-ink-72)' }}>on3keymusic@gmail.com · @on3keymusic</div>
        </div>
      </div>
    </div>
  );
};

export default MeetOurTeam;
