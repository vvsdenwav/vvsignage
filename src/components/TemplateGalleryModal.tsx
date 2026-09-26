import React, { useState, useEffect } from 'react';
import { X, Sparkles, LayoutTemplate, Search, ArrowRight, Plus, Check, RefreshCw } from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'welcome', label: 'Welcome & Terminals' },
  { id: 'flight-board', label: 'Flight & Status Boards' },
  { id: 'menu', label: 'Menus & Dining' },
  { id: 'event', label: 'Event Countdowns' },
  { id: 'custom', label: 'My Saved Templates' },
];

export function TemplateGalleryModal({ isOpen = true, onClose, onSelectTemplate }: TemplateGalleryModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [selectedCategory, isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const url = `/api/templates/content-templates${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchName = (t.name || '').toLowerCase().includes(q);
    const matchDesc = (t.description || '').toLowerCase().includes(q);
    return matchName || matchDesc;
  });

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '1000px', maxWidth: '100%', height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--brand-primary), #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Design Template Gallery</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Pick a high-impact pre-built layout and customize it in seconds</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, paddingBottom: '4px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${selectedCategory === cat.id ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: selectedCategory === cat.id ? 'var(--brand-primary)' : 'var(--background)',
                  color: selectedCategory === cat.id ? 'white' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" />
              <span>Loading templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>No templates found matching your filter.</p>
              <p style={{ fontSize: '13px' }}>Try selecting "All Templates" or searching for a different keyword.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {/* Thumbnail / Header area */}
                  <div style={{
                    height: '140px',
                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.9))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
                      {tpl.thumbnail || '🎨'}
                    </div>
                    {tpl.isSystem && (
                      <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                        Official Template
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--foreground)' }}>
                        {tpl.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {tpl.description || 'Ready-to-use 1920x1080 display template.'}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectTemplate(tpl)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--brand-primary), #0284c7)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      Use This Template <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--card-bg)' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
