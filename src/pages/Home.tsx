import React, { useMemo, useRef } from 'react';
import { photoUrl as P } from '../utils/photoUrl';
import { Link } from 'react-router-dom';
import { NkStaff, NkNote, NkMarquee, NkHeroSlideshow, useNkPageMotion } from '../components/nocturne/motion';
import { getRandomPhotos } from '../data/photos';



// Hero catchphrase. Edit these lines to change it.
const CATCHPHRASE_LINES = [
  <>insert some form of</>,
  <>
    <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>catchphrase</span> here
  </>,
  <>
    idk. <span style={{ fontStyle: 'italic', color: 'var(--nk-ink-45)', fontSize: '0.36em' }}>— placeholder, to be written</span>
  </>,
];

const HERO_SLIDES = [
  { src: P('/pics/onekey_history.jpg'), alt: 'String players performing in a senior-home lobby with a grand staircase' },
  { src: P('/pics/onekey_perform_mic.jpg'), alt: 'A teen adjusts a microphone for a young violinist, Christmas tree behind' },
  { src: P('/pics/vanstring.jpg'), alt: 'Vanstring orchestra on stage under blue light' },
  { src: P('/pics/vanstringsh.jpg'), alt: 'Seniors watching a performance' },
  { src: P('/pics/onekey_cellos.jpg'), alt: 'Kids holding colourful cello cases' },
];

const PROGRAMS = [
  {
    img: P('/pics/Slide_1.jpg'),
    alt: 'Tutors and kids at a table with laptops',
    title: <>Homework help</>,
    body: 'Volunteers sit down with younger students, week after week, at the C&K studio. Running since 2021.',
    cta: 'Visit the program →',
    to: '/about',
  },
  {
    img: P('/pics/onekey_perform_mic.jpg'),
    alt: 'A teen adjusts a microphone for a young violinist',
    title: <>Senior-home performances</>,
    body: 'Young musicians earn real stage time; residents get live music and company. Where OneKey began, in 2020.',
    cta: 'Visit the program →',
    to: '/about',
  },
  {
    img: P('/pics/RHFcheck2025.jpg'),
    alt: 'Cheque presentation at Richmond Hospital Foundation',
    title: <>Fundraisers</>,
    body: '$52,000+ to the Richmond Hospital Foundation across ten years, the Aquarium virtual concert, and Voluntary Teaching for China.',
    cta: 'Visit the fundraisers →',
    to: '/fundraisers',
  },
  {
    img: P('/pics/vanstring.jpg'),
    alt: 'Vanstring orchestra on stage',
    title: (
      <>
        Vanstring{' '}
        <span style={{ fontStyle: 'italic', fontSize: 17, fontWeight: 500, color: 'var(--nk-ink-78)' }}>— partner ensemble</span>
      </>
    ),
    body: 'The student string orchestra led by Alex Zhang — concerts, competitions, and a decade of fundraising.',
    cta: 'Visit Vanstring →',
    to: '/vanstring',
  },
];

const MARQUEE_ITEMS = [
  { text: 'Senior-home concerts' },
  { text: 'Youth Role Model 2020', italic: true },
  { text: 'Homework help, weekly' },
  { text: '$52,000+ to Richmond Hospital' },
  { text: 'Vanstring, partner ensemble', italic: true },
];

const JOIN_MAILTO = 'mailto:on3keymusic@gmail.com?subject=Joining%20OneKey';

