import React, { useRef } from 'react';
import { useNkPageMotion } from '../components/nocturne/motion';

const VTC: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      <div className="px-6 pt-10 md:px-16 md:pt-[76px]">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
          <span className="w-7 md:w-11" style={{ height: 1, background: 'var(--nk-blue)', flex: 'none' }} />
          <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            Volunteer program
          </span>
        </div>
        <div className="nk-line" style={{ overflow: 'hidden' }}>
          <div
            className="text-[40px] md:text-[80px]"
            style={{ paddingBottom: '0.12em', marginBottom: '-0.04em', fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.005em' }}
          >
            Voluntary Teaching <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>for China.</span>
          </div>
        </div>
        <p className="nk-fade" style={{ fontSize: 15, lineHeight: 1.85, margin: '24px 0 0', color: 'var(--nk-ink-78)', maxWidth: '56ch', fontStyle: 'italic' }}>
          The full story of this program — its copy and photographs — is still being gathered. The page holds the same rhythm as our other
          fundraiser pages, and it will fill in as the material arrives.
        </p>
      </div>

      <div
        className="nk-fade mx-6 md:ml-32 md:mr-0"
        style={{ marginTop: 44, height: 'clamp(240px, 30vw, 420px)', border: '1px dashed rgba(59,52,95,0.18)', background: 'var(--nk-well)', display: 'grid', placeItems: 'center' }}
      >
        <div style={{ textAlign: 'center', color: 'rgba(43,39,64,0.62)', fontSize: 13, lineHeight: 1.8, padding: '0 20px' }}>
          Photographs from the program will appear here
          <br />
          <span style={{ fontStyle: 'italic', color: 'rgba(43,39,64,0.55)' }}>check back soon</span>
        </div>
      </div>

      <div className="nk-fade px-6 pt-12 text-center md:px-16 md:pt-20">
        <div style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--nk-ink-85)' }}>in numbers</div>
        <div className="text-[70px] md:text-[110px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1, color: 'rgba(59,52,95,0.25)' }}>—</div>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-ink-58)', marginTop: 10 }}>
          hours taught, students reached — numbers to come
        </div>
      </div>

      <div className="nk-fade px-6 pb-16 pt-12 md:px-16 md:pb-[88px] md:pt-[72px]">
        <div
          className="flex flex-wrap items-baseline gap-3 md:gap-[18px]"
          style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}
        >
          <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>Gallery</h2>
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>awaiting photographs</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', border: '1px dashed rgba(59,52,95,0.18)', background: 'var(--nk-well)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(43,39,64,0.55)', fontStyle: 'italic' }}>photo slot</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VTC;
