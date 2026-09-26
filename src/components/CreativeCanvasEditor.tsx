import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, AppWindow, Save, LayoutTemplate, Copy, Check, ChevronRight, ZoomIn, ZoomOut, Settings, ArrowUp, ArrowDown, X, Undo2 } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { renderWidgetContent } from './WidgetRenderer';
import { WIDGET_FORM_SCHEMAS } from './VisualEditorModal'; // Reusing schemas
import { ImageCropModal } from './ImageCropModal';
import { Crop } from 'lucide-react';

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  payload: any;
  name?: string;
}

interface CreativeCanvasEditorProps {
  widget: any; // The existing creative (widget) to edit
  onClose: () => void;
  onSave: (id: string | null, data: any) => Promise<void>;
  mediaAssets?: any[];
  folders?: any[];
  WIDGET_TYPES?: any[];
  isDraggingWidget?: boolean;
  setIsDraggingWidget?: (val: boolean) => void;
}

export function CreativeCanvasEditor(props: CreativeCanvasEditorProps) {
  const {
    widget, onClose, onSave, mediaAssets, folders,
    WIDGET_TYPES = [], isDraggingWidget, setIsDraggingWidget
  } = props;

  const [name, setName] = useState(widget?.name || '');
  const [folderId, setFolderId] = useState(widget?.folderId || '');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [fontFamily, setFontFamily] = useState('inherit');
  
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'layers' | 'properties'>('layers');
  const [isSaving, setIsSaving] = useState(false);
  
  // Layout & Clipboard
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [clipboard, setClipboard] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string | null } | null>(null);
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const stateRef = React.useRef({ elements, backgroundColor, backgroundImage, fontFamily });
  
  useEffect(() => {
    stateRef.current = { elements, backgroundColor, backgroundImage, fontFamily };
  }, [elements, backgroundColor, backgroundImage, fontFamily]);

  const pushHistory = () => {
    setHistory(prev => [...prev, JSON.stringify(stateRef.current)].slice(-50));
  };

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const prevState = JSON.parse(newHistory.pop()!);
      setElements(prevState.elements);
      setBackgroundColor(prevState.backgroundColor);
      setBackgroundImage(prevState.backgroundImage);
      setFontFamily(prevState.fontFamily);
      return newHistory;
    });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, id: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (id) {
      setSelectedElementId(id);
      setRightTab('properties');
    } else {
      setSelectedElementId(null);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  useEffect(() => {
    if (widget?.dataPayload) {
      try {
        const payload = typeof widget.dataPayload === 'string' ? JSON.parse(widget.dataPayload) : widget.dataPayload;
        if (payload.background) {
          setBackgroundColor(payload.background.color || '#000000');
          setBackgroundImage(payload.background.image || '');
          setFontFamily(payload.background.fontFamily || 'inherit');
        }
        if (Array.isArray(payload.elements)) {
          setElements(payload.elements);
        }
      } catch (e) {
        console.error("Failed to parse canvas payload", e);
      }
    } else {
      if (widget?.name === 'New Widget') setName('New Creative');
    }
  }, [widget]);

  // Handle auto-zoom on load
  useEffect(() => {
    const container = document.getElementById('creative-canvas-container');
    if (container) {
       const availableWidth = container.clientWidth - 64; 
       const availableHeight = container.clientHeight - 64;
       const scaleX = availableWidth / 1920;
       const scaleY = availableHeight / 1080;
       const newScale = Math.min(scaleX, scaleY, 1) * 100;
       setZoomLevel(Math.floor(newScale));
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        background: { color: backgroundColor, image: backgroundImage, fontFamily },
        elements
      };
      await onSave(widget.id === 'new' ? null : widget.id, {
        name: name || 'Untitled Creative',
        type: 'canvas',
        position: 'center',
        dataPayload: JSON.stringify(payload),
        backgroundColor: 'transparent',
        folderId: folderId || null
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save creative.");
    } finally {
      setIsSaving(false);
    }
  };

  const addElement = (typeId: string, dropPos?: {x: number, y: number}) => {
    const typeMeta = WIDGET_TYPES.find((w: any) => w.id === typeId);
    
    // Default sizes in pixels (since Creative elements use absolute pixels)
    const baseW = 400; 
    const baseH = 300; 
    
    let defaultX = 1920/2 - baseW/2;
    let defaultY = 1080/2 - baseH/2;
    
    if (dropPos) {
       defaultX = dropPos.x;
       defaultY = dropPos.y;
    }

    const newElement: CanvasElement = {
      id: 'el_' + Date.now() + Math.floor(Math.random() * 1000),
      type: typeId,
      name: typeMeta ? `New ${typeMeta.name}` : `New ${typeId}`,
      x: defaultX,
      y: defaultY,
      width: typeId === 'weather' ? 400 : (typeId === 'text' ? 800 : (typeId === 'ticker' ? 1920 : (typeId === 'image' ? 800 : baseW))),
      height: typeId === 'weather' ? 350 : (typeId === 'text' ? 400 : (typeId === 'ticker' ? 100 : (typeId === 'image' ? 533 : baseH))),
      zIndex: elements.length + 1,
      payload: getDefaultPayload(typeId)
    };
    pushHistory();
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setRightTab('properties');
  };

  const getDefaultPayload = (type: string) => {
    // Basic defaults matching VisualEditorModal but stripped of x,y,w,h,zIndex
    switch (type) {
      case 'label': return { text: "New Label", fontSize: 64, color: "#ffffff" };
      case 'text': return { text: "Enter your text here.", fontSize: 32, color: "#ffffff" };
      case 'image': return { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", objectFit: "cover" };
      case 'video': return { url: "https://www.w3schools.com/html/mov_bbb.mp4", objectFit: "cover" };
      case 'canva': return { url: "https://www.canva.com/design/..." };
      case 'youtube': return { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
      case 'ticker': return { text: "Breaking News - Your scrolling text goes here.", speed: 50 };
      case 'clock': return { format: "HH:mm:ss" };
      case 'weather': return { location: "San Pedro, Belize", unit: "celsius", theme: "glass" };
      case 'shape': return { shapeType: "rectangle", backgroundColor: "#2563EB", text: "" };
      case 'table': return { 
        csvData: "Flight #, Destination, Time, Gate, Status\n301, San Pedro, 09:15 AM, G1, Boarding\n302, Belize City, 09:45 AM, G2, On Time\n305, Caye Caulker, 10:30 AM, G1, Scheduled\n308, Placencia, 11:15 AM, G3, On Time",
        backgroundColor: "rgba(13, 15, 22, 0.85)",
        textColor: "#ffffff"
      };
      default: return {};
    }
  };

  const updateElementProps = (id: string, updates: Partial<CanvasElement>) => {
    pushHistory();
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const updateElementPayload = (id: string, key: string, value: any) => {
    pushHistory();
    setElements(elements.map(el => {
      if (el.id === id) {
        return { ...el, payload: { ...el.payload, [key]: value } };
      }
      return el;
    }));
    
    // Auto-adjust dimensions for images if URL changes
    if (key === 'url') {
      const el = elements.find(e => e.id === id);
      if (el && el.type === 'image') {
        const img = new window.Image();
        img.onload = () => {
          const naturalW = img.naturalWidth;
          const naturalH = img.naturalHeight;
          if (naturalW && naturalH) {
             const maxW = 1000;
             const maxH = 1000;
             let w = naturalW;
             let h = naturalH;
             if (w > maxW) {
               h = (maxW / w) * h;
               w = maxW;
             }
             if (h > maxH) {
               w = (maxH / h) * w;
               h = maxH;
             }
             setElements(prev => prev.map(p => p.id === id ? { ...p, width: Math.round(w), height: Math.round(h) } : p));
          }
        };
        img.src = value;
      }
    }
  };

  const deleteElement = (id: string) => {
    pushHistory();
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
      setRightTab('properties');
    }
  };
  const moveZIndex = (id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    pushHistory();
    setElements(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as CanvasElement[];
      copy.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
      
      const idx = copy.findIndex(el => el.id === id);
      if (idx === -1) return prev;

      if (direction === 'up' && idx < copy.length - 1) {
        const temp = copy[idx];
        copy[idx] = copy[idx + 1];
        copy[idx + 1] = temp;
      } else if (direction === 'down' && idx > 0) {
        const temp = copy[idx];
        copy[idx] = copy[idx - 1];
        copy[idx - 1] = temp;
      } else if (direction === 'front' && idx < copy.length - 1) {
        const [temp] = copy.splice(idx, 1);
        copy.push(temp);
      } else if (direction === 'back' && idx > 0) {
        const [temp] = copy.splice(idx, 1);
        copy.unshift(temp);
      }
      
      copy.forEach((el, index) => { el.zIndex = index + 1; });
      return copy;
    });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;
      const selected = elements.find(o => o.id === selectedElementId);
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selected) {
        setClipboard(JSON.parse(JSON.stringify(selected)));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selected) {
        setClipboard(JSON.parse(JSON.stringify(selected)));
        deleteElement(selected.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        pushHistory();
        const clone = JSON.parse(JSON.stringify(clipboard));
        clone.id = 'el_' + Date.now();
        clone.x += 40; // Offset by 40px
        clone.y += 40;
        clone.zIndex = elements.length + 1;
        setElements(prev => [...prev, clone]);
        setSelectedElementId(clone.id);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        deleteElement(selected.id);
      } else if (e.key === 'ArrowUp' && selected) {
         e.preventDefault(); updateElementProps(selected.id, { y: selected.y - 10 });
      } else if (e.key === 'ArrowDown' && selected) {
         e.preventDefault(); updateElementProps(selected.id, { y: selected.y + 10 });
      } else if (e.key === 'ArrowLeft' && selected) {
         e.preventDefault(); updateElementProps(selected.id, { x: selected.x - 10 });
      } else if (e.key === 'ArrowRight' && selected) {
         e.preventDefault(); updateElementProps(selected.id, { x: selected.x + 10 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedElementId, clipboard]);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Render a form field dynamically from schema
  const renderField = (el: CanvasElement, field: any) => {
    const val = el.payload[field.key];

    if (field.type === 'select') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <select value={val ?? field.options?.[0]?.value ?? ''} onChange={(e) => updateElementPayload(el.id, field.key, e.target.value)} className="input-field">
            {field.options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    if (field.type === 'color') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="color" value={val || '#ffffff'} onChange={(e) => updateElementPayload(el.id, field.key, e.target.value)} style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
            <input type="text" value={val || '#ffffff'} onChange={(e) => updateElementPayload(el.id, field.key, e.target.value)} className="input-field" style={{ flex: 1 }} />
          </div>
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <textarea value={val ?? ''} onChange={(e) => updateElementPayload(el.id, field.key, e.target.value)} className="input-field custom-scroll" rows={3} placeholder={field.placeholder} />
        </div>
      );
    }
    if (field.type === 'url' && mediaAssets) {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input type="text" value={val ?? ''} onChange={(e) => updateElementPayload(el.id, field.key, e.target.value)} className="input-field" placeholder={field.placeholder || "https://..."} />
            <select className="input-field" value="" onChange={(e) => updateElementPayload(el.id, field.key, e.target.value)} style={{ background: 'var(--brand-primary)', color: 'white' }}>
              <option value="" disabled>Select from Media Library...</option>
              {folders ? folders.map((folder: any) => (
                <optgroup key={folder.id} label={folder.name}>
                  {mediaAssets.filter((m: any) => m.folderId === folder.id).map((m: any) => (
                    <option key={m.id} value={m.url}>{m.name} ({m.type})</option>
                  ))}
                </optgroup>
              )) : null}
              <optgroup label={folders && folders.length > 0 ? "Root folder" : "Media Assets"}>
                {mediaAssets.filter((m: any) => !m.folderId).map((m: any) => (
                  <option key={m.id} value={m.url}>{m.name} ({m.type})</option>
                ))}
              </optgroup>
            </select>
          </div>
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
            updateElementPayload(el.id, field.key, v);
          }}
          className="input-field"
          placeholder={field.placeholder}
          min={field.min} max={field.max}
        />
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>

      {/* ─── Header ─── */}
      <header style={{ height: '60px', background: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setShowLeftSidebar(!showLeftSidebar)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Toggle Widgets Library">
            <LayoutTemplate size={20} />
          </button>
          <AppWindow color="var(--brand-primary)" />
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Creative Name..."
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '20px', fontWeight: 'bold', outline: 'none' }}
          />
          {folders && folders.length > 0 && (
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontSize: '12px' }}
            >
              <option value="">Root (No Folder)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleUndo} disabled={history.length === 0} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: history.length === 0 ? 0.5 : 1 }}>
            <Undo2 size={14} /> Undo
          </button>
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            <X size={14} style={{ marginRight: '6px' }} /> Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={14} /> {isSaving ? 'Saving…' : 'Save Creative'}
          </button>
          <button onClick={() => setShowRightSidebar(!showRightSidebar)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px' }} title="Toggle Properties">
            <ChevronRight size={20} style={{ transform: showRightSidebar ? 'none' : 'rotate(180deg)' }} />
          </button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Widget Library */}
        {showLeftSidebar && (
        <aside style={{ width: '300px', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Widget Library</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Drag and drop to add</p>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {WIDGET_TYPES.map((w: any) => {
              const Icon = w.icon;
              return (
                <div
                  key={w.id}
                  onClick={() => addElement(w.id)}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('widgetType', w.id); if (setIsDraggingWidget) setIsDraggingWidget(true); }}
                  onDragEnd={() => { if (setIsDraggingWidget) setIsDraggingWidget(false); }}
                  style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Icon size={24} color="var(--brand-primary)" />
                  <span style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: '600', textAlign: 'center' }}>{w.name}</span>
                </div>
              );
            })}
          </div>
        </aside>
        )}

        {/* Center: Native Preview Canvas */}
        <section 
          id="creative-canvas-container"
          style={{ flex: 1, minWidth: 0, minHeight: 0, background: 'var(--background)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedElementId(null); setRightTab('properties'); } }}
          onContextMenu={(e) => handleContextMenu(e, null)}
        >
          <div 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', overflow: 'auto' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedElementId(null); setRightTab('properties'); } }}
          >
            <div 
              style={{ 
                width: 1920, 
                height: 1080, 
                position: 'relative', 
                flexShrink: 0, 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'center center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 0 0 2px var(--border)', 
                backgroundColor: backgroundColor || '#000000',
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
                fontFamily: fontFamily || 'inherit'
              }}
              onClick={(e) => {
                 if (e.target === e.currentTarget) { setSelectedElementId(null); setRightTab('properties'); }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { 
                e.preventDefault(); 
                if (setIsDraggingWidget) setIsDraggingWidget(false); 
                const t = e.dataTransfer.getData('widgetType'); 
                if (t) {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const scale = zoomLevel / 100;
                   const dropX = (e.clientX - rect.left) / scale;
                   const dropY = (e.clientY - rect.top) / scale;
                   addElement(t, { x: dropX, y: dropY });
                }
              }}
            >
              {elements.map(el => {
                 const isSelected = selectedElementId === el.id;
                 return (
                   <Rnd
                     key={el.id}
                     scale={zoomLevel / 100}
                     lockAspectRatio={el.type === 'image'}
                     position={{ x: el.x, y: el.y }}
                     size={{ width: el.width, height: el.height }}
                     style={{ zIndex: el.zIndex || 1 }}
                     onDragStop={(e, d) => updateElementProps(el.id, { x: d.x, y: d.y })}
                     onResizeStop={(e, direction, ref, delta, position) => {
                       updateElementProps(el.id, {
                         width: parseFloat(ref.style.width),
                         height: parseFloat(ref.style.height),
                         x: position.x,
                         y: position.y
                       });
                     }}
                     onDragStart={() => { setSelectedElementId(el.id); setRightTab('properties'); }}
                     onResizeStart={() => { setSelectedElementId(el.id); setRightTab('properties'); }}
                     dragHandleClassName="drag-handle"
                     className={isSelected ? "widget-selected" : ""}
                   >
                     <div 
                       style={{ 
                         width: '100%', 
                         height: '100%', 
                         position: 'relative',
                         border: isSelected ? '3px solid var(--brand-primary)' : '1px solid transparent',
                         transition: 'border 0.2s'
                       }}
                       onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); setRightTab('properties'); }}
                       onContextMenu={(e) => handleContextMenu(e, el.id)}
                     >
                       <div className="drag-handle" style={{ width: '100%', height: '100%', cursor: 'grab', position: 'relative', containerType: 'size', overflow: 'hidden' }}>
                         {/* Render element contents - passing payload via dataPayload matching WidgetRenderer structure */}
                         {renderWidgetContent({ id: el.id, type: el.type, dataPayload: el.payload }, {}, {}, true)}
                       </div>
                     </div>
                   </Rnd>
                 );
              })}
            </div>
          </div>
          
          {/* Bottom Toolbar */}
          <div style={{ height: '48px', borderTop: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexShrink: 0 }}>
            <button onClick={() => setZoomLevel(z => Math.max(10, z - 10))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Zoom Out"><ZoomOut size={18} /></button>
            <input type="range" min="10" max="150" value={zoomLevel} onChange={e => setZoomLevel(Number(e.target.value))} style={{ width: '150px' }} title="Zoom Level" />
            <button onClick={() => setZoomLevel(z => Math.min(150, z + 10))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Zoom In"><ZoomIn size={18} /></button>
            <button onClick={() => setZoomLevel(100)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold' }}>100%</button>
          </div>
        </section>

        {/* Right: Properties */}
        {showRightSidebar && (
        <aside style={{ width: '360px', background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['layers', 'properties'].map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab as any)}
                style={{ flex: 1, padding: '14px 0', fontSize: '13px', background: rightTab === tab ? 'rgba(37,99,235,0.05)' : 'transparent', border: 'none', borderBottom: rightTab === tab ? '2px solid var(--brand-primary)' : '2px solid transparent', color: rightTab === tab ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

            {/* Layers Tab */}
            {rightTab === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {elements.length === 0
                  ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No widgets on canvas.</p>
                  : [...elements]
                      .sort((a,b) => b.zIndex - a.zIndex)
                      .map((el: CanvasElement) => {
                      const typeMeta = WIDGET_TYPES.find((w: any) => w.id === el.type);
                      const Icon = typeMeta?.icon || LayoutTemplate;
                      return (
                        <div
                          key={el.id}
                          onClick={() => { setSelectedElementId(el.id); setRightTab('properties'); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: selectedElementId === el.id ? 'rgba(37,99,235,0.05)' : 'var(--card-bg)', borderRadius: '8px', border: selectedElementId === el.id ? '1px solid var(--brand-primary)' : '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '6px', background: 'rgba(37,99,235,0.1)', borderRadius: '6px' }}>
                              <Icon size={16} color="var(--brand-primary)" />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>{el.name || el.type}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{el.type}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); moveZIndex(el.id, 'up'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Bring Forward"><ArrowUp size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveZIndex(el.id, 'down'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Send Backward"><ArrowDown size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Remove"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}

            {/* Properties Tab */}
            {rightTab === 'properties' && (() => {
              if (!selectedElement) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '8px' }}>
                      <Settings size={20} color="var(--brand-primary)" />
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Creative Settings</h3>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Background Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={backgroundColor} onChange={e => { pushHistory(); setBackgroundColor(e.target.value); }} style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                        <input type="text" value={backgroundColor} onChange={e => { pushHistory(); setBackgroundColor(e.target.value); }} className="input-field" style={{ flex: 1 }} />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Background Image (Optional)</label>
                      <input type="text" value={backgroundImage} onChange={e => { pushHistory(); setBackgroundImage(e.target.value); }} className="input-field" placeholder="https://..." />
                      {mediaAssets && mediaAssets.length > 0 && (
                        <select className="input-field" style={{ marginTop: '8px' }} onChange={e => { pushHistory(); setBackgroundImage(e.target.value); }}>
                          <option value="">Select from Media Library...</option>
                          {folders?.map((folder: any) => (
                            <optgroup key={folder.id} label={folder.name}>
                              {mediaAssets.filter((m: any) => m.folderId === folder.id).map((media: any) => (
                                <option key={media.id} value={media.url}>{media.name} ({media.type})</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Global Font Family</label>
                      <select value={fontFamily} onChange={e => { pushHistory(); setFontFamily(e.target.value); }} className="input-field">
                        <option value="inherit">Inherit</option>
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                        <option value="Outfit, sans-serif">Outfit</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Courier New, monospace">Monospace</option>
                      </select>
                    </div>
                  </div>
                );
              }

              const schema = WIDGET_FORM_SCHEMAS[selectedElement.type];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Layer Name</label>
                    <input type="text" value={selectedElement.name || ''} onChange={(e) => updateElementProps(selectedElement.id, { name: e.target.value })} className="input-field" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>X Pos (px)</label>
                      <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateElementProps(selectedElement.id, { x: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Y Pos (px)</label>
                      <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateElementProps(selectedElement.id, { y: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Width (px)</label>
                      <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => updateElementProps(selectedElement.id, { width: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Height (px)</label>
                      <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => updateElementProps(selectedElement.id, { height: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-primary)' }}>{selectedElement.type} Settings</h4>

                  {schema
                    ? schema.map(field => renderField(selectedElement, field))
                    : (
                      Object.keys(selectedElement.payload).length > 0
                        ? Object.entries(selectedElement.payload).map(([key, val]) => {
                            if (typeof val === 'object' || ['x','y','width','height','zIndex'].includes(key)) return null;
                            return (
                              <div key={key} className="form-group">
                                <label className="form-label" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input
                                  type={typeof val === 'number' ? 'number' : 'text'}
                                  value={val as any ?? ''}
                                  onChange={(e) => {
                                    const v = typeof val === 'number' ? parseFloat(e.target.value) : e.target.value;
                                    updateElementPayload(selectedElement.id, key, v);
                                  }}
                                  className="input-field"
                                />
                              </div>
                            );
                          })
                        : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No configurable properties for this widget type.</p>
                    )
                  }
                  
                  {/* Raw JSON */}
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', userSelect: 'none' }}>Advanced: Raw JSON</summary>
                    <textarea
                      value={JSON.stringify(selectedElement.payload || {}, null, 2)}
                      onChange={(e) => {
                        try { updateElementProps(selectedElement.id, { payload: JSON.parse(e.target.value) }); } catch {}
                      }}
                      className="input-field custom-scroll"
                      rows={5}
                      style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '8px' }}
                    />
                  </details>
                </div>
              );
            })()}
          </div>
        </aside>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          padding: '8px 0',
          minWidth: '180px',
          zIndex: 999999
        }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.id ? (
            <>
              {elements.find(e => e.id === contextMenu.id)?.type === 'image' && (
                <>
                  <button className="context-menu-btn" onClick={() => { setCropTargetId(contextMenu.id!); setContextMenu(null); }}><Crop size={16} /> Crop Image</button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                </>
              )}
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'front'); setContextMenu(null); }}><ArrowUp size={16} /> Bring to Front</button>
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'up'); setContextMenu(null); }}><ArrowUp size={16} /> Bring Forward</button>
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'down'); setContextMenu(null); }}><ArrowDown size={16} /> Send Backward</button>
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'back'); setContextMenu(null); }}><ArrowDown size={16} /> Send to Back</button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button className="context-menu-btn" onClick={() => {
                const el = elements.find(e => e.id === contextMenu.id);
                if (el) setClipboard(JSON.parse(JSON.stringify(el)));
                setContextMenu(null);
              }}><Copy size={16} /> Copy</button>
              <button className="context-menu-btn" onClick={() => { setRightTab('layers'); setContextMenu(null); }}><LayoutTemplate size={16} /> Layers</button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button className="context-menu-btn" onClick={() => { deleteElement(contextMenu.id!); setContextMenu(null); }} style={{ color: 'var(--danger)' }}><Trash2 size={16} /> Delete</button>
            </>
          ) : (
            <>
              <button className="context-menu-btn" disabled={!clipboard} onClick={() => {
                if (clipboard) {
                  pushHistory();
                  const clone = JSON.parse(JSON.stringify(clipboard));
                  clone.id = 'el_' + Date.now();
                  clone.x += 40;
                  clone.y += 40;
                  clone.zIndex = elements.length + 1;
                  setElements(prev => [...prev, clone]);
                  setSelectedElementId(clone.id);
                }
                setContextMenu(null);
              }}><Copy size={16} /> Paste</button>
            </>
          )}
        </div>
      )}

      {cropTargetId && (
        <ImageCropModal
          imageUrl={elements.find(e => e.id === cropTargetId)?.payload?.url || ''}
          onClose={() => setCropTargetId(null)}
          onCropApply={(croppedImageUrl, cropW, cropH, naturalW, naturalH) => {
            const el = elements.find(e => e.id === cropTargetId);
            if (!el) {
               return;
            }
            const oldW = el.width || 400;
            const oldH = el.height || 300;
            const percentW = cropW / naturalW;
            const percentH = cropH / naturalH;
            
            const newW = Math.round(oldW * percentW);
            const newH = Math.round(oldH * percentH);

            pushHistory();
            updateElementProps(cropTargetId, { 
              width: newW,
              height: newH,
              payload: { ...el.payload, url: croppedImageUrl } 
            });
            setCropTargetId(null);
          }}
        />
      )}
      
      <style>{`
        .context-menu-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: var(--foreground);
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .context-menu-btn:hover:not(:disabled) {
          background: rgba(37,99,235,0.1);
        }
        .context-menu-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
