import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="nk-page nk-grain">
    <div className="px-6 py-[90px] text-center md:px-11" style={{ position: 'relative', overflow: 'hidden', minHeight: '60vh' }}>
      <div
        style={{
          position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%,-50%)',
          fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 'clamp(160px, 30vw, 280px)',
          color: 'rgba(124,92,255,0.09)', pointerEvents: 'none',
        }}
      >
        404
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <span style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
          Rest — a silence where a page should be
        </span>
        <div className="text-[32px] md:text-[46px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.1, maxWidth: '16ch' }}>
          This page <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>doesn't exist.</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.75, margin: 0, color: 'var(--nk-ink-85)', maxWidth: '38ch' }}>
          The link may be old, or the address mistyped. Everything that does exist is a step away:
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/"
            style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-accent-400)', border: '1px solid var(--nk-accent)', padding: '12px 26px', borderRadius: 999 }}
          >
            Back home
          </Link>
          <Link
            to="/timeline"
            style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-ink-85)', border: '1px solid var(--nk-line-20)', padding: '12px 26px', borderRadius: 999 }}
          >
            The timeline
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default NotFound;
