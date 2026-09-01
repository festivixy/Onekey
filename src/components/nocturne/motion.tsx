import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The zigzag staff path drawn across the full page (viewBox 0 0 1440 1000,
// stretched with preserveAspectRatio="none").
const STAFF_D =
  'M-10 20 C 200 62, 420 8, 720 58 C 1000 104, 1250 66, 1450 128 C 1200 192, 900 158, 600 222 ' +
  'C 350 272, 150 238, -10 302 C 250 362, 550 328, 850 392 C 1100 442, 1300 408, 1450 472 ' +
  'C 1200 532, 900 498, 600 562 C 350 612, 150 578, -10 652 C 250 712, 550 678, 850 742 ' +
  'C 1100 792, 1300 758, 1450 822 C 1200 882, 900 848, 600 912 C 350 952, 150 928, -10 982';

let staffGradientSeq = 0;

/** Full-page decorative staff: gradient curves + GSAP-placed melody notes and a
 *  travelling playhead. Renders absolutely inside the nearest positioned parent. */
export const NkStaff: React.FC<{ noteCount?: number; sweepDuration?: number }> = ({
  noteCount = 24,
  sweepDuration = 40,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const gradId = useRef(`nk-vb-${++staffGradientSeq}`);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const svg = svgRef.current;
    const board = boardRef.current;
    if (!svg || !board) return;
    const path = svg.querySelector('path');
    if (!path) return;

    board.innerHTML = '';
    const L = (path as SVGPathElement).getTotalLength();
    const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
    const notes: HTMLSpanElement[] = [];
    for (let i = 1; i <= noteCount; i++) {
      const frac = i / (noteCount + 0.5);
      const p = (path as SVGPathElement).getPointAtLength(L * frac);
      const col = `rgb(${lerp(124, 59, frac)},${lerp(92, 116, frac)},${lerp(255, 232, frac)})`;
      const el = document.createElement('span');
      el.className = 'nk-note';
      el.style.cssText = `position:absolute; left:${p.x / 14.4}%; top:${p.y / 10}%; z-index:0; pointer-events:none; transform:scale(1.5); transform-origin:bottom left;`;
      el.style.setProperty('--nk-note-col', col);
      el.innerHTML = '<i></i><b></b>';
      board.appendChild(el);
      notes.push(el);
    }
    const dot = document.createElement('span');
    dot.style.cssText =
      'position:absolute; width:16px; height:16px; border-radius:50%; background:#7c5cff; box-shadow:0 0 28px 6px rgba(124,92,255,0.65); z-index:0; pointer-events:none; margin:-8px 0 0 -8px;';
    board.appendChild(dot);

    const ctx = gsap.context(() => {
      gsap.from(notes, { opacity: 0, y: 12, duration: 0.5, stagger: 0.14, delay: 0.7, ease: 'back.out(2)' });
      gsap.to(
        notes.map(n => n.querySelector('i')),
        { opacity: 0.5, duration: 1.4, repeat: -1, yoyo: true, stagger: 0.3, ease: 'sine.inOut', delay: 2.2 }
      );
      const o = { t: 0 };
      const place = () => {
        const p = (path as SVGPathElement).getPointAtLength(L * o.t);
        dot.style.left = `${p.x / 14.4}%`;
        dot.style.top = `${p.y / 10}%`;
        const c = `rgb(${lerp(124, 59, o.t)},${lerp(92, 116, o.t)},${lerp(255, 232, o.t)})`;
        dot.style.background = c;
        dot.style.boxShadow = `0 0 28px 6px ${c.replace('rgb', 'rgba').replace(')', ',0.6)')}`;
      };
      place();
      gsap.to(o, { t: 1, duration: sweepDuration, repeat: -1, ease: 'none', onUpdate: place, delay: 0.7 });
    });
    return () => {
      ctx.revert();
      board.innerHTML = '';
    };
  }, [noteCount, sweepDuration]);

  return (
    <>
      <svg
        ref={svgRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId.current} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#3b74e8" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round">
          <path vectorEffect="non-scaling-stroke" stroke={`url(#${gradId.current})`} strokeWidth="2.5" opacity="0.65" d={STAFF_D} />
          <path vectorEffect="non-scaling-stroke" stroke={`url(#${gradId.current})`} strokeWidth="1.6" opacity="0.45" transform="translate(0,14)" d={STAFF_D} />
          <path vectorEffect="non-scaling-stroke" stroke={`url(#${gradId.current})`} strokeWidth="1.6" opacity="0.4" transform="translate(0,28)" d={STAFF_D} />
          <path vectorEffect="non-scaling-stroke" stroke={`url(#${gradId.current})`} strokeWidth="1.6" opacity="0.36" transform="translate(0,42)" d={STAFF_D} />
          <path vectorEffect="non-scaling-stroke" stroke={`url(#${gradId.current})`} strokeWidth="1.6" opacity="0.32" transform="translate(0,56)" d={STAFF_D} />
        </g>
      </svg>
      <div ref={boardRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
    </>
  );
};

/** A single CSS eighth note. */
export const NkNote: React.FC<{ scale?: number; opacity?: number; color?: string }> = ({ scale = 1, opacity = 1, color }) => (
  <span
    className="nk-note"
    style={{
      transform: `scale(${scale})`,
      opacity,
      ...(color ? ({ ['--nk-note-col' as string]: color } as React.CSSProperties) : {}),
    }}
  >
    <i />
    <b />
  </span>
);

/** Intermission marquee on a rule — items are doubled for a seamless loop. */
export const NkMarquee: React.FC<{ items: { text: string; italic?: boolean }[]; duration?: number }> = ({
  items,
  duration = 38,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      if (trackRef.current) gsap.to(trackRef.current, { xPercent: -50, duration, repeat: -1, ease: 'none' });
    });
    return () => ctx.revert();
  }, [duration]);
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        position: 'relative',
        padding: '22px 0',
        overflow: 'hidden',
        borderTop: '1px solid var(--nk-line-20)',
        borderBottom: '1px solid var(--nk-line-20)',
      }}
    >
      <div
        ref={trackRef}
        className="nk-marquee-track"
        style={{ fontFamily: 'var(--nk-serif)', fontSize: 21, color: 'var(--nk-ink-85)', whiteSpace: 'nowrap', gap: 20 }}
      >
        {doubled.map((it, i) => (
          <React.Fragment key={i}>
            <span style={it.italic ? { fontStyle: 'italic' } : undefined}>{it.text}</span>
            <NkNote scale={0.55} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/** Crossfading plate slideshow with a blurred backfill and dash-dots. */
export const NkHeroSlideshow: React.FC<{
  slides: { src: string; alt: string }[];
  height: number | string;
  margin?: string;
  interval?: number;
  showDots?: boolean;
  slideHeight?: string;
}> = ({ slides, height, margin, interval = 5200, showDots = true, slideHeight = '84%' }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = rootRef.current;
    if (!hero || slides.length < 2 || prefersReducedMotion()) return;
    const els = hero.querySelectorAll<HTMLImageElement>('.nk-hero-slide');
    const blur = hero.querySelector<HTMLImageElement>('.nk-hero-blur');
    const dots = hero.querySelectorAll<HTMLSpanElement>('.nk-hero-dots span');
    let i = 0;
    const ctx = gsap.context(() => {
      gsap.fromTo(els[0], { scale: 1.05 }, { scale: 1, duration: 5, ease: 'none' });
    });
    const step = () => {
      const prev = els[i];
      i = (i + 1) % els.length;
      const next = els[i];
      if (blur) blur.src = next.src;
      gsap.to(prev, { opacity: 0, duration: 1.3, ease: 'power1.inOut' });
      gsap.fromTo(next, { opacity: 0, scale: 1.05 }, { opacity: 1, duration: 1.3, ease: 'power1.inOut' });
      gsap.to(next, { scale: 1, duration: 5, ease: 'none' });
      dots.forEach((d, di) => {
        d.style.background = di === i ? 'var(--nk-accent)' : 'rgba(59,52,95,0.25)';
      });
    };
    const ival = setInterval(step, interval);
    return () => {
      clearInterval(ival);
      ctx.revert();
    };
  }, [slides.length, interval]);

  return (
    <div
      ref={rootRef}
      className="nk-hero"
      style={{
        position: 'relative',
        height,
        margin,
        overflow: 'hidden',
        border: '1px solid var(--nk-line-20)',
        background: 'var(--nk-well)',
        borderRadius: 18,
      }}
    >
      <img
        className="nk-hero-blur"
        src={slides[0].src}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(30px) brightness(1.12) saturate(0.8)',
          transform: 'scale(1.15)',
        }}
      />
      {slides.map((s, idx) => (
        <img
          key={s.src}
          className="nk-hero-slide nk-plate"
          src={s.src}
          alt={s.alt}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            height: slideHeight,
            maxWidth: '90%',
            objectFit: 'contain',
            boxShadow: '0 24px 60px rgba(90,80,180,0.16)',
            opacity: idx === 0 ? 1 : 0,
          }}
        />
      ))}
      {showDots && (
        <div style={{ position: 'absolute', left: 16, bottom: 12, display: 'flex', gap: 6 }} className="nk-hero-dots">
          {slides.map((_, idx) => (
            <span key={idx} style={{ width: 18, height: 2, background: idx === 0 ? 'var(--nk-blue)' : 'rgba(59,52,95,0.25)' }} />
          ))}
        </div>
      )}
    </div>
  );
};

