import React, { useState, useRef, useEffect } from 'react';
import { LayoutTemplate, Plus, Save, Trash2, Edit } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface Template {
  id: string;
  name: string;
  zones: Zone[];
}

export function TemplateDesignerTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  
  // Drag state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    if (res.ok) setTemplates(await res.json());
  };

  const handleAddZone = () => {
    const newZone: Zone = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Zone ${zones.length + 1}`,
      x: 10, y: 10, width: 30, height: 30, zIndex: zones.length
    };
    setZones([...zones, newZone]);
    setActiveZoneId(newZone.id);
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
    if (activeZoneId === id) setActiveZoneId(null);
  };

  const handleSaveTemplate = async () => {
    if (!templateName || zones.length === 0) return alert("Enter a name and add at least one zone.");
    
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: templateName, zones })
    });
    
    if (res.ok) {
      setIsCreating(false);
      setTemplateName("");
      setZones([]);
      fetchTemplates();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'drag' | 'resize') => {
    e.stopPropagation();
    setActiveZoneId(id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const zone = zones.find(z => z.id === id);
    if (!zone) return;
    
    // Pixel coordinates of mouse relative to canvas
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    // Convert zone percentage back to pixels
    const zoneXPx = (zone.x / 100) * rect.width;
    const zoneYPx = (zone.y / 100) * rect.height;

    if (type === 'drag') {
      setIsDragging(true);
      setDragOffset({ x: startX - zoneXPx, y: startY - zoneYPx });
    } else {
      setIsResizing(true);
      // For resizing, offset is just the initial mouse pos
      setDragOffset({ x: startX, y: startY });
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && !isResizing) return;
    if (!activeZoneId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;

    // Clamp inside canvas
    currentX = Math.max(0, Math.min(currentX, rect.width));
    currentY = Math.max(0, Math.min(currentY, rect.height));

    setZones(prev => prev.map(z => {
      if (z.id !== activeZoneId) return z;
      
      let newX = z.x;
      let newY = z.y;
      let newW = z.width;
      let newH = z.height;

      if (isDragging) {
        newX = ((currentX - dragOffset.x) / rect.width) * 100;
        newY = ((currentY - dragOffset.y) / rect.height) * 100;
        // Clamp to edges
        newX = Math.max(0, Math.min(newX, 100 - newW));
        newY = Math.max(0, Math.min(newY, 100 - newH));
      } else if (isResizing) {
        // Simple bottom-right resize
        const zoneXPx = (z.x / 100) * rect.width;
        const zoneYPx = (z.y / 100) * rect.height;
        newW = ((currentX - zoneXPx) / rect.width) * 100;
        newH = ((currentY - zoneYPx) / rect.height) * 100;
        // Min size 5%
        newW = Math.max(5, Math.min(newW, 100 - z.x));
        newH = Math.max(5, Math.min(newH, 100 - z.y));
      }

      return { ...z, x: newX, y: newY, width: newW, height: newH };
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!isCreating ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutTemplate size={24} style={{ color: 'var(--brand-primary)' }} /> Layout Templates
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                Design multi-zone layouts for your screens.
              </p>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Plus size={20} /> Create Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {templates.map(tpl => (
              <div key={tpl.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{tpl.name}</h3>
                
                {/* Mini Preview */}
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                  {tpl.zones.map(z => (
                    <div key={z.id} style={{
                      position: 'absolute',
                      left: `${z.x}%`, top: `${z.y}%`, width: `${z.width}%`, height: `${z.height}%`,
                      border: '1px solid rgba(255,255,255,0.5)',
                      background: 'rgba(138, 146, 255, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', color: 'white'
                    }}>
                      {z.name}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => handleDeleteTemplate(tpl.id)} style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 150px)' }}>
          {/* Canvas Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <input 
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="Template Name..."
                  style={{ fontSize: '24px', fontWeight: 'bold', background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none' }}
                />
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button onClick={() => setIsCreating(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                 <button onClick={handleSaveTemplate} style={{ padding: '8px 16px', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={18} /> Save</button>
               </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div 
                ref={canvasRef}
                style={{ width: '800px', height: '450px', background: '#000', position: 'relative', overflow: 'hidden', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {zones.map(z => (
                  <div 
                    key={z.id}
                    onPointerDown={(e) => handlePointerDown(e, z.id, 'drag')}
                    style={{
                      position: 'absolute',
                      left: `${z.x}%`,
                      top: `${z.y}%`,
                      width: `${z.width}%`,
                      height: `${z.height}%`,
                      border: activeZoneId === z.id ? '2px solid var(--brand-primary)' : '1px solid rgba(255,255,255,0.2)',
                      background: activeZoneId === z.id ? 'rgba(138, 146, 255, 0.4)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    {z.name}
                    
                    {/* Resize Handle */}
                    {activeZoneId === z.id && (
                      <div 
                        onPointerDown={(e) => handlePointerDown(e, z.id, 'resize')}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '15px',
                          height: '15px',
                          background: 'var(--brand-primary)',
                          cursor: 'nwse-resize'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="glass-panel" style={{ width: '300px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <button onClick={handleAddZone} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Plus size={18} /> Add Zone
            </button>

            {zones.map(z => (
              <div key={z.id} onClick={() => setActiveZoneId(z.id)} style={{ padding: '12px', background: activeZoneId === z.id ? 'rgba(138, 146, 255, 0.1)' : 'transparent', border: activeZoneId === z.id ? '1px solid var(--brand-primary)' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                   <input 
                     value={z.name}
                     onChange={(e) => setZones(zones.map(zn => zn.id === z.id ? { ...zn, name: e.target.value } : zn))}
                     style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none' }}
                   />
                   <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleDeleteZone(z.id); }} />
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                   <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>X (%)</span><br/>{z.x.toFixed(1)}</div>
                   <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Y (%)</span><br/>{z.y.toFixed(1)}</div>
                   <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>W (%)</span><br/>{z.width.toFixed(1)}</div>
                   <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>H (%)</span><br/>{z.height.toFixed(1)}</div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
