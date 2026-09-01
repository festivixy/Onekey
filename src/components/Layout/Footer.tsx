import React from 'react';
import { Link } from 'react-router-dom';

const colHead: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--nk-royal)',
};

const Footer: React.FC = () => (
  <footer
    style={{
      borderTop: '1px solid var(--nk-line-20)',
      background: '#ffffff',
      color: 'var(--nk-ink-85)',
      fontFamily: 'var(--nk-body)',
      fontSize: 13,
    }}
  >
    <div
      className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr]"
      style={{ gap: 24, padding: '34px 24px 42px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 20, fontWeight: 500, color: 'var(--nk-ink)' }}>
          One<span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>Key</span>
        </div>
        <div style={{ fontStyle: 'italic', lineHeight: 1.6, maxWidth: '32ch' }}>
          Bridging generations through the universal language of music.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={colHead}>Quick links</div>
        <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>Our Story</Link>
        <Link to="/team" style={{ color: 'inherit', textDecoration: 'none' }}>Meet the Team</Link>
        <Link to="/timeline" style={{ color: 'inherit', textDecoration: 'none' }}>Events &amp; Timeline</Link>
        <Link to="/vanstring" style={{ color: 'inherit', textDecoration: 'none' }}>Vanstring</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={colHead}>Contact us</div>
        <span>4799 Vanguard Road, Unit 301, Richmond, BC</span>
        <span>
          <a href="mailto:on3keymusic@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>on3keymusic@gmail.com</a>
          {' · '}
          <a
            href="https://instagram.com/on3keymusic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OneKey on Instagram"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            @on3keymusic
          </a>
        </span>
        <Link to="/admin" style={{ color: 'var(--nk-ink-58)', fontSize: 12, marginTop: 4, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
