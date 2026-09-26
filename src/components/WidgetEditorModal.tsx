import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { WIDGET_FORM_SCHEMAS } from './VisualEditorModal';

interface WidgetEditorModalProps {
  widget: any; // If widget.id is missing or 'new', it's a new widget
  onClose: () => void;
  onSave: (widgetId: string | null, updatedData: any) => Promise<void>;
}

export function WidgetEditorModal({ widget, onClose, onSave, mediaAssets, folders }: WidgetEditorModalProps & { mediaAssets?: any[], folders?: any[] }) {
  const [name, setName] = useState(widget?.name || '');
  const [position, setPosition] = useState(widget?.position || 'center');
  const [type, setType] = useState(widget?.type || 'weather');
  const [payload, setPayload] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (widget?.dataPayload) {
      try {
        setPayload(typeof widget.dataPayload === 'string' ? JSON.parse(widget.dataPayload) : widget.dataPayload);
      } catch (e) {
        console.error("Failed to parse widget payload", e);
        setPayload({});
      }
    }
    setName(widget?.name || '');
    setPosition(widget?.position || 'center');
    setType(widget?.type || 'weather');
  }, [widget]);

  if (!widget) return null;

  const schema = WIDGET_FORM_SCHEMAS[type] || [];

  const handleFieldChange = (key: string, value: any) => {
    setPayload((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(widget.id === 'new' ? null : widget.id, {
        name,
        position,
        type,
        dataPayload: JSON.stringify(payload),
        backgroundColor: widget.backgroundColor
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save widget.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: (typeof WIDGET_FORM_SCHEMAS)['label'][0]) => {
    const val = payload[field.key];

    if (field.type === 'select') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <select
            value={val ?? field.options?.[0]?.value ?? ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="input-field"
          >
            {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }

    if (field.type === 'color') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={val || '#ffffff'}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
            />
            <input
              type="text"
              value={val || '#ffffff'}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="input-field"
              style={{ flex: 1 }}
            />
          </div>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <textarea
            value={val ?? ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="input-field custom-scroll"
            rows={3}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="form-group">
        <label className="form-label">{field.label}</label>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={val ?? ''}
          onChange={(e) => {
            const v = field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value;
            handleFieldChange(field.key, v);
          }}
          className="input-field"
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
        />
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', width: '450px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{widget.id === 'new' ? 'Create Widget' : `Edit ${widget.type.toUpperCase()}`}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }} className="custom-scroll">
          <div className="form-group">
            <label className="form-label">Widget Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="input-field"
            />
          </div>

          {widget.id === 'new' && (
            <div className="form-group">
              <label className="form-label">Widget Type</label>
              <select value={type} onChange={(e) => {
                setType(e.target.value);
                setPayload({}); // reset payload when type changes
              }} className="input-field">
                {Object.keys(WIDGET_FORM_SCHEMAS).map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Positioning (When used as Overlay)</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-field">
              <option value="center">Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-bar">Bottom Bar (Full Width)</option>
              <option value="full-screen">Full Screen</option>
            </select>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          {schema.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>This widget type has no configuration options.</p>
          ) : (
            schema.map((field: any) => renderField(field))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', cursor: 'pointer', fontWeight: '500' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(138, 146, 255, 0.3)' }}>
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
