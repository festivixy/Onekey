import React, { useRef } from 'react';
import { photoUrl as P } from '../utils/photoUrl';
import { useNkPageMotion } from '../components/nocturne/motion';
import { SitePhoto } from '../components/nocturne/SitePhoto';



const groupHead = (title: string, subtitle: string) => (
  <div className="flex flex-wrap items-baseline gap-3 md:gap-4" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 12, marginBottom: 22 }}>
    <h2 className="text-[22px] md:text-[27px]" style={{ fontWeight: 700 }}>{title}</h2>
    <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--nk-ink-78)' }}>{subtitle}</span>
  </div>
);

const plate = (slot: string, src: string, alt: string, ratio: string, extra?: React.CSSProperties) => (
  <SitePhoto slot={slot} fallback={src} alt={alt} loading="lazy" className="nk-plate" style={{ height: '100%', aspectRatio: ratio === 'auto' ? undefined : ratio, objectFit: 'cover', ...extra }} />
);

const Highlights: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      <div className="px-6 pt-10 md:px-16 md:pt-[76px]">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
          <span className="w-7 md:w-11" style={{ height: 1, background: 'var(--nk-blue)', flex: 'none' }} />
          <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            Concerts · competitions · ceremonies
          </span>
        </div>
        <div className="nk-line" style={{ overflow: 'hidden' }}>
          <div
            className="text-[44px] md:text-[84px]"
            style={{ paddingBottom: '0.12em', marginBottom: '-0.04em', fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.005em' }}
          >
            High<span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>lights.</span>
          </div>
        </div>
      </div>

      {/* GOCAA group */}
      <div className="nk-fade px-6 pt-12 md:px-16 md:pt-16">
        {groupHead('GOCAA festival', 'the timber-roof hall · certificates and octets')}
        <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(6,1fr)', gridAutoRows: 88, gap: 14 }}>
          <div style={{ gridColumn: 'span 4', gridRow: 'span 3' }}>{plate('hl-gocaa-wide', P('/pics/zig.JPG'), 'Violinists lined across the timber-roof stage', 'auto')}</div>
          <div style={{ gridColumn: 'span 2', gridRow: 'span 2' }}>{plate('hl-gocaa-octet', P('/pics/gocaaoctet.JPG'), 'A string octet on the timber-roof stage', 'auto')}</div>
          <div style={{ gridColumn: 'span 2', gridRow: 'span 1' }}>{plate('hl-gocaa-certif', P('/pics/gocaacertif.JPG'), 'Certificates handed out on stage', 'auto')}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {plate('hl-gocaa-wide', P('/pics/zig.JPG'), 'Violinists lined across the timber-roof stage', '4/3')}
          {plate('hl-gocaa-octet', P('/pics/gocaaoctet.JPG'), 'A string octet on the timber-roof stage', '4/3')}
          {plate('hl-gocaa-certif', P('/pics/gocaacertif.JPG'), 'Certificates handed out on stage', '4/3')}
          {plate('hl-gocaa-group', P('/pics/gocaa.JPG'), 'The full festival group on the hall stage', '4/3')}
        </div>
      </div>

      {/* Boston + ceremonies */}
      <div className="nk-fade grid grid-cols-1 gap-10 px-6 pt-12 md:grid-cols-2 md:gap-14 md:px-16 md:pt-14">
        <div>
          {groupHead('Boston, 2023', 'GOCAA at Berklee')}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {plate('hl-boston-1', P('/pics/alexgocaa.JPG'), 'Alex at the GOCAA table inside Boston Conservatory at Berklee', '3/4')}
            {plate('hl-boston-2', P('/pics/gocaagang.JPG'), 'Four members in suits, a candid moment in Boston', '3/4')}
          </div>
        </div>
        <div>
          {groupHead('Ceremonies & stages', 'trophies · grand halls · D.A.R.E.')}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {plate('hl-cere-1', P('/pics/carnegie.JPG'), 'Young performers with certificates on an ornate formal stage', '4/3')}
            {plate('hl-cere-2', P('/pics/studioaward.JPG'), 'Members in suits holding gold trophies', '4/3')}
            {plate('hl-cere-3', P('/pics/DARE.JPG'), 'An outdoor performance at the D.A.R.E. to Care event', '4/3')}
            {plate('hl-cere-4', P('/pics/studioopening.jpg'), 'The ensemble playing at the studio opening', '4/3')}
          </div>
        </div>
      </div>

      {/* studio & stage */}
      <div className="nk-fade px-6 pb-16 pt-12 md:px-16 md:pb-[88px] md:pt-14">
        {groupHead('The studio & the stage', 'moments in and out of rehearsal')}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <figure style={{ margin: 0 }}>
            {plate('hl-studio-1', P('/pics/Slide_2.jpg'), 'A pianist and a violinist in rehearsal', '3/4')}
            <figcaption style={{ fontSize: 11, marginTop: 6, color: 'var(--nk-ink-72)' }}>Rehearsal</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            {plate('hl-studio-2', P('/pics/vanstring_team.jpg'), 'Two cellists mid-performance', '3/4')}
            <figcaption style={{ fontSize: 11, marginTop: 6, color: 'var(--nk-ink-72)' }}>Cellists</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            {plate('hl-studio-3', P('/pics/onekey_cavell.jpg'), 'Kids with instrument cases outside Cavell Gardens, Santa hats on', '3/4')}
            <figcaption style={{ fontSize: 11, marginTop: 6, color: 'var(--nk-ink-72)' }}>Cavell Gardens, Santa hats</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            {plate('hl-studio-4', P('/pics/vanstringsh.jpg'), 'Seniors watching a performance from their seats', '3/4')}
            <figcaption style={{ fontSize: 11, marginTop: 6, color: 'var(--nk-ink-72)' }}>For the residents</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
};

export default Highlights;
