import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePhotoStore } from '../store/photoStore';

gsap.registerPlugin(ScrollTrigger);

const RICHMOND_PHOTO    = `${process.env.PUBLIC_URL}/pics/richmondhospital.jpg`;
const CHECK_2023_PHOTO  = `${process.env.PUBLIC_URL}/pics/richmond_check_2023.jpg`;
const PERFORM_PHOTOS    = [
  { src: `${process.env.PUBLIC_URL}/pics/onekey.jpg`,      alt: 'Vanstring performing at Richmond Hospital' },
  { src: `${process.env.PUBLIC_URL}/pics/onekey_team.jpg`, alt: 'Vanstring team performing at Richmond Hospital' },
];

const TOTAL_RAISED  = 52000;  // cumulative across all years — running counter
const YEARS_ACTIVE  = 10;

const Fundraisers: React.FC = () => {
  const rootRef    = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const fetchPhotos = usePhotoStore(s => s.fetchPhotos);
  const uploadedRH  = usePhotoStore(s => s.photos.filter(p => p.category === 'richmond-hospital'));

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Refresh ScrollTrigger after async photos load
  useEffect(() => {
    if (uploadedRH.length === 0) return;
    const t = setTimeout(() => ScrollTrigger.refresh(), 250);
    return () => clearTimeout(t);
  }, [uploadedRH.length]);

  useLayoutEffect(() => {
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = gsap.context(() => {

      /* ── Initial hidden states (set before paint) ─────────────────── */
      gsap.set('.rh-hero-image',    { scale: 1.04 });
      gsap.set('.rh-hero-eyebrow',  { clipPath: 'inset(0 100% 0 0)', opacity: 0 });
      gsap.set('.rh-hero-title',    { y: 40, opacity: 0 });
      gsap.set('.rh-stat-label',    { y: 30, opacity: 0 });
      gsap.set('.rh-substat',       { y: 24, opacity: 0 });
      gsap.set('.reveal-line',      { y: 30, opacity: 0, clipPath: 'inset(0 0 100% 0)' });

      /* ── Hero entrance ──────────────────────────────────────────────── */
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .to('.rh-hero-image', { scale: 1, duration: 1.6, ease: 'power2.out', delay: 0.1 })
        .to('.rh-hero-eyebrow', { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.7 }, '-=1.2')
        .to('.rh-hero-title',   { y: 0, opacity: 1, duration: 0.85 }, '-=0.4');

      /* ── Hero parallax on scroll ────────────────────────────────────── */
      gsap.to('.rh-hero-image', {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: '.rh-hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
      });

      /* ── Stats — count-up plays once on scroll, stays at max ────────── */
      ScrollTrigger.create({
        trigger: '.rh-stats',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          // Reveal labels and sub-stats
          gsap.to('.rh-stat-label', {
            y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out',
          });
          gsap.to('.rh-substat', {
            y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.3,
          });

          // Animate the big number
          const counter = { val: 0 };
          gsap.to(counter, {
            val: TOTAL_RAISED,
            duration: 2.2,
            delay: 0.2,
            ease: 'power2.out',
            onUpdate: () => {
              if (counterRef.current) {
                counterRef.current.textContent = '$' + Math.round(counter.val).toLocaleString();
              }
            },
          });
        },
      });

      /* ── About text — line-by-line clip-path reveal ─────────────────── */
      gsap.utils.toArray<HTMLElement>('.reveal-line').forEach((line) => {
        gsap.to(line, {
          y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)',
          duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: line, start: 'top 88%', once: true },
        });
      });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative overflow-hidden bg-stone-900">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="rh-hero hero-section" style={{ background: '#1c1917' }}>
        <div className="rh-hero-image hero-section__media" style={{ willChange: 'transform' }}>
          {/* Blurred letterbox fill */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${RICHMOND_PHOTO})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(24px) brightness(0.35)',
            transform: 'scale(1.08)',
          }} />
          <img
            src={RICHMOND_PHOTO}
            alt="Vanstring presenting cheque to Richmond Hospital Foundation"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', position: 'relative', zIndex: 1 }}
          />
        </div>

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, zIndex: 2,
          background: 'linear-gradient(to top, rgba(12,10,9,0.85) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Centered title */}
        <div style={{
          position: 'absolute', bottom: 56, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3,
        }}>
          <p className="rh-hero-eyebrow" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#c8a46e', marginBottom: 8,
          }}>
            Fundraiser Partner
          </p>
          <h1 className="rh-hero-title" style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
            fontWeight: 700, color: '#fafaf9',
            letterSpacing: '-0.02em', textAlign: 'center',
            textShadow: '0 2px 24px rgba(0,0,0,0.8)', margin: 0,
            padding: '0 24px',
          }}>
            Richmond Hospital Foundation
          </h1>
        </div>

        {/* Scroll tug */}
        <motion.div aria-hidden="true"
          style={{
            position: 'absolute', bottom: 18, left: '50%', x: '-50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            pointerEvents: 'none', zIndex: 4,
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
        >
          <div style={{ width: 1.5, height: 24, borderRadius: 2, background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
        </motion.div>
      </section>

      {/* ── Stats — cumulative total + breakdown ─────────────────────── */}
      <section className="rh-stats relative" style={{ padding: '120px 24px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p className="rh-stat-label" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: '#c8a46e', marginBottom: 24,
          }}>
            Across {YEARS_ACTIVE} years, we've donated
          </p>
          <h2 style={{
            fontSize: 'clamp(3.5rem, 9vw, 6rem)', fontWeight: 700, color: '#fafaf9',
            letterSpacing: '-0.04em', lineHeight: 1, margin: 0,
          }}>
            <span ref={counterRef}>$0</span>
            <span style={{ color: '#c8a46e' }}>+</span>
          </h2>
          <p className="rh-stat-label" style={{ fontSize: '1rem', color: '#78716c', marginTop: 16 }}>
            to the Richmond Hospital Foundation
          </p>

          {/* Sub-stat */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
            <div className="rh-substat" style={{
              padding: '20px 32px',
              borderTop: '1px solid rgba(200,164,110,0.18)',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#c8a46e', marginBottom: 8,
              }}>
                Years Partnered
              </p>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fafaf9', margin: 0, letterSpacing: '-0.02em' }}>
                {YEARS_ACTIVE}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <section className="relative" style={{ padding: '40px 24px 120px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p className="reveal-line" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#c8a46e', marginBottom: 16,
          }}>
            About This Partnership
          </p>
          <h2 className="reveal-line" style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: '#fafaf9',
            letterSpacing: '-0.02em', marginBottom: 28,
          }}>
            A decade of giving back
          </h2>
          <p className="reveal-line" style={{ fontSize: '1rem', color: '#a8a29e', lineHeight: 1.8, marginBottom: 16 }}>
            For {YEARS_ACTIVE} years, Vanstring has partnered with the Richmond Hospital Foundation to support patient care and medical services in our community. Each year, our members host charity concerts and performances to raise funds for the Foundation.
          </p>
          <p className="reveal-line" style={{ fontSize: '1rem', color: '#a8a29e', lineHeight: 1.8 }}>
            Every dollar raised goes directly to the Foundation, helping fund equipment, programs, and care that touches thousands of lives in Richmond. It's one of our longest-running commitments, and one we'll continue for as long as our community keeps showing up.
          </p>
        </div>
      </section>

      {/* ── Cheque Presentations gallery ───────────────────────────────── */}
      <section className="relative" style={{ padding: '40px 24px 120px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="reveal-line" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#c8a46e', marginBottom: 16,
          }}>
            Cheque Presentations
          </p>
          <h2 className="reveal-line" style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: '#fafaf9',
            letterSpacing: '-0.02em', marginBottom: 12,
          }}>
            From the archive
          </h2>
          <p className="reveal-line" style={{
            fontSize: '0.95rem', color: '#78716c', marginBottom: 36, lineHeight: 1.7,
          }}>
            A look at select years from our partnership. We don't have photos from every year — but the tradition continues.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>

            {/* 2025 cheque */}
            <div className="reveal-line" style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#231f1c',
              boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
            }}>
              <div style={{ position: 'relative', width: '100%', overflow: 'hidden', aspectRatio: '4/3', background: '#1a1714' }}>
                <img
                  src={RICHMOND_PHOTO}
                  alt="Vanstring presenting cheque to Richmond Hospital Foundation, 2025"
                  style={{
                    width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                  }}
                />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78716c', margin: 0 }}>
                    2025
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fafaf9', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
                    $2,905
                  </p>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(200,164,110,0.12)',
                  border: '1px solid rgba(200,164,110,0.2)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8a46e' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a46e' }}>
                    Most Recent
                  </span>
                </span>
              </div>
            </div>

            {/* 2023 cheque */}
            <div className="reveal-line" style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#231f1c',
              boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
            }}>
              <div style={{ position: 'relative', width: '100%', overflow: 'hidden', aspectRatio: '4/3', background: '#1a1714' }}>
                <img
                  src={CHECK_2023_PHOTO}
                  alt="Vanstring members presenting a cheque to Richmond Hospital Foundation in December 2023"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                    clipPath: 'inset(0 0 13% 0)',
                    transform: 'scale(1.15)',
                    transformOrigin: 'center top',
                  }}
                />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78716c', margin: 0 }}>
                    December 2023
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fafaf9', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
                    $3,996.30
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78716c', margin: 0 }}>
                    Memo
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#a8a29e', margin: '4px 0 0', fontStyle: 'italic' }}>
                    Gift of Health
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Performance Moments at Richmond Hospital ───────────────────── */}
      <section className="relative" style={{ padding: '0 24px 120px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="reveal-line" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#c8a46e', marginBottom: 16,
          }}>
            Performance Moments
          </p>
          <h2 className="reveal-line" style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: '#fafaf9',
            letterSpacing: '-0.02em', marginBottom: 28,
          }}>
            On the ground at Richmond Hospital
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            {PERFORM_PHOTOS.map((p) => (
              <div
                key={p.src}
                className="reveal-line"
                style={{
                  borderRadius: 14, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#231f1c',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
                  aspectRatio: '4/3',
                }}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    display: 'block',
                  }}
                />
              </div>
            ))}
            {uploadedRH.map((photo) => (
              <div
                key={photo.id}
                className="reveal-line"
                style={{
                  borderRadius: 14, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#231f1c',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
                  aspectRatio: '4/3',
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Fundraisers;
