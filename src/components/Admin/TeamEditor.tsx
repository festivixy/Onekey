import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTeamStore, TeamMember, SectionKey } from '../../store/teamStore';
import { apiService } from '../../services/firebaseService';
import { resolveTeamImageSrc } from '../../utils/teamImageUrl';
import {
  ALL_SECTIONS, DEFAULT_TEAM_LAYOUT, TeamLayout, normalizeTeamLayout, sectionLayoutOf,
} from '../../config/teamLayout';
import { SECTION_LABELS } from '../../pages/MeetOurTeam';

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

const Ic = {
  pencil: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(43,39,64,0.62)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(43,39,64,0.62)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(43,39,64,0.72)" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
  undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nk-accent-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" /></svg>,
};

type FormState = {
  name: string; role: string; school: string; bio: string; instagram: string;
  sections: SectionKey[]; isActive: boolean;
};

const BLANK_FORM: FormState = { name: '', role: '', school: '', bio: '', instagram: '', sections: [], isActive: true };

/** Center-crop a photo to a square with zoom, matching the card preview. */
async function cropSquare(file: File, zoom: number): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const size = 640;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    const base = Math.min(img.width, img.height) / zoom;
    const sx = (img.width - base) / 2;
    const sy = Math.max((img.height - base) * 0.3, 0); // bias toward faces near the top
    ctx.drawImage(img, sx, sy, base, base, 0, 0, size, size);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '_sq.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const label: React.CSSProperties = { fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-ink-72)' };

