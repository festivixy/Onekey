import React, { useEffect, useRef } from 'react';
import { photoUrl as P } from '../utils/photoUrl';
import { Link } from 'react-router-dom';
import { BEHOLD_FEED_ID, INSTAGRAM_URL } from '../config/instagram';
import { NkHeroSlideshow, useNkPageMotion } from '../components/nocturne/motion';
import { usePhotoStore } from '../store/photoStore';
import { SitePhoto, SlotEditor, useSitePhotos } from '../components/nocturne/SitePhoto';
import { useAuthStore } from '../store/authStore';



const HISTORY = [
  { img: P('/pics/vanstring_history.jpg'), alt: 'Orchestra on stage with a projector screen', caption: 'On stage', slot: 'vanstring-history-1' },
  { img: P('/pics/old.JPG'), alt: 'The orchestra in an earlier season', caption: 'An earlier season', slot: 'vanstring-history-2' },
  { img: P('/pics/covidvanstring.JPG'), alt: 'A masked Vanstring rehearsal during the pandemic', caption: 'Masked rehearsal, pandemic era', slot: 'vanstring-history-3' },
  { img: P('/pics/ecrc.jpg'), alt: 'Orchestra performing in a church with stained glass', caption: 'ECRC 2023 · church concert', slot: 'vanstring-history-4' },
];

