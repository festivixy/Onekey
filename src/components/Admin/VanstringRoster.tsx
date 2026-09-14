import React, { useEffect, useState } from 'react';
import { useVanstringStore } from '../../store/vanstringStore';
import { VanstringSection } from '../../services/firebaseService';

const VanstringRoster: React.FC = () => {
  const sections     = useVanstringStore(s => s.sections);
  const isLoading    = useVanstringStore(s => s.isLoading);
  const error        = useVanstringStore(s => s.error);
  const fetchSections = useVanstringStore(s => s.fetchSections);
  const saveSections  = useVanstringStore(s => s.saveSections);

  const [draft, setDraft]       = useState<VanstringSection[]>(sections);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => { fetchSections(); }, [fetchSections]);
  useEffect(() => { setDraft(sections); }, [sections]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(sections);

  const updateSection = (idx: number, patch: Partial<VanstringSection>) => {
    setDraft(d => d.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  // Preserves raw newlines / trailing whitespace so the cursor doesn't jump while typing.
  // Cleanup (trim + drop empty lines) happens on save.
  const setMembersFromText = (idx: number, text: string) => {
    updateSection(idx, { members: text.split('\n') });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft(next);
  };

  const removeSection = (idx: number) => {
    if (!window.confirm(`Remove "${draft[idx].section}"? This won't save until you click "Save changes".`)) return;
    setDraft(d => d.filter((_, i) => i !== idx));
  };

  const addSection = () => {
    setDraft(d => [...d, { section: 'New Section', members: [] }]);
  };

  const reset = () => setDraft(sections);

  const save = async () => {
    setSaveState('saving');
    // Clean up empty lines + whitespace just before saving
    const cleaned = draft.map(s => ({
      section: s.section.trim() || 'Untitled',
      members: s.members.map(m => m.trim()).filter(Boolean),
    }));
    const ok = await saveSections(cleaned);
    setSaveState(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => setSaveState('idle'), 2200);
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2b2740', margin: 0 }}>Vanstring Roster</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(43,39,64,0.72)', marginTop: 4 }}>
            Edit section groups and members shown on the <code style={{ color: '#6350d4' }}>/vanstring</code> page. Saved globally to Firestore.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saveState === 'saved' && <span style={{ color: '#2d8c64', fontSize: '0.85rem', fontWeight: 600 }}>✓ Saved</span>}
          {saveState === 'error' && <span style={{ color: '#c0392b', fontSize: '0.85rem', fontWeight: 600 }}>Save failed</span>}
          {error && saveState !== 'saving' && <span style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</span>}
          {isDirty && (
            <button onClick={reset} disabled={saveState === 'saving'}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent', border: '1px solid rgba(59,52,95,0.2)',
                color: 'rgba(43,39,64,0.72)', fontSize: '0.85rem', cursor: 'pointer',
              }}>
              Discard
            </button>
          )}
          <button onClick={save} disabled={!isDirty || saveState === 'saving' || isLoading}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: isDirty ? '#6350d4' : 'rgba(59,52,95,0.15)',
              color: isDirty ? '#ffffff' : 'rgba(43,39,64,0.5)',
              border: 'none', fontWeight: 700, fontSize: '0.85rem',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}>
            {saveState === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {draft.map((section, idx) => (
          <div key={idx} style={{
            background: '#f7f6fd',
            border: '1px solid rgba(59,52,95,0.15)',
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <input
                type="text"
                value={section.section}
                onChange={e => updateSection(idx, { section: e.target.value })}
                placeholder="Section name (e.g. Violin 1)"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6,
                  background: '#ffffff', border: '1px solid rgba(59,52,95,0.17)',
                  color: '#2b2740', fontSize: '1rem', fontWeight: 600,
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'rgba(43,39,64,0.58)' }}>
                {section.members.length} {section.members.length === 1 ? 'member' : 'members'}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                  title="Move up"
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: '0.85rem',
                    background: idx === 0 ? 'rgba(40,40,40,0.4)' : 'rgba(255,255,255,0.05)',
                    color: idx === 0 ? '#57534e' : '#a8a29e',
                    border: '1px solid rgba(59,52,95,0.15)',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  }}>↑</button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === draft.length - 1}
                  title="Move down"
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: '0.85rem',
                    background: idx === draft.length - 1 ? 'rgba(40,40,40,0.4)' : 'rgba(255,255,255,0.05)',
                    color: idx === draft.length - 1 ? '#57534e' : '#a8a29e',
                    border: '1px solid rgba(59,52,95,0.15)',
                    cursor: idx === draft.length - 1 ? 'not-allowed' : 'pointer',
                  }}>↓</button>
                <button onClick={() => removeSection(idx)}
                  title="Remove section"
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: '0.85rem',
                    background: 'rgba(192,57,43,0.07)', color: '#c0392b',
                    border: '1px solid rgba(192,57,43,0.3)', cursor: 'pointer',
                  }}>Remove</button>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(43,39,64,0.58)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Members (one per line)
            </label>
            <textarea
              value={section.members.join('\n')}
              onChange={e => setMembersFromText(idx, e.target.value)}
              placeholder="Curtis&#10;Gabby&#10;Rachel"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 6,
                background: '#ffffff', border: '1px solid rgba(59,52,95,0.17)',
                color: '#2b2740', fontSize: '0.9rem', lineHeight: 1.6,
                fontFamily: 'inherit', resize: 'vertical',
                minHeight: 200, maxHeight: 400,
              }}
            />
          </div>
        ))}
      </div>

      <button onClick={addSection}
        style={{
          marginTop: 16, padding: '10px 18px', borderRadius: 8,
          background: 'rgba(124,92,255,0.08)', border: '1px dashed rgba(124,92,255,0.35)',
          color: '#6350d4', fontSize: '0.875rem', fontWeight: 600,
          cursor: 'pointer', width: '100%',
        }}>
        + Add section
      </button>
    </div>
  );
};

export default VanstringRoster;
