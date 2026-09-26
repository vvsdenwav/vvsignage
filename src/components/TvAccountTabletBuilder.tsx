import React, { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronLeft, Tablet, Image as ImageIcon, Video, Type, Sparkles, Check, Clock, Palette } from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Harbor Blue', color: '#2C4C7C' },
  { label: 'Electric Blue', color: '#3B82F6' },
  { label: 'Honey Amber', color: '#C98A3E' },
  { label: 'Emerald Green', color: '#10B981' },
  { label: 'Violet', color: '#8B5CF6' },
  { label: 'Crimson', color: '#EF4444' },
  { label: 'Slate Gray', color: '#475569' }
];

export function TvAccountTabletBuilder({ tvAccount, mediaAssets = [], onBack }: { tvAccount: any, mediaAssets?: any[], onBack: () => void }) {
  const [buttons, setButtons] = useState<any[]>([]);
  const [editingButton, setEditingButton] = useState<any>(null);
  const [actionType, setActionType] = useState<string>('html');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [htmlBgColor, setHtmlBgColor] = useState<string>('#000000');
  const [htmlTextColor, setHtmlTextColor] = useState<string>('#FFFFFF');
  const [availableMedia, setAvailableMedia] = useState<any[]>(mediaAssets || []);

  useEffect(() => {
    fetchButtons();
    if (!mediaAssets || mediaAssets.length === 0) {
      fetchMediaAssets();
    } else {
      setAvailableMedia(mediaAssets);
    }
  }, [tvAccount.id, mediaAssets]);

  const fetchMediaAssets = async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAvailableMedia(data);
      }
    } catch (e) {
      console.error('Failed to fetch media assets in tablet builder:', e);
    }
  };

  const fetchButtons = async () => {
    try {
      const res = await fetch(`/api/tablet-buttons?tvAccountId=${tvAccount.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setButtons(data);
      }
    } catch (e) {
      console.error('Failed to fetch tablet buttons:', e);
    }
  };

  const handleButtonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: any = {
      label: (form.elements.namedItem('label') as HTMLInputElement).value,
      color: selectedColor,
      actionType: actionType,
      mediaId: (form.elements.namedItem('mediaId') as HTMLSelectElement)?.value || null,
      htmlTitle: (form.elements.namedItem('htmlTitle') as HTMLInputElement)?.value || null,
      htmlSubtitle: (form.elements.namedItem('htmlSubtitle') as HTMLInputElement)?.value || null,
      htmlBgColor: htmlBgColor,
      htmlTextColor: htmlTextColor,
      duration: parseInt((form.elements.namedItem('duration') as HTMLInputElement).value || "0", 10),
      tvAccountId: tvAccount.id,
      order: editingButton ? editingButton.order : buttons.length
    };
    
    if (data.mediaId) {
      const m = availableMedia.find((ma: any) => ma.id === data.mediaId);
      if (m) data.mediaUrl = m.url;
    }

    try {
      if (editingButton) {
        await fetch(`/api/tablet-buttons/${editingButton.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await fetch('/api/tablet-buttons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      setEditingButton(null);
      fetchButtons();
    } catch (err) {
      console.error('Error saving tablet button:', err);
    }
  };

  const deleteButton = async (id: string) => {
    if (!confirm('Are you sure you want to delete this button?')) return;
    try {
      await fetch(`/api/tablet-buttons/${id}`, { method: 'DELETE' });
      if (editingButton?.id === id) {
        setEditingButton(null);
      }
      fetchButtons();
    } catch (err) {
      console.error('Error deleting tablet button:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {/* Navigation & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ChevronLeft size={16} /> Back to Accounts
          </button>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tablet size={22} style={{ color: 'var(--brand-primary)' }} />
              Tablet Controller Builder
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Configuring interactive touch screen triggers for <strong style={{ color: 'var(--foreground)' }}>{tvAccount.username}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditingButton(null)}
          className="btn-primary"
          style={{ fontSize: '13px', padding: '8px 14px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Add New Button
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Interactive Tablet Interface Mockup */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>
              Live Tablet Screen Layout
            </h3>
            <span style={{ fontSize: '11px', background: 'var(--brand-accent)', color: 'var(--foreground)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              {buttons.length} {buttons.length === 1 ? 'Button' : 'Buttons'}
            </span>
          </div>

          {/* Realistic Tablet Hardware Frame */}
          <div style={{
            background: '#1E293B',
            borderRadius: '24px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.2)',
            border: '2px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Tablet Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94A3B8', padding: '0 4px' }}>
              <span>Tablet App • {tvAccount.username}</span>
              <span>● Connected</span>
            </div>

            {/* Tablet Screen Content View */}
            <div style={{
              background: '#0F172A',
              borderRadius: '16px',
              padding: '16px',
              minHeight: '340px',
              maxHeight: '480px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid #1E293B'
            }} className="custom-scroll">

              {buttons.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                  <Sparkles size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', margin: 0, fontWeight: '500' }}>No tablet buttons created yet.</p>
                  <p style={{ fontSize: '11px', margin: '4px 0 0 0', opacity: 0.8 }}>Use the editor form on the right to build your first button.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {buttons.map((btn) => {
                    const isSelected = editingButton?.id === btn.id;
                    return (
                      <div
                        key={btn.id}
                        onClick={() => setEditingButton(btn)}
                        style={{
                          background: btn.color || 'var(--brand-primary)',
                          color: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '14px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          border: isSelected ? '3px solid #FFFFFF' : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 4px #3B82F6' : '0 4px 6px -1px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s ease',
                          minHeight: '90px'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '700', lineHeight: 1.2, wordBreak: 'break-word' }}>
                          {btn.label}
                        </span>
                        
                        <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {btn.actionType}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteButton(btn.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            border: '2px solid #0F172A',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Delete Button"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setEditingButton(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#94A3B8',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                <Plus size={14} /> New Button Setup
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Button Configuration Editor Form */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
                {editingButton ? `Edit Button: "${editingButton.label}"` : 'Create New Button'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Set the visual appearance and action trigger when tapped on the tablet.
              </p>
            </div>
            {editingButton && (
              <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '6px', fontWeight: '600' }}>
                Editing Active
              </span>
            )}
          </div>

          <form onSubmit={handleButtonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Field Group 1: Button Label & Color */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label className="form-label" style={{ margin: 0 }}>Button Label</label>
                <input
                  name="label"
                  type="text"
                  required
                  placeholder="e.g. Boarding Flight 204"
                  defaultValue={editingButton?.label || ''}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={14} /> Button Accent Color
                </label>
                
                {/* Color Swatch Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setSelectedColor(preset.color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: preset.color,
                        border: selectedColor === preset.color ? '3px solid var(--foreground)' : '2px solid transparent',
                        boxShadow: selectedColor === preset.color ? 'var(--shadow-md)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease'
                      }}
                      title={preset.label}
                    >
                      {selectedColor === preset.color && <Check size={16} color="#FFFFFF" />}
                    </button>
                  ))}
                  
                  {/* Custom Hex Color Picker Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      style={{ width: '32px', height: '32px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      style={{ width: '90px', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Field Group 2: Action Type Segmented Control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Action Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'var(--background)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setActionType('html')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600',
                    background: actionType === 'html' ? 'var(--card-bg)' : 'transparent',
                    color: actionType === 'html' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    boxShadow: actionType === 'html' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  <Type size={15} /> HTML Message
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('image')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600',
                    background: actionType === 'image' ? 'var(--card-bg)' : 'transparent',
                    color: actionType === 'image' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    boxShadow: actionType === 'image' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  <ImageIcon size={15} /> Show Image
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('video')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600',
                    background: actionType === 'video' ? 'var(--card-bg)' : 'transparent',
                    color: actionType === 'video' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    boxShadow: actionType === 'video' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  <Video size={15} /> Play Video
                </button>
              </div>
            </div>

            {/* Field Group 3: Action Details */}
            {actionType === 'html' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  HTML Banner Customization
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Banner Title</label>
                  <input
                    name="htmlTitle"
                    type="text"
                    placeholder="e.g. Flight 204 Boarding Now"
                    defaultValue={editingButton?.htmlTitle || ''}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Banner Subtitle / Message</label>
                  <input
                    name="htmlSubtitle"
                    type="text"
                    placeholder="e.g. Please proceed to Gate 3 with your boarding pass"
                    defaultValue={editingButton?.htmlSubtitle || ''}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Optional Image Attachment</label>
                  <select
                    name="mediaId"
                    defaultValue={editingButton?.mediaId || ''}
                    className="input-field"
                  >
                    <option value="">-- None (Text Banner Only) --</option>
                    {availableMedia.filter(m => m.type === 'image').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Background Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={htmlBgColor}
                        onChange={(e) => setHtmlBgColor(e.target.value)}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={htmlBgColor}
                        onChange={(e) => setHtmlBgColor(e.target.value)}
                        className="input-field"
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Text Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={htmlTextColor}
                        onChange={(e) => setHtmlTextColor(e.target.value)}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={htmlTextColor}
                        onChange={(e) => setHtmlTextColor(e.target.value)}
                        className="input-field"
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(actionType === 'image' || actionType === 'video') && (
              <div style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Select Media Asset from Library</label>
                <select
                  name="mediaId"
                  required
                  defaultValue={editingButton?.mediaId || ''}
                  className="input-field"
                >
                  <option value="">-- Choose {actionType === 'image' ? 'Image' : 'Video'} Asset --</option>
                  {availableMedia.filter(m => m.type === actionType).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Only assets uploaded as type <strong>{actionType}</strong> are listed here.
                </p>
              </div>
            )}

            {/* Field Group 4: Duration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Display Duration (seconds)
              </label>
              <input
                name="duration"
                type="number"
                min="0"
                defaultValue={editingButton?.duration || 0}
                className="input-field"
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Set to <code>0</code> for indefinite display until manually cleared or replaced by another action.
              </p>
            </div>

            {/* Form Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {editingButton && (
                <button
                  type="button"
                  onClick={() => setEditingButton(null)}
                  className="btn-secondary"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
              >
                {editingButton ? 'Save Button Changes' : 'Create Tablet Button'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