/** Page-level intro + scroll reveals: .nk-line clip-up on load, .nk-kicker fade,
 *  .nk-fade scroll reveals, .nk-count counters. Call once per page root. */
export const useNkPageMotion = (rootRef: React.RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (root.querySelector('.nk-line > div')) {
        gsap.from('.nk-line > div', { yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'power3.out' });
      }
      if (root.querySelector('.nk-kicker')) {
        gsap.from('.nk-kicker', { opacity: 0, y: -14, duration: 0.9, delay: 0.2, ease: 'power2.out' });
      }
      gsap.utils.toArray<HTMLElement>('.nk-fade').forEach(el => {
        gsap.from(el, {
          opacity: 0,
          y: 26,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('.nk-progress').forEach(el => {
        gsap.fromTo(
          el,
          { width: 0 },
          {
            width: el.dataset.width || '0%',
            duration: 2.2,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }
        );
      });
      gsap.utils.toArray<HTMLElement>('.nk-count').forEach(el => {
        const target = parseInt(el.dataset.target || '0', 10);
        const pre = el.dataset.prefix || '';
        const suf = el.dataset.suffix || '';
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            el.textContent = pre + Math.round(o.v).toLocaleString() + suf;
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [rootRef]);
};

type Glyph = { g: string; left: string; top: string; size: number; color: string; rot: number };

const DESKTOP_GLYPHS: Glyph[] = [
  { g: '\u{1D11E}', left: '4%', top: '3%', size: 120, color: 'rgba(124,92,255,0.18)', rot: -8 },
  { g: '\u266A', left: '88%', top: '6%', size: 64, color: 'rgba(124,92,255,0.16)', rot: 12 },
  { g: '\u{1D122}', left: '92%', top: '18%', size: 90, color: 'rgba(110,100,245,0.14)', rot: 6 },
  { g: '\u2669', left: '6%', top: '24%', size: 56, color: 'rgba(110,100,245,0.15)', rot: -10 },
  { g: '\u266F', left: '48%', top: '14%', size: 48, color: 'rgba(124,92,255,0.13)', rot: 8 },
  { g: '\u266B', left: '72%', top: '32%', size: 72, color: 'rgba(100,105,240,0.14)', rot: -6 },
  { g: '\u266D', left: '10%', top: '44%', size: 60, color: 'rgba(90,110,238,0.14)', rot: 10 },
  { g: '\u{1D11E}', left: '90%', top: '48%', size: 110, color: 'rgba(84,112,236,0.13)', rot: 9 },
  { g: '\u266C', left: '40%', top: '55%', size: 54, color: 'rgba(80,113,235,0.13)', rot: -12 },
  { g: '\u266E', left: '65%', top: '66%', size: 48, color: 'rgba(72,114,234,0.13)', rot: 6 },
  { g: '\u{1D122}', left: '8%', top: '72%', size: 96, color: 'rgba(66,115,233,0.13)', rot: -7 },
  { g: '\u266A', left: '87%', top: '78%', size: 62, color: 'rgba(59,116,232,0.15)', rot: 10 },
  { g: '\u2669', left: '30%', top: '86%', size: 58, color: 'rgba(59,116,232,0.14)', rot: -8 },
  { g: '\u{1D11E}', left: '55%', top: '90%', size: 100, color: 'rgba(59,116,232,0.12)', rot: 5 },
];

const PHONE_GLYPHS: Glyph[] = [
  { g: '\u{1D11E}', left: '4%', top: '2%', size: 84, color: 'rgba(124,92,255,0.18)', rot: -8 },
  { g: '\u266A', left: '80%', top: '8%', size: 46, color: 'rgba(124,92,255,0.15)', rot: 12 },
  { g: '\u266F', left: '60%', top: '20%', size: 38, color: 'rgba(110,100,245,0.13)', rot: 8 },
  { g: '\u{1D122}', left: '78%', top: '34%', size: 66, color: 'rgba(100,105,240,0.14)', rot: 6 },
  { g: '\u266B', left: '8%', top: '42%', size: 50, color: 'rgba(90,110,238,0.14)', rot: -6 },
  { g: '\u266D', left: '70%', top: '55%', size: 44, color: 'rgba(80,113,235,0.13)', rot: 10 },
  { g: '\u2669', left: '12%', top: '66%', size: 44, color: 'rgba(66,115,233,0.14)', rot: -10 },
  { g: '\u{1D11E}', left: '72%', top: '76%', size: 76, color: 'rgba(59,116,232,0.13)', rot: 9 },
  { g: '\u266C', left: '20%', top: '88%', size: 42, color: 'rgba(59,116,232,0.14)', rot: -8 },
];

/** Scattered music-glyph backdrop (About, Fundraisers, Vanstring pages). */
export const NkGlyphs: React.FC = () => (
  <>
    {[
      { glyphs: DESKTOP_GLYPHS, cls: 'hidden md:block' },
      { glyphs: PHONE_GLYPHS, cls: 'block md:hidden' },
    ].map(({ glyphs, cls }, gi) => (
      <div
        key={gi}
        aria-hidden="true"
        className={cls}
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', fontFamily: 'var(--nk-serif)', opacity: 0.6 }}
      >
        {glyphs.map((s, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              fontSize: s.size,
              color: s.color,
              transform: `rotate(${s.rot}deg)`,
              lineHeight: 1,
            }}
          >
            {s.g}
          </span>
        ))}
      </div>
    ))}
  </>
);

/** An empty framed slot where a photo will go later. */
export const NkPhotoSlot: React.FC<{ ratio?: string; label?: string; style?: React.CSSProperties }> = ({
  ratio = '4/3',
  label = 'photo slot',
  style,
}) => (
  <div
    style={{
      aspectRatio: ratio,
      border: '1px dashed rgba(59,52,95,0.18)',
      background: 'var(--nk-well)',
      borderRadius: 14,
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      ...style,
    }}
  >
    <span style={{ fontSize: 12, color: 'rgba(43,39,64,0.55)', fontStyle: 'italic', textAlign: 'center', padding: '0 10px' }}>{label}</span>
  </div>
);