const Home: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);
  const archive = useMemo(() => getRandomPhotos(12), []);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      <NkStaff />

      {/* hero: playbill */}
      <div className="relative px-6 pt-10 text-center md:px-16 md:pt-[76px] md:text-left" style={{ position: 'relative' }}>
        <div className="nk-kicker flex flex-col items-center gap-2 md:items-start" style={{ marginBottom: 38 }}>
          <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--nk-ink-85)' }}>
            A student-run volunteer organisation of Richmond, BC
          </span>
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 21, color: 'var(--nk-royal)' }}>
            presents its sixth season —
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--nk-serif)',
            fontWeight: 500,
            fontSize: 'clamp(42px, 6.9vw, 100px)',
            lineHeight: 0.99,
            letterSpacing: '-0.005em',
          }}
        >
          {CATCHPHRASE_LINES.map((line, i) => (
            <div key={i} className="nk-line" style={{ overflow: 'hidden' }}>
              <div style={{ paddingBottom: '0.12em', marginBottom: '-0.04em' }}>{line}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--nk-ink-85)' }}>
            Richmond, BC · since 2020
          </span>
        </div>
      </div>

      {/* hero plates */}
      <div className="nk-fade mx-6 md:ml-32 md:mr-0">
        <NkHeroSlideshow slides={HERO_SLIDES} height="clamp(300px, 40vw, 580px)" margin="20px 0 0" />
      </div>

      {/* programme contents */}
      <div className="nk-fade mx-auto mt-14 hidden w-[760px] max-w-full md:mt-[88px] md:block">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 40, fontWeight: 500 }}>Programme</div>
          <div style={{ width: 44, height: 2, background: 'var(--nk-blue)', margin: '14px auto 0' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--nk-accent-400)', width: 44 }}>I.</span>
            <span style={{ fontFamily: 'var(--nk-serif)', fontSize: 22 }}>Our programs — four ways to take part</span>
            <span style={{ flex: 1, borderBottom: '1px dotted rgba(59,52,95,0.35)', transform: 'translateY(-4px)' }} />
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'rgba(43,39,64,0.82)' }}>each its own page</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--nk-accent-400)', width: 44 }}>II.</span>
            <Link to="/team" style={{ fontFamily: 'var(--nk-serif)', fontSize: 22, color: 'inherit' }}>
              Our team — 24 students, seven sections
            </Link>
            <span style={{ flex: 1, borderBottom: '1px dotted rgba(59,52,95,0.35)', transform: 'translateY(-4px)' }} />
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-royal)' }}>→ team page</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--nk-accent-400)', width: 44 }}>III.</span>
            <span style={{ fontFamily: 'var(--nk-serif)', fontSize: 22 }}>The archive — 218 negatives</span>
            <span style={{ flex: 1, borderBottom: '1px dotted rgba(59,52,95,0.35)', transform: 'translateY(-4px)' }} />
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'rgba(43,39,64,0.82)' }}>photographs</span>
          </div>
        </div>
      </div>

      {/* I: our programs */}
      <div className="px-6 pt-10 md:px-16 md:pt-[88px]">
        <div
          className="mb-5 flex items-baseline gap-4 md:mb-7 md:gap-[22px]"
          style={{ borderBottom: '1px solid var(--nk-line-17)', paddingBottom: 14 }}
        >
          <span className="text-[50px] md:text-[64px]" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', lineHeight: 1, color: 'var(--nk-accent)' }}>
            I.
          </span>
          <h2 className="text-[26px] md:text-[40px]" style={{ fontWeight: 700 }}>
            Our programs
          </h2>
          <span className="hidden md:inline" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--nk-ink-78)' }}>
            each has its own page — pick a door
          </span>
        </div>
        <div className="nk-fade grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {PROGRAMS.map((pr, i) => (
            <Link
              key={i}
              to={pr.to}
              style={{
                borderRadius: 18,
                border: '1px solid var(--nk-line-17)',
                background: 'var(--nk-panel)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                color: 'inherit',
              }}
            >
              <img
                className="nk-plate"
                src={pr.img}
                alt={pr.alt}
                loading={i > 1 ? 'lazy' : undefined}
                style={{ width: '100%', aspectRatio: '16/8', objectFit: 'cover', border: 'none', outline: 'none', borderRadius: 0 }}
              />
              <div className="flex flex-col gap-2 p-5 md:gap-[10px] md:px-[30px] md:pb-[30px] md:pt-[26px]">
                <div className="text-[23px] md:text-[31px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 700, lineHeight: 1.1 }}>
                  {pr.title}
                </div>
                <p className="hidden md:block" style={{ fontSize: 14, lineHeight: 1.75, margin: 0, color: 'rgba(43,39,64,0.88)' }}>
                  {pr.body}
                </p>
                <span style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nk-royal)', marginTop: 4 }}>
                  {pr.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* II: our team pointer */}
      <div className="px-6 pt-10 md:px-16 md:pt-20">
        <div
          className="nk-fade flex flex-wrap items-center gap-3 p-5 md:gap-[26px] md:px-11 md:py-[38px]"
          style={{ borderRadius: 18, border: '1px solid var(--nk-line-17)', background: 'var(--nk-panel)' }}
        >
          <span className="text-[24px] md:text-[64px]" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', lineHeight: 1, color: 'var(--nk-accent)' }}>
            II.
          </span>
          <div>
            <h2 className="text-[20px] md:text-[34px]" style={{ fontWeight: 700 }}>
              Our team
            </h2>
            <div className="hidden md:block" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>
              24 students, seven sections — everyone, with faces and bios
            </div>
          </div>
          <Link
            to="/team"
            className="ml-auto"
            style={{
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--nk-royal)',
              border: '1px solid var(--nk-blue)',
              padding: '14px 30px',
              borderRadius: 999,
            }}
          >
            Meet the team →
          </Link>
        </div>
      </div>

      {/* intermission */}
      <div className="mx-6 mt-9 flex items-center gap-4 md:mx-16 md:mt-[88px] md:gap-[22px]">
        <span style={{ flex: 1, height: 1, background: 'var(--nk-line-20)' }} />
        <span className="hidden md:inline-flex">
          <NkNote scale={0.7} opacity={0.8} />
        </span>
        <span className="text-[15px] md:text-[20px]" style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', color: 'var(--nk-ink-85)' }}>
          — intermission —
        </span>
        <span className="hidden md:inline-flex">
          <NkNote scale={0.7} opacity={0.8} />
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--nk-line-20)' }} />
      </div>

      {/* marquee on a staff (desktop) */}
      <div className="mt-9 hidden md:block">
        <NkMarquee items={MARQUEE_ITEMS} />
      </div>

      {/* III: archive */}
      <div className="px-6 pt-7 md:px-16 md:pt-[88px]">
        <div className="hidden items-baseline justify-between md:flex" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 68, lineHeight: 1, color: 'var(--nk-accent)' }}>III.</span>
            <div>
              <h2 style={{ fontSize: 40, fontWeight: 700 }}>The archive</h2>
              <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-85)' }}>
                12 of 218 negatives, drawn at random
              </div>
            </div>
          </div>
        </div>
        {/* desktop mosaic */}
        <div className="nk-fade hidden md:grid" style={{ gridTemplateColumns: 'repeat(6,1fr)', gridAutoRows: 96, gap: 14 }}>
          {archive.map((src, i) => (
            <img
              key={src}
              className="nk-plate"
              src={src}
              alt="From the concert archive"
              loading="lazy"
              style={{
                gridColumn: 'span 2',
                gridRow: [1, 4].includes(i) ? 'span 3' : 'span 2',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ))}
        </div>
        {/* phone 2×2 */}
        <div className="grid grid-cols-2 gap-[10px] md:hidden">
          {archive.slice(0, 4).map(src => (
            <img key={src} className="nk-plate" src={src} alt="From the concert archive" loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
          ))}
        </div>
      </div>

      {/* encore CTA */}
      <div
        className="mt-11 px-6 py-9 text-center md:mt-[100px] md:px-16 md:py-[84px]"
        style={{ borderTop: '1px solid var(--nk-line-20)', position: 'relative', overflow: 'hidden' }}
      >
        <div
          className="hidden md:block"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: 'var(--nk-serif)',
            fontStyle: 'italic',
            fontSize: 320,
            color: 'rgba(124,92,255,0.07)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          encore
        </div>
        <div className="nk-fade" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <span className="hidden md:inline" style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            Performers · Tutors · Friends
          </span>
          <div
            className="text-[29px] md:text-[62px]"
            style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.05, maxWidth: '22ch' }}
          >
            Every ensemble has an <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>open chair.</span>
          </div>
          <a
            href={JOIN_MAILTO}
            style={{
              fontSize: 13,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--nk-accent-400)',
              border: '1px solid var(--nk-accent)',
              padding: '16px 38px',
              borderRadius: 999,
              marginTop: 10,
            }}
          >
            Take your seat
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
