import React, { useRef } from 'react';
import { photoUrl as P } from '../utils/photoUrl';
import { NkHeroSlideshow, NkPhotoSlot, useNkPageMotion } from '../components/nocturne/motion';



const sectionHead = (title: string, subtitle: string) => (
  <div
    className="flex flex-wrap items-baseline gap-3 md:gap-[18px]"
    style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}
  >
    <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>{title}</h2>
    <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>{subtitle}</span>
  </div>
);

const CERTIFICATES = [
  { name: 'Curtis Wei', role: 'OneKey co-founder' },
  { name: 'Jack Wang', role: 'OneKey co-founder' },
  { name: 'Alex Zhang', role: 'Vanstring leader' },
];

const MOMENTS = [
  { img: P('/pics/vanstring_member_1.jpg'), alt: 'Quartet performing for seniors in wheelchairs' },
  { img: P('/pics/vanstring_member_2.jpg'), alt: 'String players in a senior-home lounge' },
  { img: P('/pics/vanstring_team.jpg'), alt: 'Two cellists mid-performance' },
  { img: P('/pics/donationbox.JPG'), alt: 'A young performer beside the donation box' },
];

const Fundraisers: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      {/* masthead: the number first */}
      <div className="px-6 pt-10 md:px-16 md:pt-16" style={{ position: 'relative' }}>
        <div
          className="hidden md:block"
          style={{
            position: 'absolute', right: 56, top: 36, fontFamily: 'var(--nk-serif)', fontStyle: 'italic',
            fontSize: 230, lineHeight: 1, color: 'rgba(124,92,255,0.08)', pointerEvents: 'none',
          }}
        >
          10
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="w-7 md:w-11" style={{ height: 1, background: 'var(--nk-blue)', flex: 'none' }} />
          <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            Fundraiser partner · Richmond Hospital Foundation · Vanstring's partnership
          </span>
        </div>
        <div className="nk-fade" style={{ marginTop: 40 }}>
          <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 21, color: 'var(--nk-ink-85)' }}>
            Across ten years, we've donated
          </div>
          <div
            className="text-[64px] md:text-[150px]"
            style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}
          >
            <span className="nk-count" data-target="52000" data-prefix="$" data-suffix="+">
              $52,000+
            </span>
          </div>
          <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 21, color: 'var(--nk-ink-85)' }}>
            to the Richmond Hospital Foundation — presented in person, cheque by cheque.
          </div>
        </div>
      </div>

      {/* hero plate */}
      <div className="nk-fade mx-6 md:ml-32 md:mr-0">
        <NkHeroSlideshow
          slides={[{ src: P('/pics/RHFcheck2025.jpg'), alt: 'Group with the 2025 cheque outside the hospital Main Entrance' }]}
          height="clamp(280px, 36vw, 520px)"
          margin="48px 0 0"
          showDots={false}
        />
      </div>

      {/* about */}
      <div
        className="nk-fade mx-6 mt-12 grid grid-cols-1 gap-6 md:mx-16 md:mt-20 md:grid-cols-[380px_1fr] md:gap-16"
        style={{ borderTop: '1px solid var(--nk-line-20)', paddingTop: 44 }}
      >
        <div>
          <span style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>About this partnership</span>
          <div className="text-[30px] md:text-[42px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.1, marginTop: 14 }}>
            A decade of <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>giving back.</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-9">
          <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: 'var(--nk-ink-90)', textAlign: 'justify' }}>
            This is Vanstring's longest-running fundraising partnership — about ten years of concerts whose proceeds go to the Richmond
            Hospital Foundation, presented in person at the hospital each season.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: 'var(--nk-ink-90)', textAlign: 'justify' }}>
            The cheques are signed from the Cecilia &amp; Kevin Music School, where the ensembles rehearse; in December 2023 the Foundation
            returned the gesture with Certificates of Appreciation for the fundraiser's leads.
          </p>
        </div>
      </div>

      {/* cheque cards */}
      <div className="nk-fade px-6 pt-12 md:px-16 md:pt-[72px]">
        {sectionHead('Cheque presentations', 'from the archive — more years to come')}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div style={{ borderRadius: 16, border: '1px solid rgba(124,92,255,0.4)', background: 'var(--nk-panel)', padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <img className="nk-plate" src={P('/pics/RHFcheck2025.jpg')} alt="2025 cheque presentation outside the Main Entrance" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--nk-serif)', fontSize: 40, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>$2,905</span>
              <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--nk-ink-85)' }}>2025</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nk-accent-300)', border: '1px solid rgba(124,92,255,0.5)', padding: '4px 12px', borderRadius: 999 }}>
                Most recent
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--nk-ink-78)', lineHeight: 1.6 }}>Presented outside the Main Entrance, Milan Ilich Pavilion.</div>
          </div>
          <div style={{ borderRadius: 16, border: '1px solid var(--nk-line-17)', background: 'var(--nk-panel)', padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <img className="nk-plate" src={P('/pics/RHFcheck.JPG')} alt="December 2023 cheque presentation at the Richmond Hospital Foundation wall" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--nk-serif)', fontSize: 40, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>$3,996.30</span>
              <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--nk-ink-85)' }}>Dec 27, 2023</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', border: '1px solid rgba(124,92,255,0.4)', padding: '4px 12px', borderRadius: 999 }}>
                "Gift of Health"
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--nk-ink-78)', lineHeight: 1.6 }}>From "Cecilia &amp; Kevin Music School."</div>
          </div>
        </div>
      </div>

      {/* certificates */}
      <div className="nk-fade px-6 pt-12 md:px-16 md:pt-[72px]">
        {sectionHead('Certificates of Appreciation', 'December 2023')}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CERTIFICATES.map(c => (
            <figure key={c.name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <NkPhotoSlot ratio="3/4" />
              <figcaption style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 21, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--nk-ink-78)' }}>{c.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* performance moments */}
      <div className="nk-fade px-6 pb-16 pt-12 md:px-16 md:pb-[88px] md:pt-[72px]">
        {sectionHead('Performance moments', 'on the ground at Richmond Hospital')}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MOMENTS.map(m => (
            <img key={m.img} className="nk-plate" src={m.img} alt={m.alt} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fundraisers;