const VanstringHome: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useNkPageMotion(rootRef);

  const fetchPhotos = usePhotoStore(st => st.fetchPhotos);
  const uploaded = usePhotoStore(st => st.photos.filter(p => p.category === 'vanstring'));
  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);
  const photoMap = useSitePhotos(st => st.photos);
  const fetchSitePhotos = useSitePhotos(st => st.fetch);
  useEffect(() => { fetchSitePhotos(); }, [fetchSitePhotos]);
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const canEdit = !!(isAuthenticated && user && hasPermission('basic_admin'));
  const heroSrc = photoMap['vanstring-hero'] ?? P('/pics/vanstring.jpg');

  // Load the Behold widget script once, only when a feed ID is configured
  useEffect(() => {
    if (!BEHOLD_FEED_ID) return;
    if (document.querySelector('script[data-behold-widget]')) return;
    const script = document.createElement('script');
    script.src = 'https://w.behold.so/widget.js';
    script.type = 'module';
    script.setAttribute('data-behold-widget', 'true');
    document.body.appendChild(script);
  }, []);

  return (
    <div ref={rootRef} className="nk-page nk-grain">
      {/* hero */}
      <div className="px-6 pt-10 md:px-16 md:pt-[76px]" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
          <span className="w-7 md:w-11" style={{ height: 1, background: 'var(--nk-blue)', flex: 'none' }} />
          <span className="text-[10px] md:text-xs" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            Partner ensemble · led by Alex Zhang
          </span>
        </div>
        <div className="nk-line" style={{ overflow: 'hidden' }}>
          <div
            className="text-[52px] md:text-[104px]"
            style={{ paddingBottom: '0.12em', marginBottom: '-0.04em', fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.02, letterSpacing: '-0.005em' }}
          >
            Van<span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>string.</span>
          </div>
        </div>
      </div>
      <div className="nk-fade mx-6 md:ml-32 md:mr-0" style={{ position: 'relative' }}>
        <NkHeroSlideshow
          key={heroSrc}
          slides={[{ src: heroSrc, alt: 'The full Vanstring orchestra on stage under blue lighting' }]}
          height="clamp(280px, 37vw, 540px)"
          margin="36px 0 0"
          showDots={false}
        />
        {canEdit && <SlotEditor slot="vanstring-hero" hasOverride={!!photoMap['vanstring-hero']} />}
      </div>

      {/* about + leader */}
      <div
        className="nk-fade mx-6 mt-12 grid grid-cols-1 gap-8 md:mx-16 md:mt-20 md:grid-cols-[1fr_360px] md:gap-[72px]"
        style={{ borderTop: '1px solid var(--nk-line-20)', paddingTop: 44, alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>The orchestra</span>
          <div className="text-[30px] md:text-[44px]" style={{ fontFamily: 'var(--nk-serif)', fontWeight: 500, lineHeight: 1.1 }}>
            A student string orchestra with <span style={{ fontStyle: 'italic', color: 'var(--nk-royal)' }}>a decade of giving.</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: 'var(--nk-ink-90)', maxWidth: '60ch', textAlign: 'justify' }}>
            Vanstring is OneKey's partner ensemble — a student string orchestra led by Alex Zhang, rehearsing at the C&amp;K studio and
            performing across Greater Vancouver. Its Richmond Hospital Foundation fundraiser is the group's longest-running partnership:
            about ten years, $52,000+ donated in total.
          </p>
          <Link to="/fundraisers" style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>
            The Richmond Hospital partnership →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SitePhoto slot="vanstring-leader" fallback={P('/pics/alexzhang.jpg')} alt="Alex Zhang in a suit by a window" className="nk-plate" style={{ aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top' }} />
            <figcaption>
              <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 22, fontWeight: 700 }}>Alex Zhang</div>
              <div style={{ fontSize: 12, color: 'var(--nk-ink-78)' }}>Leader · General Manager, Vanstring</div>
            </figcaption>
          </figure>
        </div>
      </div>

      {/* history band */}
      <div className="nk-fade px-6 pt-12 md:px-16 md:pt-20">
        <div className="flex flex-wrap items-baseline gap-3 md:gap-[18px]" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}>
          <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>A short history</h2>
          <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>including the masked years</span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" style={{ alignItems: 'start' }}>
          {HISTORY.map(h => (
            <figure key={h.img} style={{ margin: 0 }}>
              <SitePhoto slot={h.slot} fallback={h.img} alt={h.alt} loading="lazy" className="nk-plate" style={{ aspectRatio: '4/3', objectFit: 'cover' }} />
              <figcaption style={{ fontSize: 11, marginTop: 6, color: 'var(--nk-ink-72)' }}>{h.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* uploaded gallery */}
      {uploaded.length > 0 && (
        <div className="nk-fade px-6 pt-12 md:px-16 md:pt-20">
          <div className="flex flex-wrap items-baseline gap-3 md:gap-[18px]" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}>
            <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>From the archive</h2>
            <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nk-ink-78)' }}>added by the team</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {uploaded.map(p => (
              <img key={p.id} className="nk-plate" src={p.url} alt={p.filename} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      )}

      {/* instagram */}
      <div className="nk-fade px-6 pt-12 md:px-16 md:pt-20">
        <div className="flex flex-wrap items-baseline gap-3 md:gap-[18px]" style={{ borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 14, marginBottom: 26 }}>
          <h2 className="text-[24px] md:text-[32px]" style={{ fontWeight: 700 }}>On Instagram</h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            @vanstringcm
          </a>
        </div>
        {BEHOLD_FEED_ID ? (
          <div style={{ borderRadius: 14, border: '1px solid var(--nk-line-17)', background: 'var(--nk-panel)', padding: 16 }}>
            <behold-widget feed-id={BEHOLD_FEED_ID} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="nk-ig">
                <span style={{ fontSize: 11, color: 'rgba(43,39,64,0.55)' }}>post</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* team photo close */}
      <div className="nk-fade mt-12 md:mt-20" style={{ borderTop: '1px solid var(--nk-line-20)', background: 'var(--nk-well)', position: 'relative', overflow: 'hidden' }}>
        <div className="flex justify-center px-6 py-9 md:px-16 md:py-11" style={{ position: 'relative' }}>
          <figure style={{ margin: 0, maxWidth: 880, width: '100%' }}>
            <SitePhoto
              slot="vanstring-team-photo"
              fallback={P('/pics/vanstring_member_3.jpg')}
              alt='Vanstring members posing before the "Vanstring" screen'
              loading="lazy"
              className="nk-plate"
              style={{ aspectRatio: '3/2', objectFit: 'cover' }}
            />
            <figcaption style={{ fontSize: 12, marginTop: 10, color: 'var(--nk-ink-78)', textAlign: 'center' }}>The ensemble, assembled</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
};

export default VanstringHome;
