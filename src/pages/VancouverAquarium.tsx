import React, { useRef } from 'react';
import { photoUrl as P } from '../utils/photoUrl';
import { useNkPageMotion } from '../components/nocturne/motion';



const VancouverAquarium: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      <div className="grid grid-cols-1 gap-10 px-6 pt-10 md:grid-cols-[1fr_420px] md:gap-[72px] md:px-16 md:pt-[76px]" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="w-7 md:w-11" style={{ height: 1, background: 'var(--nk-blue)', flex: 'none' }} />
            <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
              Donation concert · Ocean Wise / Vancouver Aquarium
            </span>
          </div>
          <p className="nk-fade" style={{ fontSize: 15, lineHeight: 1.85, margin: 0, color: 'var(--nk-ink-90)', maxWidth: '56ch', textAlign: 'justify' }}>
            The C&amp;K Music Studio Virtual Concert Aquarium Fundraiser, run through CanadaHelps in support of the Ocean Wise Conservation
            Association and the Vancouver Aquarium.
          </p>
          <div className="nk-fade" style={{ marginTop: 14 }}>
            <div className="text-[56px] md:text-[96px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              <span className="nk-count" data-target="7715" data-prefix="$">$7,715</span>
            </div>
            <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 19, color: 'var(--nk-ink-85)', marginTop: 10 }}>
              raised of a $5,000 goal
            </div>
            <div className="w-full max-w-[420px]" style={{ height: 5, background: 'var(--nk-line-20)', marginTop: 20, position: 'relative' }}>
              <div className="nk-progress" data-width="100%" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'var(--nk-accent)' }} />
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(43,39,64,0.68)', marginTop: 10 }}>
              154% of goal · via CanadaHelps
            </div>
          </div>
        </div>
        {/* phone-framed screenshot as document */}
        <figure className="nk-fade justify-self-center" style={{ margin: 0 }}>
          <div style={{ width: 300, border: '1px solid var(--nk-line-20)', borderRadius: 34, padding: 12, background: '#f1effa', boxShadow: '0 24px 60px rgba(90,80,180,0.16)' }}>
            <img
              src={P('/pics/aquarium-fundraiser.jpg')}
              alt="An earlier snapshot of the CanadaHelps campaign page, with a sea otter"
              style={{ width: '100%', aspectRatio: '1080/2338', objectFit: 'cover', objectPosition: 'top', borderRadius: 22, display: 'block', background: '#fff' }}
            />
          </div>
          <figcaption style={{ fontSize: 12, marginTop: 12, color: 'var(--nk-ink-72)', textAlign: 'center' }}>The campaign page, kept as evidence</figcaption>
        </figure>
      </div>

      <div className="nk-fade px-6 pb-16 pt-14 md:px-16 md:pb-[88px] md:pt-20">
        <div
          className="flex flex-wrap items-baseline gap-3 md:gap-[18px]"
          style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}
        >
          <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>From the studio</h2>
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>
            studio concert moments
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <img className="nk-plate" src={P('/pics/kidsconcert.JPG')} alt="Young singers in white dresses at a studio concert" loading="lazy" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          <img className="nk-plate" src={P('/pics/decconcert.JPG')} alt="A December studio concert with certificates and balloons" loading="lazy" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
};

export default VancouverAquarium;