const TeamEditor: React.FC = () => {
  const { teamMembers, fetchTeamMembers, addTeamMember, updateTeamMember, removeTeamMember } = useTeamStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState<'members' | 'layout'>(searchParams.get('view') === 'layout' ? 'layout' : 'members');
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | SectionKey>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSection, setBulkSection] = useState<SectionKey>('leadership');

  // side panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [dirty, setDirty] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // layout draft
  const [layout, setLayout] = useState<TeamLayout>(DEFAULT_TEAM_LAYOUT);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [layoutSection, setLayoutSection] = useState<SectionKey>('founders');
  const [previewBp, setPreviewBp] = useState<'desktop' | 'tablet' | 'phone'>('desktop');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { fetchTeamMembers(); }, [fetchTeamMembers]);
  useEffect(() => {
    apiService.getTeamLayout().then(res => {
      if (res.success && res.data && res.data.layout) setLayout(normalizeTeamLayout(res.data.layout));
    });
  }, []);

  // deep link: ?edit=<id>
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && teamMembers.length > 0) {
      const m = teamMembers.find(t => t.id === editId);
      if (m) openEdit(m);
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers.length]);

  const openAdd = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setZoom(1);
    setDirty(false);
    setPanelError(null);
    setPanelOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setForm({ name: m.name, role: m.role, school: m.school, bio: m.bio, instagram: m.instagram, sections: m.sections, isActive: m.isActive });
    setPhotoFile(null);
    setPhotoPreview(resolveTeamImageSrc(m.image));
    setZoom(1);
    setDirty(false);
    setPanelError(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    setPanelOpen(false);
    setDirty(false);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const onPhotoChosen = (file: File | undefined) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setZoom(1);
    setDirty(true);
  };

  const save = async (andAnother: boolean) => {
    if (!form.name.trim()) { setPanelError('A name is required.'); return; }
    if (form.sections.length === 0) { setPanelError('Pick at least one section.'); return; }
    setSaving(true);
    setPanelError(null);
    try {
      let image: string | undefined;
      if (photoFile) {
        const cropped = await cropSquare(photoFile, zoom);
        const up = await apiService.uploadImage(cropped);
        if (up.success && up.data) image = up.data.filePath;
        else { setPanelError('Photo upload failed — member saved without a new photo.'); }
      }
      const payload = { ...form, image: image ?? (editingId ? teamMembers.find(t => t.id === editingId)?.image ?? '' : ''), group: undefined, concertmasterType: undefined };
      const ok = editingId ? await updateTeamMember(editingId, payload) : await addTeamMember(payload);
      if (!ok) { setPanelError('Save failed — try again.'); return; }
      setDirty(false);
      setToast({ text: `"${form.name}" saved` });
      if (andAnother) openAdd();
      else setPanelOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (m: TeamMember) => {
    await updateTeamMember(m.id, { isActive: false });
    setToast({ text: `"${m.name}" deactivated`, undo: () => updateTeamMember(m.id, { isActive: true }) });
  };

  const bulk = async (action: 'move' | 'deactivate') => {
    const ids = Array.from(selected);
    for (const id of ids) {
      const m = teamMembers.find(t => t.id === id);
      if (!m) continue;
      if (action === 'deactivate') await updateTeamMember(id, { isActive: false });
      else await updateTeamMember(id, { sections: Array.from(new Set([...m.sections, bulkSection])) });
    }
    setSelected(new Set());
    setToast({ text: action === 'deactivate' ? `${ids.length} deactivated` : `${ids.length} moved to ${SECTION_LABELS[bulkSection]}` });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return teamMembers.filter(m => {
      const matches = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.school.toLowerCase().includes(q);
      const inSection = sectionFilter === 'all' || m.sections.includes(sectionFilter);
      return matches && inSection;
    });
  }, [teamMembers, search, sectionFilter]);

  const active = filtered.filter(m => m.isActive);
  const inactive = filtered.filter(m => !m.isActive);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── layout helpers ─────────────────────────────────────────────────────────
  const sl = sectionLayoutOf(layout, layoutSection);
  const patchSection = (patch: Partial<typeof sl>, all = false) => {
    setLayout(l => {
      const keys = all ? ALL_SECTIONS : [layoutSection];
      const sections = { ...l.sections };
      keys.forEach(k => { sections[k] = { ...sectionLayoutOf(l, k), ...patch }; });
      return { ...l, sections };
    });
    setLayoutDirty(true);
  };
  const moveSection = (key: SectionKey, dir: number) => {
    setLayout(l => {
      const order = [...l.order];
      const i = order.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return l;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...l, order };
    });
    setLayoutDirty(true);
  };
  const toggleHidden = (key: SectionKey) => {
    setLayout(l => ({ ...l, hidden: l.hidden.includes(key) ? l.hidden.filter(h => h !== key) : [...l.hidden, key] }));
    setLayoutDirty(true);
  };
  const publish = async () => {
    setPublishing(true);
    const res = await apiService.updateTeamLayout(layout);
    setPublishing(false);
    if (res.success) { setLayoutDirty(false); setToast({ text: 'Layout published' }); }
    else setToast({ text: `Publish failed: ${res.error ?? 'unknown error'}` });
  };

  const previewMembers = (teamMembers.filter(m => m.sections.includes(layoutSection) && m.isActive)).slice(0, 8);
  const previewCols = sl.perRow[previewBp];
  const previewWidth = previewBp === 'desktop' ? '100%' : previewBp === 'tablet' ? 640 : 360;

  const stepBtn: React.CSSProperties = { padding: '6px 10px', fontWeight: 500, color: 'var(--nk-accent-400)', cursor: 'pointer', borderLeft: '1px solid rgba(59,52,95,0.17)', borderRight: '1px solid rgba(59,52,95,0.17)', userSelect: 'none' };

  return (
    <div style={{ background: '#ffffff', color: 'var(--nk-ink)', fontFamily: 'var(--nk-body)', borderRadius: 14, border: '1px solid var(--nk-line-20)', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--nk-line-20)' }}>
        <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 21, fontWeight: 700 }}>Team</div>
        <div style={{ display: 'flex', border: '1px solid rgba(59,52,95,0.18)', borderRadius: 999, overflow: 'hidden' }}>
          {(['members', 'layout'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '7px 16px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: view === v ? 'rgba(59,116,232,0.12)' : 'transparent',
                color: view === v ? 'var(--nk-accent-300)' : 'var(--nk-ink-78)',
              }}
            >
              {v === 'members' ? 'Members' : 'Page layout'}
            </button>
          ))}
        </div>
        {view === 'layout' && (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {layoutDirty && (
              <span style={{ fontSize: 12, color: 'var(--nk-accent-300)', border: '1px solid rgba(124,92,255,0.5)', background: 'rgba(124,92,255,0.08)', padding: '7px 14px', borderRadius: 10 }}>
                Draft — not published
              </span>
            )}
            <button className="ad-btn2" onClick={() => { setLayout(DEFAULT_TEAM_LAYOUT); setLayoutDirty(true); }}>Reset to defaults</button>
            <button className="ad-btn" onClick={publish} disabled={publishing}>{publishing ? 'Publishing…' : 'Publish'}</button>
          </span>
        )}
      </div>

      {view === 'members' ? (
        <div style={{ display: 'grid', gridTemplateColumns: panelOpen ? '1fr 400px' : '1fr' }}>
          {/* list */}
          <div style={{ padding: '22px 24px', borderRight: panelOpen ? '1px solid var(--nk-line-20)' : 'none', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 320 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>{Ic.search}</span>
                <input className="ad-input" style={{ paddingLeft: 36 }} placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="ad-input" style={{ width: 180 }} value={sectionFilter} onChange={e => setSectionFilter(e.target.value as 'all' | SectionKey)}>
                <option value="all">All sections</option>
                {ALL_SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
              </select>
              <button className="ad-btn" style={{ marginLeft: 'auto' }} onClick={openAdd}>+ Add member</button>
            </div>

            {selected.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: '1px solid rgba(124,92,255,0.4)', background: 'rgba(124,92,255,0.07)', marginBottom: 14, fontSize: 12, borderRadius: 10, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--nk-accent-300)' }}>{selected.size} selected</span>
                <select className="ad-input" style={{ width: 170, padding: '5px 8px' }} value={bulkSection} onChange={e => setBulkSection(e.target.value as SectionKey)}>
                  {ALL_SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
                </select>
                <button className="ad-btn2" style={{ padding: '6px 12px' }} onClick={() => bulk('move')}>Add to section</button>
                <button className="ad-btn2" style={{ padding: '6px 12px' }} onClick={() => bulk('deactivate')}>Deactivate</button>
                <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--nk-ink-58)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Clear</button>
              </div>
            )}

            <div className="ad-row" style={{ borderTop: '1px solid var(--nk-line-17)', color: 'rgba(43,39,64,0.68)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              <span /><span>Photo</span><span>Name</span><span>Role</span><span>Sections</span><span>Active</span><span />
            </div>

            {active.map(m => {
              const img = resolveTeamImageSrc(m.image);
              return (
                <div key={m.id} className="ad-row" style={selected.has(m.id) ? { background: 'rgba(124,92,255,0.05)' } : undefined}>
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} />
                  {img ? <img className="ad-thumb" src={img} alt="" /> : <div className="ad-init">{initialsOf(m.name)}</div>}
                  <span style={{ fontWeight: 500, fontFamily: 'var(--nk-serif)', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  <span style={{ color: 'var(--nk-ink-85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role}</span>
                  <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {m.sections.map(s => (
                      <span key={s} className="ad-tag" style={s === 'founders' ? { borderColor: 'rgba(124,92,255,0.5)', color: 'var(--nk-accent-300)' } : undefined}>
                        {SECTION_LABELS[s]}
                      </span>
                    ))}
                  </span>
                  <button className="ad-toggle" aria-label="Deactivate member" onClick={() => deactivate(m)} />
                  <span style={{ display: 'flex', gap: 8, color: 'rgba(43,39,64,0.62)' }}>
                    <button aria-label="Edit" onClick={() => openEdit(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}>{Ic.pencil}</button>
                    {confirmDeleteId === m.id ? (
                      <span style={{ fontSize: 11, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => { removeTeamMember(m.id); setConfirmDeleteId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontFamily: 'inherit', fontSize: 11 }}>Delete?</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nk-ink-58)', fontFamily: 'inherit', fontSize: 11 }}>No</button>
                      </span>
                    ) : (
                      <button aria-label="Delete" onClick={() => setConfirmDeleteId(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}>{Ic.trash}</button>
                    )}
                  </span>
                </div>
              );
            })}

            {inactive.length > 0 && (
              <>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-ink-58)', padding: '16px 18px 6px' }}>
                  Inactive — shown dimmed, never hidden
                </div>
                {inactive.map(m => {
                  const img = resolveTeamImageSrc(m.image);
                  return (
                    <div key={m.id} className="ad-row" style={{ opacity: 0.45 }}>
                      <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} />
                      {img ? <img className="ad-thumb" src={img} alt="" /> : <div className="ad-init">{initialsOf(m.name)}</div>}
                      <span style={{ fontWeight: 500, fontFamily: 'var(--nk-serif)', fontSize: 16 }}>{m.name}</span>
                      <span style={{ color: 'var(--nk-ink-85)' }}>{m.role}</span>
                      <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {m.sections.map(s => <span key={s} className="ad-tag">{SECTION_LABELS[s]}</span>)}
                      </span>
                      <button className="ad-toggle off" aria-label="Restore member" onClick={() => updateTeamMember(m.id, { isActive: true })} />
                      <button onClick={() => updateTeamMember(m.id, { isActive: true })} style={{ fontSize: 11, color: 'var(--nk-accent-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Restore
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* side panel */}
          {panelOpen && (
            <div style={{ padding: '22px 22px 30px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--nk-serif)', fontSize: 24, fontWeight: 700 }}>{editingId ? 'Edit member' : 'Add member'}</div>
                <button aria-label="Close editor" onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{Ic.close}</button>
              </div>

              {dirty && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid rgba(124,92,255,0.5)', background: 'rgba(124,92,255,0.08)', fontSize: 12, color: 'var(--nk-accent-300)', borderRadius: 10 }}>
                  Unsaved changes
                </div>
              )}
              {panelError && (
                <div style={{ padding: '8px 14px', border: '1px solid rgba(192,57,43,0.4)', background: 'rgba(192,57,43,0.07)', fontSize: 12, color: '#c0392b', borderRadius: 10 }}>
                  {panelError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                <label
                  style={{ borderRadius: 14, border: '1px dashed rgba(59,52,95,0.25), ', padding: 18, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', cursor: 'pointer', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(59,52,95,0.25)' }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); onPhotoChosen(e.dataTransfer.files?.[0]); }}
                >
                  {Ic.upload}
                  <span style={{ fontSize: 12, color: 'var(--nk-ink-85)' }}>Drop a photo, or browse</span>
                  <span style={{ fontSize: 10, color: 'var(--nk-ink-58)' }}>saved as a square crop</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onPhotoChosen(e.target.files?.[0])} />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <span style={label}>Card preview · 96px</span>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview at card size"
                      style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '3px solid #ffffff', outline: '1px solid var(--nk-line-20)', filter: 'saturate(0.92)', transform: photoFile ? `scale(${1})` : undefined, objectPosition: '50% 30%' }}
                    />
                  ) : (
                    <div className="ad-init" style={{ width: 96, height: 96, fontSize: 26 }}>{initialsOf(form.name || '?')}</div>
                  )}
                  {photoFile && (
                    <input
                      type="range" min={1} max={2} step={0.05} value={zoom}
                      onChange={e => { setZoom(Number(e.target.value)); setDirty(true); }}
                      style={{ width: 96, accentColor: '#7c5cff' }}
                      aria-label="Photo zoom"
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>Name</span>
                <input className="ad-input" value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>Role title</span>
                <input className="ad-input" value={form.role} onChange={e => setField('role', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>School</span>
                <input className="ad-input" value={form.school} onChange={e => setField('school', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>Short bio</span>
                <textarea className="ad-input" rows={3} value={form.bio} onChange={e => setField('bio', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={label}>Sections — a member can be in several</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
                  {ALL_SECTIONS.map(s => (
                    <label key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.sections.includes(s)}
                        onChange={() =>
                          setField('sections', form.sections.includes(s) ? form.sections.filter(x => x !== s) : [...form.sections, s])
                        }
                      />
                      {SECTION_LABELS[s]}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>Contact link · optional</span>
                <input className="ad-input" placeholder="https://instagram.com/…" value={form.instagram} onChange={e => setField('instagram', e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                <button
                  type="button"
                  className={`ad-toggle ${form.isActive ? '' : 'off'}`}
                  aria-label="Toggle active"
                  onClick={() => setField('isActive', !form.isActive)}
                />
                Active
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button className="ad-btn" style={{ flex: 1 }} onClick={() => save(false)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="ad-btn2" style={{ flex: 1 }} onClick={() => save(true)} disabled={saving}>Save &amp; add another</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── layout view ── */
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr' }}>
          <div style={{ padding: 24, borderRight: '1px solid var(--nk-line-20)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <select className="ad-input" style={{ width: 200 }} value={layoutSection} onChange={e => setLayoutSection(e.target.value as SectionKey)}>
                {ALL_SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
              </select>
              <button
                onClick={() => patchSection({ mode: sl.mode, perRow: sl.perRow, size: sl.size, shape: sl.shape }, true)}
                style={{ fontSize: 11, color: 'var(--nk-accent-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Apply to all sections
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>Display mode</span>
              <div style={{ display: 'flex', border: '1px solid rgba(59,52,95,0.18)', borderRadius: 999, overflow: 'hidden' }}>
                {(['carousel', 'grid'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => patchSection({ mode: m })}
                    style={{
                      flex: 1, textAlign: 'center', padding: 9, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: sl.mode === m ? 'rgba(59,116,232,0.12)' : 'transparent',
                      color: sl.mode === m ? 'var(--nk-accent-300)' : 'var(--nk-ink-78)',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>Cards per row</span>
              <div style={{ display: 'flex', gap: 14 }}>
                {([['desktop', 6], ['tablet', 4], ['phone', 2]] as const).map(([bp, max]) => (
                  <div key={bp} style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(43,39,64,0.68)', textTransform: 'capitalize' }}>{bp}</span>
                    <span className="ad-step">
                      <b style={stepBtn} onClick={() => patchSection({ perRow: { ...sl.perRow, [bp]: Math.max(1, sl.perRow[bp] - 1) } })}>−</b>
                      <span>{sl.perRow[bp]}</span>
                      <b style={stepBtn} onClick={() => patchSection({ perRow: { ...sl.perRow, [bp]: Math.min(max, sl.perRow[bp] + 1) } })}>+</b>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>Card size</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([['compact', 'Compact — photo · name · role'], ['standard', 'Standard — + school & bio'], ['large', 'Large — taller photo']] as const).map(([v, text]) => (
                  <label
                    key={v}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, padding: '8px 12px', cursor: 'pointer', borderRadius: 8,
                      border: sl.size === v ? '1px solid var(--nk-accent)' : '1px solid var(--nk-line-17)',
                      background: sl.size === v ? 'rgba(124,92,255,0.07)' : 'transparent',
                    }}
                  >
                    <input type="radio" name="cardsize" checked={sl.size === v} onChange={() => patchSection({ size: v })} />
                    {text}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>Photo shape · compact cards</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {([['circle', 'Circle'], ['rounded', 'Rounded square']] as const).map(([v, text]) => (
                  <button
                    key={v}
                    onClick={() => patchSection({ shape: v })}
                    style={{
                      display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8,
                      border: sl.shape === v ? '1px solid var(--nk-accent)' : '1px solid var(--nk-line-17)',
                      background: sl.shape === v ? 'rgba(124,92,255,0.07)' : 'transparent',
                      color: sl.shape === v ? 'var(--nk-accent-300)' : 'inherit',
                    }}
                  >
                    <span style={{ width: 16, height: 16, borderRadius: v === 'circle' ? '50%' : 4, border: '1.5px solid currentColor' }} />
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>Sections — order &amp; visibility</span>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: 13, border: '1px solid var(--nk-line-20)', borderRadius: 10, overflow: 'hidden' }}>
                {layout.order.map((s, i) => {
                  const hidden = layout.hidden.includes(s);
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(59,52,95,0.13)', opacity: hidden ? 0.5 : 1 }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button aria-label="Move up" disabled={i === 0} onClick={() => moveSection(s, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--nk-ink-58)', padding: 0 }}>▲</button>
                        <button aria-label="Move down" disabled={i === layout.order.length - 1} onClick={() => moveSection(s, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--nk-ink-58)', padding: 0 }}>▼</button>
                      </span>
                      {SECTION_LABELS[s]}
                      {hidden && <span style={{ fontSize: 10, color: 'var(--nk-ink-58)' }}>hidden</span>}
                      <button className={`ad-toggle ${hidden ? 'off' : ''}`} aria-label={`Toggle ${SECTION_LABELS[s]}`} style={{ marginLeft: 'auto' }} onClick={() => toggleHidden(s)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={label}>Page intro text</span>
              <textarea className="ad-input" rows={2} value={layout.intro} onChange={e => { setLayout(l => ({ ...l, intro: e.target.value })); setLayoutDirty(true); }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>"Join us" CTA text</span>
                <input className="ad-input" value={layout.ctaText} onChange={e => { setLayout(l => ({ ...l, ctaText: e.target.value })); setLayoutDirty(true); }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={label}>CTA link</span>
                <input className="ad-input" value={layout.ctaLink} onChange={e => { setLayout(l => ({ ...l, ctaLink: e.target.value })); setLayoutDirty(true); }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--nk-ink-58)', fontStyle: 'italic' }}>
              Defaults: desktop 4 · tablet 3 · phone 1 · grid · standard · rounded square.
            </div>
          </div>

          {/* live preview */}
          <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, background: '#f7f7fc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={label}>Live preview</span>
              <div style={{ display: 'flex', border: '1px solid rgba(59,52,95,0.18)', borderRadius: 999, overflow: 'hidden', marginLeft: 'auto' }}>
                {(['desktop', 'tablet', 'phone'] as const).map(bp => (
                  <button
                    key={bp}
                    onClick={() => setPreviewBp(bp)}
                    style={{
                      padding: '7px 16px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: previewBp === bp ? 'rgba(59,116,232,0.12)' : 'transparent',
                      color: previewBp === bp ? 'var(--nk-accent-300)' : 'var(--nk-ink-78)',
                    }}
                  >
                    {bp}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ border: '1px solid var(--nk-line-17)', background: '#ffffff', padding: 28, borderRadius: 10, width: previewWidth, maxWidth: '100%', margin: previewBp === 'desktop' ? undefined : '0 auto', transition: 'width 0.25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--nk-line-20)', paddingBottom: 10, marginBottom: 18 }}>
                <span style={{ fontFamily: 'var(--nk-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--nk-accent)' }}>i.</span>
                <span style={{ fontFamily: 'var(--nk-serif)', fontSize: 24, fontWeight: 700 }}>{SECTION_LABELS[layoutSection]}</span>
                {layout.hidden.includes(layoutSection) && <span style={{ fontSize: 11, color: 'var(--nk-ink-58)' }}>hidden on the public page</span>}
              </div>
              {previewMembers.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--nk-ink-58)', fontStyle: 'italic' }}>no members in this section yet</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${previewCols}, 1fr)`, gap: 14 }}>
                  {previewMembers.slice(0, previewCols * 2).map(m => {
                    const img = resolveTeamImageSrc(m.image);
                    const radius = sl.shape === 'circle' ? '50%' : 8;
                    return (
                      <div key={m.id} style={{ borderRadius: 16, border: '1px solid var(--nk-line-17)', background: 'var(--nk-panel)', padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                        {img ? (
                          <img src={img} alt="" style={{ width: sl.size === 'large' ? 96 : 72, height: sl.size === 'large' ? 96 : 72, objectFit: 'cover', objectPosition: '50% 20%', borderRadius: radius, border: '3px solid #ffffff', outline: '1px solid rgba(59,52,95,0.19)', filter: 'saturate(0.92)' }} />
                        ) : (
                          <div style={{ width: sl.size === 'large' ? 96 : 72, height: sl.size === 'large' ? 96 : 72, borderRadius: radius, background: 'rgba(59,116,232,0.12)', color: 'var(--nk-accent-300)', display: 'grid', placeItems: 'center', fontFamily: 'var(--nk-serif)', fontStyle: 'italic', border: '3px solid #ffffff', outline: '1px solid rgba(59,52,95,0.19)' }}>{initialsOf(m.name)}</div>
                        )}
                        <span style={{ fontFamily: 'var(--nk-serif)', fontSize: 16, fontWeight: 700 }}>{m.name}</span>
                        {m.role && <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nk-royal)' }}>{m.role}</span>}
                        {sl.size !== 'compact' && m.bio && (
                          <span style={{ fontSize: 11, color: 'var(--nk-ink-72)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.bio}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--nk-ink-58)', fontStyle: 'italic' }}>
              A simplified preview — the public page uses the full card design at these column counts.
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 24px 20px', padding: '12px 18px', border: '1px solid var(--nk-line-20)', fontSize: 12, color: 'var(--nk-ink-72)', borderRadius: 10 }}>
          {Ic.undo}
          {toast.text}
          {toast.undo && (
            <button onClick={() => { toast.undo?.(); setToast(null); }} style={{ color: 'var(--nk-accent-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
              Undo
            </button>
          )}
          <button onClick={() => setToast(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--nk-ink-58)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamEditor;
