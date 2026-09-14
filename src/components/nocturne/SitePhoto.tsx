import React, { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { apiService } from '../../services/firebaseService';
import { useAuthStore } from '../../store/authStore';

/**
 * Admin-editable photo slots. Every designed photo placement on the site is a
 * <SitePhoto slot="..."> with a stable slot name. A logged-in admin sees a
 * small "photo" button on each slot, right where it lives on the page —
 * clicking it uploads a replacement, saved instantly for everyone. New slots
 * added in code are editable automatically; nothing extra to build in admin.
 */

interface SitePhotoState {
  photos: Record<string, string>;
  loaded: boolean;
  fetch: () => Promise<void>;
  save: (slot: string, url: string | null) => Promise<string | null>;
}

export const useSitePhotos = create<SitePhotoState>((set, get) => ({
  photos: {},
  loaded: false,
  fetch: async () => {
    if (get().loaded) return;
    const res = await apiService.getSitePhotos();
    if (res.success && res.data) set({ photos: res.data.photos, loaded: true });
    else set({ loaded: true });
  },
  save: async (slot, url) => {
    const next = { ...get().photos };
    if (url) next[slot] = url;
    else delete next[slot];
    const res = await apiService.updateSitePhotos(next);
    if (!res.success) return res.error ?? 'Save failed';
    set({ photos: next });
    return null;
  },
}));

/** Resolve a slot to its current URL (admin override, else the code default). */
export const useSitePhotoUrl = (slot: string, fallback?: string): string | undefined => {
  const mapped = useSitePhotos(s => s.photos[slot]);
  const fetch = useSitePhotos(s => s.fetch);
  useEffect(() => { fetch(); }, [fetch]);
  return mapped ?? fallback;
};

const overlayBtn: React.CSSProperties = {
  display: 'inline-grid',
  placeItems: 'center',
  width: 30,
  height: 30,
  border: '1px solid rgba(124,92,255,0.55)',
  borderRadius: 999,
  background: '#ffffff',
  color: 'var(--nk-accent-400)',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(59,52,95,0.2)',
};

export const SlotEditor: React.FC<{ slot: string; hasOverride: boolean }> = ({ slot, hasOverride }) => {
  const save = useSitePhotos(s => s.save);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const up = await apiService.uploadImage(file);
    if (up.success && up.data) {
      const err = await save(slot, up.data.filePath);
      if (err) window.alert(`Could not save photo: ${err}`);
    } else {
      window.alert('Upload failed — try a smaller image (max 12 MB).');
    }
    setBusy(false);
  };

  return (
    <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 6, display: 'flex', gap: 6 }}>
      <button
        aria-label={`Change photo (${slot})`}
        title={`Change this photo · slot: ${slot}`}
        style={overlayBtn}
        disabled={busy}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          fileRef.current?.click();
        }}
      >
        {busy ? (
          <span style={{ width: 12, height: 12, border: '2px solid rgba(124,92,255,0.3)', borderTopColor: 'var(--nk-accent)', borderRadius: '50%', animation: 'ok-spin 0.9s linear infinite' }} />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        )}
      </button>
      {hasOverride && (
        <button
          aria-label="Restore default photo"
          title="Restore the default photo"
          style={overlayBtn}
          disabled={busy}
          onClick={async e => {
            e.preventDefault();
            e.stopPropagation();
            setBusy(true);
            await save(slot, null);
            setBusy(false);
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onFile(e.target.files?.[0] ?? undefined)} />
    </span>
  );
};

interface SitePhotoProps {
  slot: string;
  fallback?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Aspect ratio for the empty-slot placeholder (defaults to 4/3). */
  ratio?: string;
  placeholderLabel?: string;
  loading?: 'lazy' | 'eager';
}

export const SitePhoto: React.FC<SitePhotoProps> = ({ slot, fallback, alt, className, style, ratio = '4/3', placeholderLabel = 'photo slot', loading }) => {
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const canEdit = !!(isAuthenticated && user && hasPermission('basic_admin'));
  const mapped = useSitePhotos(s => s.photos[slot]);
  const fetch = useSitePhotos(s => s.fetch);
  useEffect(() => { fetch(); }, [fetch]);
  const url = mapped ?? fallback;

  return (
    <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
      {url ? (
        <img className={className} src={url} alt={alt} loading={loading} style={{ width: '100%', ...style }} />
      ) : (
        <span
          className={className}
          style={{
            aspectRatio: ratio,
            border: '1px dashed rgba(59,52,95,0.18)',
            background: 'var(--nk-well)',
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            width: '100%',
            outline: 'none',
            filter: 'none',
            ...style,
          }}
        >
          <span style={{ fontSize: 12, color: 'rgba(43,39,64,0.55)', fontStyle: 'italic', textAlign: 'center', padding: '0 10px' }}>
            {placeholderLabel}
            {canEdit ? ' — use the camera button to add one' : ''}
          </span>
        </span>
      )}
      {canEdit && <SlotEditor slot={slot} hasOverride={!!mapped} />}
    </span>
  );
};
