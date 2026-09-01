import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const JOIN_MAILTO = 'mailto:on3keymusic@gmail.com?subject=Joining%20OneKey';

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(43,39,64,0.9)',
  paddingBottom: 3,
  borderBottom: '1px solid transparent',
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: 'var(--nk-accent-400)',
  borderBottom: '1px solid var(--nk-accent)',
};

interface DropItem {
  label: string;
  to: string;
}

const ABOUT_ITEMS: DropItem[] = [
  { label: 'About OneKey', to: '/about' },
  { label: 'Vanstring', to: '/vanstring' },
  { label: 'Highlights', to: '/highlights' },
];

const FUNDRAISER_ITEMS: DropItem[] = [
  { label: 'Richmond Hospital Foundation', to: '/fundraisers' },
  { label: 'Vancouver Aquarium Donation Concert', to: '/fundraisers/vancouver-aquarium' },
  { label: 'Voluntary Teaching for China', to: '/vtc' },
];

const Brand: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <Link
    to="/"
    style={{ fontFamily: 'var(--nk-serif)', fontSize: size, fontWeight: 500, color: 'var(--nk-ink)', marginRight: 'auto' }}
  >
    One<span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>Key</span>
  </Link>
);

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDd, setOpenDd] = useState<string | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDd(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // close an open dropdown on outside click or Escape
  useEffect(() => {
    if (!openDd) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('.nk-dd')) setOpenDd(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDd(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openDd]);

  const isAboutActive = ['/about', '/vanstring', '/highlights'].includes(pathname);
  const isFundActive = pathname.startsWith('/fundraisers') || pathname === '/vtc';

  const dropdown = (key: string, label: string, items: DropItem[], active: boolean) => {
    const isOpen = openDd === key;
    return (
      <div
        className={`nk-dd ${isOpen ? 'open' : ''}`}
        style={{ display: 'flex', alignItems: 'center' }}
        onMouseEnter={() => setOpenDd(key)}
        onMouseLeave={() => setOpenDd(o => (o === key ? null : o))}
      >
        <button
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setOpenDd(o => (o === key ? null : key))}
          style={{
            ...(active ? activeLinkStyle : linkStyle),
            background: 'none',
            border: 'none',
            borderBottom: (active ? activeLinkStyle : linkStyle).borderBottom,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            paddingBottom: 3,
          }}
        >
          {label}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div className="nk-dd-panel">
          {items.map(it => (
            <Link key={it.to} to={it.to}>
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 80, background: '#ffffff', fontFamily: 'var(--nk-body)' }}>
      {/* desktop */}
      <div
        className="hidden md:flex"
        style={{ alignItems: 'center', gap: 34, padding: '26px 64px', borderBottom: '1px solid var(--nk-line-20)' }}
      >
        <Brand />
        <Link to="/" style={pathname === '/' ? activeLinkStyle : linkStyle}>
          Home
        </Link>
        {dropdown('about', 'About', ABOUT_ITEMS, isAboutActive)}
        {dropdown('fund', 'Fundraisers', FUNDRAISER_ITEMS, isFundActive)}
        <Link to="/timeline" style={pathname === '/timeline' ? activeLinkStyle : linkStyle}>
          Timeline
        </Link>
        <Link to="/team" style={pathname === '/team' ? activeLinkStyle : linkStyle}>
          Team
        </Link>
        <a
          href={JOIN_MAILTO}
          style={{
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--nk-accent-400)',
            border: '1px solid var(--nk-accent)',
            padding: '9px 20px',
            borderRadius: 999,
          }}
        >
          Join us
        </a>
      </div>

      {/* phone bar */}
      <div
        className="flex md:hidden"
        style={{ alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--nk-line-20)' }}
      >
        <Brand size={20} />
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer' }}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b2740" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 5l14 14" />
              <path d="M19 5L5 19" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b2740" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* phone full-screen menu */}
      {menuOpen && (
        <div
          className="md:hidden nk-grain"
          style={{
            position: 'fixed',
            inset: 0,
            top: 57,
            background: '#ffffff',
            zIndex: 79,
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            overflowY: 'auto',
            fontFamily: 'var(--nk-body)',
          }}
        >
          {[
            { label: 'Home', to: '/' },
            { label: 'About', to: '/about' },
            { label: 'Vanstring', to: '/vanstring' },
            { label: 'Highlights', to: '/highlights' },
            { label: 'Fundraisers', to: '/fundraisers' },
            { label: 'Vancouver Aquarium', to: '/fundraisers/vancouver-aquarium' },
            { label: 'Voluntary Teaching for China', to: '/vtc' },
            { label: 'Timeline', to: '/timeline' },
            { label: 'Team', to: '/team' },
          ].map(it => (
            <Link
              key={it.to}
              to={it.to}
              style={{
                fontFamily: 'var(--nk-serif)',
                fontSize: 30,
                fontWeight: 500,
                color: pathname === it.to ? 'var(--nk-accent-400)' : 'var(--nk-ink)',
                borderBottom: '1px solid var(--nk-line-17)',
                paddingBottom: 14,
              }}
            >
              {it.label}
            </Link>
          ))}
          <a
            href={JOIN_MAILTO}
            style={{
              alignSelf: 'flex-start',
              fontSize: 13,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--nk-accent-400)',
              border: '1px solid var(--nk-accent)',
              padding: '14px 30px',
              borderRadius: 999,
              marginTop: 8,
            }}
          >
            Join us
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
