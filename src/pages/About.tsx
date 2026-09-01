import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { NkGlyphs, NkPhotoSlot, useNkPageMotion } from '../components/nocturne/motion';

const STORY = [
  { year: '2020', title: 'OneKey is founded', body: 'Four co-founders start bringing student musicians to senior homes.', filled: true },
  { year: '2020', title: 'National recognition', body: 'The Youth Role Model award, public-welfare category.' },
  { year: '2021', title: 'Homework help is founded', body: 'Tutoring becomes the second pillar, equal to the first.' },
  { year: '2022', title: 'Performances expand', body: 'More homes, more programs, more students on stage.' },
  { year: '2022', title: 'Partnership with Vanstring', body: 'The student string orchestra joins as partner ensemble.', last: true },
];

const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' };

const About: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      <NkGlyphs />

      {/* intro */}
      <div className="px-6 pt-10 text-left md:px-16 md:pt-16 md:text-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="inline-flex items-center" style={{ gap: 14 }}>
          <span className="w-7 md:w-11" style={{ height: 1, background: 'var(--nk-blue)' }} />
          <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            Who we are · est. 2020
          </span>
          <span className="hidden w-11 md:inline-block" style={{ height: 1, background: 'var(--nk-blue)' }} />
        </div>
        <div
          className="text-[44px] md:text-[76px]"
          style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.01em', marginTop: 18, paddingBottom: '0.08em' }}
        >
          About <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>us.</span>
        </div>
        <p className="md:mx-auto" style={{ fontSize: 16, lineHeight: 1.85, margin: '20px 0 0', maxWidth: '62ch', color: 'var(--nk-ink-90)' }}>
          OneKey is a student-run volunteer organization from Richmond, BC. Since 2020 we've been doing two things side by side — and we
          care about both equally.
        </p>
        <div className="hidden md:block" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--nk-ink-72)', marginTop: 22 }}>
          here's what that looks like —
        </div>
      </div>

      {/* opening: photo-led diptych (desktop) — slots awaiting photos */}
      <div
        className="mt-11 hidden grid-cols-2 md:grid"
        style={{ borderBottom: '1px solid var(--nk-line-20)', borderTop: '1px solid var(--nk-line-20)', position: 'relative', zIndex: 1 }}
      >
        <figure style={{ margin: 0, borderRight: '1px solid var(--nk-line-20)', padding: '40px 40px 32px 64px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--nk-accent)' }}>I.</span>
            <span style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-ink-85)' }}>Music — real stages, real audiences</span>
          </div>
          <NkPhotoSlot ratio="4/5" />
          <figcaption style={{ fontSize: 12, color: 'var(--nk-ink-72)' }}>Music · photo to come</figcaption>
        </figure>
        <figure style={{ margin: 0, padding: '40px 64px 32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--nk-accent)' }}>II.</span>
            <span style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-ink-85)' }}>Homework help — every week</span>
          </div>
          <NkPhotoSlot ratio="4/5" />
          <figcaption style={{ fontSize: 12, color: 'var(--nk-ink-72)' }}>Homework help · photo to come</figcaption>
        </figure>
      </div>

      {/* opening photo slots (phone) */}
      <div className="flex gap-3 px-6 pt-2 md:hidden" style={{ position: 'relative', zIndex: 1 }}>
        <NkPhotoSlot ratio="3/4" style={{ flex: 1, minWidth: 0 }} />
        <NkPhotoSlot ratio="3/4" style={{ flex: 1, minWidth: 0, marginTop: 24 }} />
      </div>

      {/* the statement */}
      <div className="nk-fade grid grid-cols-1 gap-6 px-6 pt-8 md:grid-cols-[1fr_300px] md:gap-16 md:px-16 md:pt-16" style={{ alignItems: 'end', position: 'relative', zIndex: 1 }}>
        <div
          className="text-[21px] leading-[1.6] md:text-[40px] md:leading-[1.42]"
          style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, letterSpacing: '-0.01em' }}
        >
          OneKey does two things, and we care about both equally. One is{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>music</span>: young players get real stage time at senior homes, in
          front of audiences who love to listen. The other is{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>homework help</span>: our volunteers sit down with younger students
          and help them keep up.
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--nk-ink-78)', borderLeft: '1px solid var(--nk-line-20)', paddingLeft: 20 }}>
          Founded 2020 by Curtis Wei, Jack Wang, Grace Xu and Eliza Sun · working out of the C&amp;K Music School studio, Richmond.
        </div>
      </div>

      {/* our story — desktop strip */}
      <div className="nk-fade mx-6 mt-10 hidden md:mx-16 md:mt-20 md:block" style={{ borderTop: '1px solid var(--nk-line-20)', paddingTop: 44, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <span style={eyebrow}>Our story</span>
        </div>
        <div style={{ display: 'flex' }}>
          {STORY.map(s => (
            <div key={s.title} style={s.last ? { width: 220, display: 'flex', flexDirection: 'column', gap: 12 } : { flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={
                    s.filled
                      ? { width: 10, height: 10, borderRadius: '50%', background: 'var(--nk-accent)', flex: 'none', boxShadow: '0 0 0 5px rgba(124,92,255,0.15)' }
                      : { width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--nk-accent)', background: '#ffffff', flex: 'none' }
                  }
                />
                {!s.last && <span style={{ flex: 1, height: 1, background: 'var(--nk-line-17)' }} />}
              </div>
              <div style={{ paddingRight: s.last ? 0 : 24 }}>
                <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--nk-accent-400)', fontVariantNumeric: 'tabular-nums' }}>{s.year}</div>
                <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--nk-ink-78)', lineHeight: 1.65, marginTop: 4 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* our story — phone grid */}
      <div className="px-6 pt-10 md:hidden" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', marginBottom: 18 }}>Our story</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px' }}>
          {[
            { year: '2020', title: 'OneKey is founded', lead: true },
            { year: '2020', title: 'National recognition' },
            { year: '2021', title: 'Homework help is founded' },
            { year: '2022', title: 'Performances expand · Vanstring joins' },
          ].map(s => (
            <div key={s.title} style={{ borderTop: s.lead ? '2px solid var(--nk-accent)' : '1px solid rgba(59,52,95,0.19)', paddingTop: 10 }}>
              <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--nk-royal)' }}>{s.year}</div>
              <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{s.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* recognition */}
      <div className="mx-6 mt-10 md:mx-16 md:mt-20" style={{ borderRadius: 18, border: '1px solid var(--nk-line-20)', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <div
          className="hidden md:block"
          style={{ position: 'absolute', right: 44, bottom: -30, fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 220, color: 'rgba(59,116,232,0.1)', lineHeight: 1, pointerEvents: 'none' }}
        >
          2020
        </div>
        <div className="nk-fade grid grid-cols-1 gap-8 p-6 md:grid-cols-[1fr_1.1fr] md:gap-14 md:px-14 md:py-16" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>Recognition</span>
            <div className="text-[30px] md:text-[46px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.1 }}>
              Honoured on the <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>national stage.</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: 'var(--nk-ink-90)', textAlign: 'justify' }}>
              In 2020 — the same year OneKey was founded — its four co-founders received the Youth Role Model award in the public-welfare
              category (青春榜样公益类), recognized by CCTV and the Greater Vancouver Parents Association. Vanstring was honoured at the same
              ceremony: the stage screen read "Van Key · Van String · Charlie Gao."
            </p>
            <div style={{ display: 'flex', gap: 36, marginTop: 6 }}>
              <div style={{ borderTop: '2px solid var(--nk-blue)', paddingTop: 12 }}>
                <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 38, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>2020</div>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-ink-85)', marginTop: 6 }}>Youth Role Model award</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(59,52,95,0.19)', paddingTop: 12 }}>
                <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 38, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>4</div>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-ink-85)', marginTop: 6 }}>Co-founders on stage</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <figure style={{ flex: 1.1, margin: 0, background: '#f1effa', border: '1px solid var(--nk-line-17)', padding: 14, borderRadius: 14 }}>
              <NkPhotoSlot ratio="1290/1233" style={{ borderRadius: 4 }} />
              <figcaption style={{ fontSize: 12, marginTop: 10, color: 'var(--nk-ink-78)' }}>Award photo · to come</figcaption>
            </figure>
            <figure className="md:mt-11" style={{ flex: 1, margin: 0, background: '#f1effa', border: '1px solid var(--nk-line-17)', padding: 14, borderRadius: 14 }}>
              <NkPhotoSlot ratio="2400/1080" style={{ borderRadius: 4 }} />
              <figcaption style={{ fontSize: 12, marginTop: 10, color: 'var(--nk-ink-78)' }}>Ceremony photo · to come</figcaption>
            </figure>
          </div>
        </div>
      </div>

      {/* link cards */}
      <div className="nk-fade mx-6 mb-11 mt-9 grid grid-cols-1 gap-4 md:mx-16 md:mb-[72px] md:mt-[72px] md:grid-cols-2 md:gap-6" style={{ position: 'relative', zIndex: 1 }}>
        <Link
          to="/team"
          className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:gap-[22px] md:p-6"
          style={{ borderRadius: 16, border: '1px solid var(--nk-line-17)', background: 'var(--nk-panel)', color: 'inherit' }}
        >
          <div className="w-full md:w-[230px]" style={{ flex: 'none' }}><NkPhotoSlot ratio="3/2" /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="text-[22px] md:text-[29px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500 }}>
              Our <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>team</span>
            </div>
            <div className="hidden md:block" style={{ fontSize: 14, color: 'var(--nk-ink-85)', lineHeight: 1.65 }}>Twenty-four students across seven sections.</div>
            <span style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', marginTop: 4 }}>Meet the ensemble →</span>
          </div>
        </Link>
        <Link
          to="/timeline"
          className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:gap-[22px] md:p-6"
          style={{ borderRadius: 16, border: '1px solid var(--nk-line-17)', background: 'var(--nk-panel)', color: 'inherit' }}
        >
          <div className="w-full md:w-[230px]" style={{ flex: 'none' }}><NkPhotoSlot ratio="3/2" /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="text-[22px] md:text-[29px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500 }}>
              Our <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>history</span>
            </div>
            <div className="hidden md:block" style={{ fontSize: 14, color: 'var(--nk-ink-85)', lineHeight: 1.65 }}>Six years of performances, tutoring and giving.</div>
            <span style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', marginTop: 4 }}>View the chronicle →</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default About;
