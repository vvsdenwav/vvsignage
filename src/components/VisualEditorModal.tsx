import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, MonitorPlay, LayoutTemplate, Copy, Check, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { renderWidgetContent } from './WidgetRenderer';
import { ImageCropModal } from './ImageCropModal';
import { Crop } from 'lucide-react';

const FONT_FAMILY_OPTIONS = [
  { value: 'inherit', label: 'Global Canvas Default' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Outfit, sans-serif', label: 'Outfit' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: "'Courier New', monospace", label: 'Monospace' },
  { value: "'Pacifico', cursive", label: 'Handwritten' }
];

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-Bold' },
  { value: 'bold', label: 'Bold' },
  { value: '900', label: 'Heavy' }
];

const TEXT_ALIGN_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

/* ─── helpers ─── */
export const WIDGET_FORM_SCHEMAS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'url'; placeholder?: string; options?: { value: string; label: string }[]; min?: number; max?: number }>> = {
  clock: [
    { key: 'format', label: 'Format', type: 'select', options: [
      { value: 'HH:mm:ss', label: '24h with seconds' },
      { value: 'hh:mm:ss A', label: '12h with seconds' },
      { value: 'HH:mm', label: '24h' },
      { value: 'hh:mm A', label: '12h' },
    ]},
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 300 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: TEXT_ALIGN_OPTIONS },
  ],
  label: [
    { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Enter label text…' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 300 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: TEXT_ALIGN_OPTIONS },
  ],
  text: [
    { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Enter your text…' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 300 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: TEXT_ALIGN_OPTIONS },
  ],
  qrcode: [
    { key: 'destinationUrl', label: 'Target / Redirect URL', type: 'text', placeholder: 'https://www.tropicair.com/promo' },
    { key: 'label', label: 'Campaign Label (Text below QR)', type: 'text', placeholder: 'Scan for 20% Off' },
    { key: 'foregroundColor', label: 'QR Pattern Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
  ],
  weather: [
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. San Pedro, Belize' },
    { key: 'unit', label: 'Temperature Unit', type: 'select', options: [
      { value: 'fahrenheit', label: '°F (Fahrenheit)' }, { value: 'celsius', label: '°C (Celsius)' }
    ]},
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
    { key: 'theme', label: 'Widget Theme', type: 'select', options: [
      { value: 'glass', label: 'Glass Modern (Dark)' }, 
      { value: 'tropic', label: 'Tropic Air Layout' },
      { value: 'compact', label: 'Compact Banner' },
      { value: 'minimal', label: 'Minimal (Light)' },
      { value: 'flat', label: 'Flat (Blue)' }
    ]},
  ],
  ticker: [
    { key: 'text', label: 'Scrolling Text', type: 'textarea', placeholder: 'Enter scrolling text…' },
    { key: 'speed', label: 'Speed (1–100)', type: 'number', min: 1, max: 100 },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
  ],
  countdown: [
    { key: 'targetDate', label: 'Target Date & Time', type: 'text', placeholder: '2026-12-31T23:59:59' },
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Countdown to…' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 300 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
    { key: 'textAlign', label: 'Text Alignment', type: 'select', options: TEXT_ALIGN_OPTIONS },
  ],
  image: [
    { key: 'url', label: 'Image URL', type: 'url', placeholder: 'https://…' },
    { key: 'objectFit', label: 'Fit Mode', type: 'select', options: [
      { value: 'contain', label: 'Contain' }, { value: 'cover', label: 'Cover' }, { value: 'fill', label: 'Fill' }
    ]},
  ],
  video: [
    { key: 'url', label: 'Video URL', type: 'url', placeholder: 'https://…/video.mp4' },
    { key: 'objectFit', label: 'Fit Mode', type: 'select', options: [
      { value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }
    ]},
  ],
  youtube: [
    { key: 'url', label: 'YouTube URL', type: 'url', placeholder: 'https://youtube.com/watch?v=…' },
  ],
  webpage: [
    { key: 'url', label: 'Webpage URL', type: 'url', placeholder: 'https://example.com' },
  ],
  embed: [
    { key: 'url', label: 'Embed URL', type: 'url', placeholder: 'https://…' },
  ],
  canva: [
    { key: 'url', label: 'Canva/Slides Embed URL', type: 'url', placeholder: 'https://…' },
  ],
  webimage: [
    { key: 'url', label: 'Image URL', type: 'url', placeholder: 'https://…/image.jpg' },
    { key: 'refreshInterval', label: 'Refresh Interval (seconds)', type: 'number', min: 0 },
  ],
  rss: [
    { key: 'feedUrl', label: 'RSS Feed URL', type: 'url', placeholder: 'https://…/feed.xml' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
  ],
  mrss: [
    { key: 'feedUrl', label: 'MRSS Feed URL', type: 'url', placeholder: 'https://…/mrss.xml' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
  ],
  shape: [
    { key: 'shapeType', label: 'Shape', type: 'select', options: [
      { value: 'rectangle', label: 'Rectangle' }, { value: 'circle', label: 'Circle' }, { value: 'rounded', label: 'Rounded Rectangle' }
    ]},
    { key: 'backgroundColor', label: 'Fill Color', type: 'color' },
    { key: 'text', label: 'Text Inside', type: 'text', placeholder: 'Optional text…' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
  ],
  slideshow: [
    { key: 'urls', label: 'Image URLs (one per line)', type: 'textarea', placeholder: 'https://…/img1.jpg\nhttps://…/img2.jpg' },
    { key: 'interval', label: 'Slide Interval (seconds)', type: 'number', min: 1 },
  ],
  streaming: [
    { key: 'url', label: 'Stream URL', type: 'url', placeholder: 'https://…/stream.m3u8' },
  ],
  twitter: [
    { key: 'handle', label: 'Twitter Handle', type: 'text', placeholder: '@username' },
  ],
  instagram: [
    { key: 'url', label: 'Instagram Embed URL', type: 'url', placeholder: 'https://instagram.com/p/…' },
  ],
  facebook: [
    { key: 'url', label: 'Facebook Page URL', type: 'url', placeholder: 'https://facebook.com/…' },
  ],
  table: [
    { key: 'csvData', label: 'Table Data (CSV format: Header line, then row lines)', type: 'textarea', placeholder: "Flight #, Destination, Time, Gate, Status\n301, San Pedro, 09:15 AM, G1, Boarding\n302, Belize City, 09:45 AM, G2, On Time\n305, Caye Caulker, 10:30 AM, G1, Scheduled" },
    { key: 'backgroundColor', label: 'Fill Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
  ],
  calendar: [
    { key: 'backgroundColor', label: 'Fill Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 8, max: 200 },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_FAMILY_OPTIONS },
  ]
};

export function VisualEditorModal(props: any) {
  const {
    visualEditorScreenId, setVisualEditorScreenId, screens, visualEditorRightTab, setVisualEditorRightTab,
    selectedOverlayId, setSelectedOverlayId,
    WIDGET_TYPES,
    fetchPlaylists, playlists, fetchWidgets,
    handleCommit, isDraggingWidget, setIsDraggingWidget, mediaAssets
  } = props;

  // ─── DRAFT MODE STATE ───
  const [draftOverlays, setDraftOverlays] = useState<any[]>([]);
  const [initialOverlays, setInitialOverlays] = useState<any[]>([]);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [showApplyToScreensModal, setShowApplyToScreensModal] = useState(false);
  const [selectedScreensForCopy, setSelectedScreensForCopy] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // Global Canvas Properties
  const [canvasProperties, setCanvasProperties] = useState<any>({
    backgroundColor: '#000000',
    backgroundImage: '',
    fontFamily: 'Inter, sans-serif'
  });

  // Layout & Clipboard State
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasDraftChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasDraftChanges]);

  const [activeScreen, setActiveScreen] = useState<any>(null);
  const [clipboard, setClipboard] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string | null } | null>(null);
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);

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
      setSelectedOverlayId(id);
      setVisualEditorRightTab('properties');
    } else {
      setSelectedOverlayId(null);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };
  
  // Folders for media picker
  const folders = useMemo(() => {
    const map = new Map();
    (mediaAssets || []).forEach((m: any) => {
      if (m.folderId && m.folder) {
        if (!map.has(m.folderId)) map.set(m.folderId, m.folder);
      }
    });
    return Array.from(map.values());
  }, [mediaAssets]);

  // ─── Init draft overlays from actual playlist ───
  useEffect(() => {
    if (!visualEditorScreenId) return;
    const screen = screens.find((s: any) => s.id === visualEditorScreenId);
    const pl = playlists.find((p: any) => p.id === screen?.playlistId);
    if (pl?.overlays) {
      const parsed = JSON.parse(JSON.stringify(pl.overlays));
      // Ensure all widgets have a valid Z-Index
      parsed.forEach((o: any, idx: number) => {
        let p: any = {};
        try { p = typeof o.widget.dataPayload === 'string' ? JSON.parse(o.widget.dataPayload || '{}') : (o.widget.dataPayload || {}); } catch(e){}
        if (p.zIndex === undefined) p.zIndex = idx + 1;
        o.widget.dataPayload = JSON.stringify(p);
      });
      setDraftOverlays(parsed);
      setInitialOverlays(JSON.parse(JSON.stringify(parsed))); 
      setHasDraftChanges(false);
    } else {
      setDraftOverlays([]);
      setInitialOverlays([]);
      setHasDraftChanges(false);
    }
    
    // Check if playlist has canvas properties saved
    // We could store canvas properties in the playlist description or metadata in a real app, 
    // for now we'll just keep it in local state.
  }, [visualEditorScreenId, playlists, screens]);

  // ─── Draft helpers ───
  const handleRemoveOverlayFromDraft = useCallback((overlayId: string) => {
    setDraftOverlays(prev => prev.filter(o => o.id !== overlayId && (o.widget?.id || o.widgetId) !== overlayId));
    setHasDraftChanges(true);
    if (selectedOverlayId === overlayId) {
      setSelectedOverlayId(null);
      setVisualEditorRightTab('properties'); // switch back to canvas settings
    }
  }, [selectedOverlayId, setSelectedOverlayId, setVisualEditorRightTab]);

  const handleAddWidgetToDraft = useCallback((typeId: string, dropPos?: {x: number, y: number}) => {
    const widgetTypeMeta = WIDGET_TYPES.find((w: any) => w.id === typeId);
    const defaultName = widgetTypeMeta ? `New ${widgetTypeMeta.name}` : `New ${typeId}`;
    
    const baseW = 400; // default 400px width
    const baseH = 300; // default 300px height
    
    let defaultX = 50 - ((baseW / 1920) * 100 / 2); // Center X %
    let defaultY = 50 - ((baseH / 1080) * 100 / 2); // Center Y %
    
    if (dropPos) {
       // dropPos is in pixels relative to the 1920x1080 canvas
       defaultX = (dropPos.x / 1920) * 100;
       defaultY = (dropPos.y / 1080) * 100;
    }

    const defaults: Record<string, string> = {
      label:     JSON.stringify({text: "New Label", fontSize: 64, color: "#ffffff", x: defaultX, y: defaultY, width: (600/1920)*100, height: (150/1080)*100, zIndex: draftOverlays.length + 1}),
      text:      JSON.stringify({text: "Enter your text here.", fontSize: 32, color: "#ffffff", x: defaultX, y: defaultY, width: (800/1920)*100, height: (400/1080)*100, zIndex: draftOverlays.length + 1}),
      image:     JSON.stringify({url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", objectFit: "cover", x: defaultX, y: defaultY, width: (baseW/1920)*100, height: (baseH/1080)*100, zIndex: draftOverlays.length + 1}),
      video:     JSON.stringify({url: "https://www.w3schools.com/html/mov_bbb.mp4", objectFit: "cover", x: defaultX, y: defaultY, width: (baseW/1920)*100, height: (baseH/1080)*100, zIndex: draftOverlays.length + 1}),
      canva:     JSON.stringify({url: "https://www.canva.com/design/...", x: defaultX, y: defaultY, width: (baseW/1920)*100, height: (baseH/1080)*100, zIndex: draftOverlays.length + 1}),
      youtube:   JSON.stringify({url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", x: defaultX, y: defaultY, width: (640/1920)*100, height: (360/1080)*100, zIndex: draftOverlays.length + 1}),
      ticker:    JSON.stringify({text: "Breaking News - Your scrolling text goes here.", speed: 50, x: 0, y: 90, width: 100, height: 10, zIndex: 999}),
      clock:     JSON.stringify({format: "HH:mm:ss", x: defaultX, y: defaultY, width: (300/1920)*100, height: (150/1080)*100, zIndex: draftOverlays.length + 1}),
      weather:   JSON.stringify({location: "San Pedro, Belize", unit: "fahrenheit", theme: "tropic", x: defaultX, y: defaultY, width: (400/1920)*100, height: (350/1080)*100, zIndex: draftOverlays.length + 1}),
      shape:     JSON.stringify({shapeType: "rectangle", backgroundColor: "#2563EB", text: "", x: defaultX, y: defaultY, width: (baseW/1920)*100, height: (baseH/1080)*100, zIndex: draftOverlays.length + 1}),
    };
    
    // Default fallback
    const defaultPayload = defaults[typeId] || JSON.stringify({x: defaultX, y: defaultY, width: (baseW/1920)*100, height: (baseH/1080)*100, zIndex: draftOverlays.length + 1});
    const tempId = `temp-${Date.now()}`;
    const screen = screens.find((s: any) => s.id === visualEditorScreenId);
    
    const newOverlay = {
      id: tempId,
      playlistId: screen?.playlistId || '',
      widgetId: tempId,
      widget: {
        id: tempId,
        name: defaultName,
        type: typeId,
        dataPayload: defaultPayload,
        position: 'custom',
        backgroundColor: 'transparent'
      }
    };
    
    setDraftOverlays(prev => [...prev, newOverlay]);
    setHasDraftChanges(true);
    setSelectedOverlayId(tempId);
    setVisualEditorRightTab('properties');
  }, [WIDGET_TYPES, screens, visualEditorScreenId, setSelectedOverlayId, setVisualEditorRightTab, draftOverlays]);

  const updateDraftPayload = useCallback((widgetId: string, partialPayload: Record<string, any>) => {
    setDraftOverlays(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const ov = copy.find((o: any) => (o.widget?.id || o.id) === widgetId);
      if (!ov) return prev;
      const w = ov.widget || ov;
      let existing: any = {};
      try { existing = typeof w.dataPayload === 'string' ? JSON.parse(w.dataPayload || '{}') : (w.dataPayload || {}); } catch {}
      Object.assign(existing, partialPayload);
      w.dataPayload = JSON.stringify(existing);
      setHasDraftChanges(true);
      return copy;
    });
  }, []);

  const updateDraftWidgetField = useCallback((widgetId: string, field: string, value: any) => {
    setDraftOverlays(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const ov = copy.find((o: any) => (o.widget?.id || o.id) === widgetId);
      if (!ov) return prev;
      const w = ov.widget || ov;
      w[field] = value;
      setHasDraftChanges(true);
      return copy;
    });
  }, []);
  
  const moveZIndex = (widgetId: string, direction: 'up' | 'down' | 'front' | 'back') => {
    setDraftOverlays(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      // 1. Sort ascending by current zIndex
      copy.sort((a: any, b: any) => {
        const pA = typeof (a.widget || a).dataPayload === 'string' ? JSON.parse((a.widget || a).dataPayload || '{}') : ((a.widget || a).dataPayload || {});
        const pB = typeof (b.widget || b).dataPayload === 'string' ? JSON.parse((b.widget || b).dataPayload || '{}') : ((b.widget || b).dataPayload || {});
        return (pA.zIndex || 1) - (pB.zIndex || 1);
      });
      
      // 2. Find index
      const idx = copy.findIndex((o: any) => (o.widget?.id || o.id) === widgetId);
      if (idx === -1) return prev;
      
      // 3. Swap in the array if possible
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
      
      // 4. Normalize zIndex to 1, 2, 3... N
      copy.forEach((o: any, index: number) => {
        const w = o.widget || o;
        let p: any = {};
        try { p = typeof w.dataPayload === 'string' ? JSON.parse(w.dataPayload || '{}') : (w.dataPayload || {}); } catch {}
        p.zIndex = index + 1;
        w.dataPayload = JSON.stringify(p);
      });
      
      setHasDraftChanges(true);
      return copy;
    });
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    if (!visualEditorScreenId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;
      const selected = draftOverlays.find(o => o.id === selectedOverlayId);
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selected) {
        setClipboard(JSON.parse(JSON.stringify(selected)));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selected) {
        setClipboard(JSON.parse(JSON.stringify(selected)));
        handleRemoveOverlayFromDraft(selected.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        const newOverlay = JSON.parse(JSON.stringify(clipboard));
        newOverlay.id = `temp-${Date.now()}`;
        if (newOverlay.widget) {
          newOverlay.widget.id = newOverlay.id;
          newOverlay.widgetId = newOverlay.id;
        }
        
        // Offset paste position slightly
        let p: any = {};
        try { p = typeof newOverlay.widget.dataPayload === 'string' ? JSON.parse(newOverlay.widget.dataPayload || '{}') : (newOverlay.widget.dataPayload || {}); } catch {}
        if (p.x) p.x += 2; // +2% offset
        if (p.y) p.y += 2; // +2% offset
        p.zIndex = draftOverlays.length + 1;
        newOverlay.widget.dataPayload = JSON.stringify(p);
        
        setDraftOverlays(prev => [...prev, newOverlay]);
        setHasDraftChanges(true);
        setSelectedOverlayId(newOverlay.id);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        handleRemoveOverlayFromDraft(selected.id);
      } else if (e.key === 'ArrowUp') {
         if (selected) { e.preventDefault(); let p: any = {}; try { p = JSON.parse(selected.widget.dataPayload || '{}'); } catch {} updateDraftPayload(selected.id, { y: (p.y || 0) - 0.5 }); }
      } else if (e.key === 'ArrowDown') {
         if (selected) { e.preventDefault(); let p: any = {}; try { p = JSON.parse(selected.widget.dataPayload || '{}'); } catch {} updateDraftPayload(selected.id, { y: (p.y || 0) + 0.5 }); }
      } else if (e.key === 'ArrowLeft') {
         if (selected) { e.preventDefault(); let p: any = {}; try { p = JSON.parse(selected.widget.dataPayload || '{}'); } catch {} updateDraftPayload(selected.id, { x: (p.x || 0) - 0.5 }); }
      } else if (e.key === 'ArrowRight') {
         if (selected) { e.preventDefault(); let p: any = {}; try { p = JSON.parse(selected.widget.dataPayload || '{}'); } catch {} updateDraftPayload(selected.id, { x: (p.x || 0) + 0.5 }); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visualEditorScreenId, draftOverlays, selectedOverlayId, clipboard, handleRemoveOverlayFromDraft, updateDraftPayload]);

  // ─── Apply to DB ───
  const applySettings = async () => {
    setIsApplying(true);
    try {
      const screen = screens.find((s: any) => s.id === visualEditorScreenId);
      const playlistId = screen?.playlistId;
      if (!playlistId) return false;

      const currentIds = draftOverlays.map(o => o.id);
      const removedOverlays = initialOverlays.filter(o => !currentIds.includes(o.id));
      for (const removed of removedOverlays) {
        await fetch(`/api/playlists/${playlistId}/overlays/${removed.id}`, { method: 'DELETE' });
      }

      for (const overlay of draftOverlays) {
        const w = overlay.widget || overlay;
        const payloadData = typeof w.dataPayload === 'object' ? JSON.stringify(w.dataPayload) : w.dataPayload;
        
        if (overlay.id.toString().startsWith('temp-')) {
          const createRes = await fetch('/api/widgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: w.name, type: w.type, dataPayload: payloadData, position: w.position, backgroundColor: w.backgroundColor
            })
          });
          const createData = await createRes.json();
          if (createData.success) {
            await fetch(`/api/playlists/${playlistId}/overlays`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ widgetId: createData.widget.id })
            });
          }
        } else {
          await fetch(`/api/widgets/${w.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: w.name, type: w.type, position: w.position, dataPayload: payloadData, backgroundColor: w.backgroundColor,
            })
          });
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      alert("Failed to apply settings");
      return false;
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveSelection = async (action: 'draft' | 'now' | 'schedule') => {
    setIsApplying(true);
    try {
      const screen = screens.find((s: any) => s.id === visualEditorScreenId);
      const playlistId = screen?.playlistId;
      if (!playlistId) {
        alert("This screen has no playlist assigned.");
        setIsApplying(false);
        return;
      }

      const success = await applySettings();
      if (!success) return;

      let scheduledDateISO = null;
      if (action === 'schedule') {
        if (!scheduleDate || !scheduleTime) {
          alert('Please select a date and time.');
          setIsApplying(false);
          return;
        }
        const schedDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
        if (isNaN(schedDate.getTime())) {
          alert('Please select a valid date and time.');
          setIsApplying(false);
          return;
        }
        if (schedDate.getTime() <= Date.now()) {
          alert('Scheduled push time must be in the future.');
          setIsApplying(false);
          return;
        }
        scheduledDateISO = schedDate.toISOString();
      } else if (action === 'draft' || action === 'now') {
        scheduledDateISO = null;
      }

      const saveRes = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledPushAt: scheduledDateISO,
          pushImmediately: action === 'now'
        })
      });

      if (!saveRes.ok) {
        alert('Failed to save playlist metadata.');
        setIsApplying(false);
        return;
      }

      if (action === 'now') {
        await fetch(`/api/playlists/${playlistId}/push`, { method: 'POST' });
      }

      setShowSaveModal(false);
      setHasDraftChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
      if (fetchWidgets) await fetchWidgets();
      await fetchPlaylists();
      if (handleCommit) await handleCommit(true);
    } catch (e) {
      console.error(e);
      alert('Error saving updates.');
    } finally {
      setIsApplying(false);
    }
  };

  const applySettingsToScreens = async () => {
    setIsApplying(true);
    try {
      const success = await applySettings();
      if (!success) return;
      const currentScreen = screens.find((s: any) => s.id === visualEditorScreenId);
      if (!currentScreen?.playlistId) return;

      for (const targetScreenId of selectedScreensForCopy) {
        if (targetScreenId === visualEditorScreenId) continue;
        const target = screens.find((s: any) => s.id === targetScreenId);
        if (!target?.playlistId) continue;

        for (const overlay of draftOverlays) {
          const w = overlay.widget || overlay;
          const res = await fetch('/api/widgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: w.name + ' (Copy)', type: w.type, dataPayload: typeof w.dataPayload === 'object' ? JSON.stringify(w.dataPayload) : w.dataPayload, position: w.position, backgroundColor: w.backgroundColor })
          });
          const d = await res.json();
          if (d.success) {
            await fetch(`/api/playlists/${target.playlistId}/overlays`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ widgetId: d.widget.id }) });
          }
        }
      }
      setShowApplyToScreensModal(false);
      setSelectedScreensForCopy([]);
      alert("Overlays copied to selected screens!");
    } catch (e) {
      console.error(e);
      alert("Failed to copy settings");
    } finally {
      setIsApplying(false);
    }
  };

  // ─── Render a form field ───
  const renderField = (widget: any, payload: any, field: (typeof WIDGET_FORM_SCHEMAS)['label'][0]) => {
    const val = payload[field.key];

    if (field.type === 'select') {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <select
            value={val ?? field.options?.[0]?.value ?? ''}
            onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
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
              onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
              style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
            />
            <input
              type="text"
              value={val || '#ffffff'}
              onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
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
            onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
            className="input-field custom-scroll"
            rows={3}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === 'url' && mediaAssets) {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={val ?? ''}
              onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
              className="input-field"
              placeholder={field.placeholder || "https://..."}
            />
            <select
              className="input-field"
              value=""
              onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
              style={{ background: 'var(--brand-primary)', color: 'white' }}
            >
              <option value="" disabled>Select from Media Library...</option>
              {folders ? folders.map((folder: any) => (
                <optgroup key={folder.id} label={folder.name}>
                  {mediaAssets.filter((m: any) => m.folderId === folder.id).map((media: any) => (
                    <option key={media.id} value={media.url}>
                      {media.name} ({media.type})
                    </option>
                  ))}
                </optgroup>
              )) : null}
              <optgroup label={folders && folders.length > 0 ? "Root folder" : "Media Assets"}>
                {mediaAssets.filter((m: any) => !m.folderId).map((media: any) => (
                  <option key={media.id} value={media.url}>
                    {media.name} ({media.type})
                  </option>
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
            updateDraftPayload(widget.id, { [field.key]: v });
          }}
          className="input-field"
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
        />
      </div>
    );
  };

  if (!visualEditorScreenId) return null;

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>

        {/* ─── Header ─── */}
        <header style={{ height: '60px', background: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setShowLeftSidebar(!showLeftSidebar)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Toggle Widgets Library">
              <LayoutTemplate size={20} />
            </button>
            <MonitorPlay color="var(--brand-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Visual Layout Editor</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {hasDraftChanges && (
              <>
                <button onClick={() => setShowSaveModal(true)} className="btn-primary" disabled={isApplying} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isApplying ? 'Saving…' : saveSuccess ? <><Check size={16} /> Saved!</> : 'Save Changes'}
                </button>
                <button onClick={() => setShowApplyToScreensModal(true)} className="btn-secondary" style={{ borderColor: 'var(--brand-secondary)', color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isApplying}>
                  <Copy size={14} /> Copy to Screens…
                </button>
              </>
            )}
            <button onClick={() => { 
              if (hasDraftChanges) {
                if (!confirm("You have unsaved changes. Are you sure you want to discard them and close?")) return;
              }
              setVisualEditorScreenId(null); 
              setHasDraftChanges(false); 
            }} className="btn-secondary">
              Close
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
                    onClick={() => handleAddWidgetToDraft(w.id)}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('widgetType', w.id); setIsDraggingWidget(true); }}
                    onDragEnd={() => setIsDraggingWidget(false)}
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
            style={{ flex: 1, minWidth: 0, minHeight: 0, background: 'var(--background)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedOverlayId(null); }}
            onContextMenu={(e) => handleContextMenu(e, null)}
          >
            <div 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', overflow: 'auto' }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedOverlayId(null); }}
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
                  background: canvasProperties.backgroundColor || '#000000',
                  backgroundImage: canvasProperties.backgroundImage ? `url(${canvasProperties.backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  overflow: 'hidden',
                  fontFamily: canvasProperties.fontFamily || 'inherit'
                }}
                onClick={(e) => {
                   // Deselect if clicking exactly on canvas background
                   if (e.target === e.currentTarget) {
                     setSelectedOverlayId(null);
                     setVisualEditorRightTab('properties'); // show canvas settings
                   }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  setIsDraggingWidget(false); 
                  const t = e.dataTransfer.getData('widgetType'); 
                  if (t) {
                     // calculate drop position relative to canvas
                     const rect = e.currentTarget.getBoundingClientRect();
                     const scale = zoomLevel / 100;
                     const dropX = (e.clientX - rect.left) / scale;
                     const dropY = (e.clientY - rect.top) / scale;
                     handleAddWidgetToDraft(t, { x: dropX, y: dropY });
                  }
                }}
              >
                {/* Live Screen Feed Background */}
                {visualEditorScreenId && (
                  <iframe
                    src={`/player/${visualEditorScreenId}?testMode=true`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                    title="Live Screen Feed"
                  />
                )}
                {/* Render Widgets with react-rnd */}
                {draftOverlays.map(overlay => {
                   const w = overlay.widget || overlay;
                   let p: any = {};
                   try { p = typeof w.dataPayload === 'string' ? JSON.parse(w.dataPayload || '{}') : (w.dataPayload || {}); } catch {}
                   
                   // Ensure it has x,y,w,h based on 1920x1080 percentages
                   const x = (p.x !== undefined ? p.x : 0) / 100 * 1920;
                   const y = (p.y !== undefined ? p.y : 0) / 100 * 1080;
                   const width = (p.width !== undefined ? p.width : 20) / 100 * 1920;
                   const height = (p.height !== undefined ? p.height : 20) / 100 * 1080;
                   const isSelected = selectedOverlayId === overlay.id;

                   return (
                     <Rnd
                       key={overlay.id}
                       scale={zoomLevel / 100}
                       lockAspectRatio={w.type === 'image'}
                       position={{ x, y }}
                       size={{ width, height }}
                       style={{ zIndex: p.zIndex || 1 }}
                       onDragStop={(e, d) => {
                         const newX = (d.x / 1920) * 100;
                         const newY = (d.y / 1080) * 100;
                         updateDraftPayload(w.id, { x: newX, y: newY });
                       }}
                       onResizeStop={(e, direction, ref, delta, position) => {
                         const newWidth = (parseFloat(ref.style.width) / 1920) * 100;
                         const newHeight = (parseFloat(ref.style.height) / 1080) * 100;
                         const newX = (position.x / 1920) * 100;
                         const newY = (position.y / 1080) * 100;
                         updateDraftPayload(w.id, { width: newWidth, height: newHeight, x: newX, y: newY });
                       }}
                       onDragStart={() => setSelectedOverlayId(overlay.id)}
                       onResizeStart={() => setSelectedOverlayId(overlay.id)}
                       dragHandleClassName="drag-handle"
                       className={isSelected ? "widget-selected" : ""}
                     >
                       <div 
                         style={{ 
                           width: '100%', 
                           height: '100%', 
                           position: 'relative',
                           border: isSelected ? '3px solid var(--brand-primary)' : '1px solid transparent',
                           backgroundColor: w.backgroundColor !== 'transparent' ? w.backgroundColor : 'transparent',
                           transition: 'border 0.2s'
                         }}
                         onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(overlay.id); setVisualEditorRightTab('properties'); }}
                         onContextMenu={(e) => handleContextMenu(e, overlay.id)}
                       >
                         {/* Internal div to hold content so it scales correctly within Rnd */}
                         <div className="drag-handle" style={{ width: '100%', height: '100%', cursor: 'grab', position: 'relative', containerType: 'size', overflow: 'hidden' }}>
                           {renderWidgetContent({ widget: w }, {}, {}, true)}
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
              {['overlays', 'properties'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setVisualEditorRightTab(tab)}
                  style={{ flex: 1, padding: '14px 0', fontSize: '13px', background: visualEditorRightTab === tab ? 'rgba(37,99,235,0.05)' : 'transparent', border: 'none', borderBottom: visualEditorRightTab === tab ? '2px solid var(--brand-primary)' : '2px solid transparent', color: visualEditorRightTab === tab ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

              {/* Overlays Tab (Layers) */}
              {visualEditorRightTab === 'overlays' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {draftOverlays.length === 0
                    ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No widgets on canvas.</p>
                    : [...draftOverlays]
                        .sort((a,b) => {
                          const zA = JSON.parse(a.widget?.dataPayload || a.dataPayload || '{}').zIndex || 0;
                          const zB = JSON.parse(b.widget?.dataPayload || b.dataPayload || '{}').zIndex || 0;
                          return zB - zA; // Highest Z-index at top
                        })
                        .map((o: any) => {
                        const w = o.widget || o;
                        return (
                          <div
                            key={o.id}
                            onClick={() => { setSelectedOverlayId(o.id); setVisualEditorRightTab('properties'); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: selectedOverlayId === o.id ? 'rgba(37,99,235,0.05)' : 'var(--card-bg)', borderRadius: '8px', border: selectedOverlayId === o.id ? '1px solid var(--brand-primary)' : '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ padding: '6px', background: 'rgba(37,99,235,0.1)', borderRadius: '6px' }}>
                                <LayoutTemplate size={16} color="var(--brand-primary)" />
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>{w.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{w.type}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveZIndex(o.id, 'up'); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                title="Bring Forward"
                              ><ArrowUp size={14} /></button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveZIndex(o.id, 'down'); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                title="Send Backward"
                              ><ArrowDown size={14} /></button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveOverlayFromDraft(o.id); }}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                title="Remove"
                              ><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}
                </div>
              )}

              {/* Properties Tab */}
              {visualEditorRightTab === 'properties' && (() => {
                const selectedOverlay = draftOverlays.find(o => o.id === selectedOverlayId);
                
                // If nothing is selected, show Canvas Settings
                if (!selectedOverlay) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '8px' }}>
                        <Settings size={20} color="var(--brand-primary)" />
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Canvas Settings</h3>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Background Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={canvasProperties.backgroundColor} onChange={e => setCanvasProperties((p: any) => ({...p, backgroundColor: e.target.value}))} style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                          <input type="text" value={canvasProperties.backgroundColor} onChange={e => setCanvasProperties((p: any) => ({...p, backgroundColor: e.target.value}))} className="input-field" style={{ flex: 1 }} />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Background Image (Optional)</label>
                        <input type="text" value={canvasProperties.backgroundImage} onChange={e => setCanvasProperties((p: any) => ({...p, backgroundImage: e.target.value}))} className="input-field" placeholder="https://..." />
                        {mediaAssets && mediaAssets.length > 0 && (
                          <select className="input-field" style={{ marginTop: '8px' }} onChange={e => setCanvasProperties((p: any) => ({...p, backgroundImage: e.target.value}))}>
                            <option value="">Select from Media Library...</option>
                            {folders.map((folder: any) => (
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
                        <select value={canvasProperties.fontFamily} onChange={e => setCanvasProperties((p: any) => ({...p, fontFamily: e.target.value}))} className="input-field">
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

                const widget = selectedOverlay.widget || selectedOverlay;
                let payload: any = {};
                try { payload = typeof widget.dataPayload === 'string' ? JSON.parse(widget.dataPayload || '{}') : (widget.dataPayload || {}); } catch {}

                const schema = WIDGET_FORM_SCHEMAS[widget.type];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Widget name */}
                    <div className="form-group">
                      <label className="form-label">Widget Name</label>
                      <input type="text" value={widget.name || ''} onChange={(e) => updateDraftWidgetField(widget.id, 'name', e.target.value)} className="input-field" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>X Pos (%)</label>
                        <input type="number" value={(payload.x ?? 0).toFixed(1)} onChange={(e) => updateDraftPayload(widget.id, { x: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Y Pos (%)</label>
                        <input type="number" value={(payload.y ?? 0).toFixed(1)} onChange={(e) => updateDraftPayload(widget.id, { y: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Width (%)</label>
                        <input type="number" value={(payload.width ?? 20).toFixed(1)} onChange={(e) => updateDraftPayload(widget.id, { width: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Height (%)</label>
                        <input type="number" value={(payload.height ?? 20).toFixed(1)} onChange={(e) => updateDraftPayload(widget.id, { height: parseFloat(e.target.value) })} className="input-field" style={{ padding: '6px' }} />
                      </div>
                    </div>

                    {/* Background color */}
                    <div className="form-group">
                      <label className="form-label">Widget Background</label>
                      <input type="text" value={widget.backgroundColor || 'transparent'} onChange={(e) => updateDraftWidgetField(widget.id, 'backgroundColor', e.target.value)} className="input-field" placeholder="transparent" />
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-primary)' }}>{widget.type} Settings</h4>

                    {/* Schema-driven form fields */}
                    {schema
                      ? schema.map(field => renderField(widget, payload, field))
                      : (
                        /* Fallback: auto-generate from payload keys */
                        Object.keys(payload).length > 0
                          ? Object.entries(payload).map(([key, val]) => {
                              if (typeof val === 'object' || ['x','y','width','height','zIndex'].includes(key)) return null;
                              return (
                                <div key={key} className="form-group">
                                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
                                  <input
                                    type={typeof val === 'number' ? 'number' : 'text'}
                                    value={val as any ?? ''}
                                    onChange={(e) => {
                                      const v = typeof val === 'number' ? parseFloat(e.target.value) : e.target.value;
                                      updateDraftPayload(widget.id, { [key]: v });
                                    }}
                                    className="input-field"
                                  />
                                </div>
                              );
                            })
                          : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No configurable properties for this widget type.</p>
                      )
                    }

                    {/* Collapsible raw JSON */}
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', userSelect: 'none' }}>Advanced: Raw JSON</summary>
                      <textarea
                        value={typeof widget.dataPayload === 'string' ? widget.dataPayload : JSON.stringify(widget.dataPayload || {}, null, 2)}
                        onChange={(e) => {
                          try { JSON.parse(e.target.value); updateDraftWidgetField(widget.id, 'dataPayload', e.target.value); } catch {}
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
      </div>

      {/* ─── Apply to Screens Modal ─── */}
      {showApplyToScreensModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--sidebar-bg)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Copy to Selected Screens</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>Choose which screens should receive a copy of these overlays.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {screens.filter((s: any) => s.id !== visualEditorScreenId).map((s: any) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={selectedScreensForCopy.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedScreensForCopy(p => [...p, s.id]); else setSelectedScreensForCopy(p => p.filter(x => x !== s.id)); }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <div><div style={{ fontWeight: '600' }}>{s.name}</div>{s.location && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.location}</div>}</div>
                </label>
              ))}
              {screens.filter((s: any) => s.id !== visualEditorScreenId).length === 0 && <p style={{ color: 'var(--text-muted)' }}>No other screens.</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowApplyToScreensModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={applySettingsToScreens} className="btn-primary" disabled={isApplying || selectedScreensForCopy.length === 0}>{isApplying ? 'Copying…' : 'Apply'}</button>
            </div>
          </div>
        </div>
      )}

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
              {(() => {
                const ov = draftOverlays.find(o => o.id === contextMenu.id);
                const wType = ov?.widget?.type || ov?.type;
                if (wType === 'image' || wType === 'webimage') {
                  return (
                    <>
                      <button className="context-menu-btn" onClick={() => { setCropTargetId(contextMenu.id!); setContextMenu(null); }}><Crop size={16} /> Crop Image</button>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    </>
                  );
                }
                return null;
              })()}
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'front'); setContextMenu(null); }}><ArrowUp size={16} /> Bring to Front</button>
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'up'); setContextMenu(null); }}><ArrowUp size={16} /> Bring Forward</button>
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'down'); setContextMenu(null); }}><ArrowDown size={16} /> Send Backward</button>
              <button className="context-menu-btn" onClick={() => { moveZIndex(contextMenu.id!, 'back'); setContextMenu(null); }}><ArrowDown size={16} /> Send to Back</button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button className="context-menu-btn" onClick={() => {
                const ovl = draftOverlays.find(o => o.id === contextMenu.id);
                if (ovl) setClipboard(JSON.parse(JSON.stringify(ovl)));
                setContextMenu(null);
              }}><Copy size={16} /> Copy</button>
              <button className="context-menu-btn" onClick={() => { setVisualEditorRightTab('overlays'); setContextMenu(null); }}><LayoutTemplate size={16} /> Layers</button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button className="context-menu-btn" onClick={() => { handleRemoveOverlayFromDraft(contextMenu.id!); setContextMenu(null); }} style={{ color: 'var(--danger)' }}><Trash2 size={16} /> Delete</button>
            </>
          ) : (
            <>
              <button className="context-menu-btn" disabled={!clipboard} onClick={() => {
                if (clipboard) {
                  const clone = JSON.parse(JSON.stringify(clipboard));
                  clone.id = 'ovl_' + Date.now();
                  if (clone.widget) {
                     clone.widget.id = 'widget_' + Date.now();
                     let p = JSON.parse(clone.widget.dataPayload || '{}');
                     p.x = (p.x || 0) + 2; // Offset slightly
                     p.y = (p.y || 0) + 2;
                     p.zIndex = draftOverlays.length + 1;
                     clone.widget.dataPayload = JSON.stringify(p);
                  }
                  setDraftOverlays(prev => [...prev, clone]);
                  setSelectedOverlayId(clone.id);
                  setHasDraftChanges(true);
                }
                setContextMenu(null);
              }}><Copy size={16} /> Paste</button>
            </>
          )}
        </div>
      )}

      {cropTargetId && (
        <ImageCropModal
          imageUrl={(() => {
            const ov = draftOverlays.find(o => o.id === cropTargetId);
            const w = ov?.widget || ov;
            const p = typeof w?.dataPayload === 'string' ? JSON.parse(w.dataPayload || '{}') : (w?.dataPayload || {});
            return p.url || '';
          })()}
          onClose={() => setCropTargetId(null)}
          onCropApply={(croppedImageUrl, cropW, cropH, naturalW, naturalH) => {
            const ov = draftOverlays.find(o => o.id === cropTargetId);
            if (!ov) return;
            const w = ov.widget || ov;
            const p = typeof w.dataPayload === 'string' ? JSON.parse(w.dataPayload || '{}') : (w.dataPayload || {});
            
            const oldW = p.width || 20;
            const oldH = p.height || 20;
            const percentW = cropW / naturalW;
            const percentH = cropH / naturalH;
            
            const newW = oldW * percentW;
            const newH = oldH * percentH;
            
            updateDraftPayload(cropTargetId, { url: croppedImageUrl, width: newW, height: newH });
            setCropTargetId(null);
          }}
        />
      )}

      {/* Save & Push Options Modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--sidebar-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Save & Push Options</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>How would you like to apply these changes?</p>
              </div>
              <button onClick={() => setShowSaveModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Trash2 size={16} style={{ display: 'none' }} /> {/* placeholder */}
                X
              </button>
            </div>
            
            <button 
              onClick={() => handleSaveSelection('draft')}
              style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Check size={16} /> Save as Draft
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Save changes without sending them to the TVs yet.</div>
            </button>

            <button 
              onClick={() => handleSaveSelection('now')}
              style={{ background: 'var(--brand-secondary, #10b981)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MonitorPlay size={16} /> Push to TVs
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal' }}>Instantly force-reload TVs to show these updates.</div>
            </button>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Schedule Push</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically push to TVs at a specific date and time.</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="date" 
                  value={scheduleDate} 
                  onChange={e => setScheduleDate(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={e => setScheduleTime(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <button 
                onClick={() => handleSaveSelection('schedule')}
                style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}
              >
                Schedule Update
              </button>
            </div>
          </div>
        </div>
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
    </>
  );
}
