"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Wifi, MonitorPlay, CloudRain, X, Move, Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle, CheckCircle2, AlertTriangle, Moon } from "lucide-react";
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Preferences } from '@capacitor/preferences';

import { renderWidgetContent } from "../../../components/WidgetRenderer";
import { SettingsOverlay } from "../../../components/SettingsOverlay";

function DraggableWidget({ id, initialPos, children }: { id: string, initialPos: any, children: React.ReactNode }) {
  const [pos, setPos] = useState({
    top: initialPos.top || '50%',
    left: initialPos.left || '50%',
    width: initialPos.width || '250px',
    height: initialPos.height || '150px',
    transform: initialPos.transform || 'translate(-50%, -50%)'
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    setPos({
      top: initialPos.top || '50%',
      left: initialPos.left || '50%',
      width: initialPos.width || 'auto',
      height: initialPos.height || 'auto',
      transform: initialPos.transform || 'translate(-50%, -50%)'
    });
  }, [initialPos]);

  // Handle Dragging via handle
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    const el = (e.currentTarget as HTMLElement).parentElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      posStart.current = { ...posStart.current, top: rect.top + rect.height / 2, left: rect.left + rect.width / 2 };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newLeft = posStart.current.left + dx;
    const newTop = posStart.current.top + dy;
    setPos(p => ({ 
      ...p,
      top: `${(newTop / window.innerHeight) * 100}%`, 
      left: `${(newLeft / window.innerWidth) * 100}%`
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newLeft = posStart.current.left + dx;
    const newTop = posStart.current.top + dy;
    const xPct = (newLeft / window.innerWidth) * 100;
    const yPct = (newTop / window.innerHeight) * 100;

    window.parent.postMessage({ type: 'WIDGET_MOVED', widgetId: id, x: xPct, y: yPct }, '*');
  };

  // Handle Resizing
  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    const el = (e.currentTarget as HTMLElement).parentElement;
    if (el) {
       const rect = el.getBoundingClientRect();
       posStart.current = { ...posStart.current, width: rect.width, height: rect.height };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newWidth = Math.max(50, posStart.current.width + dx);
    const newHeight = Math.max(50, posStart.current.height + dy);
    
    const wPct = (newWidth / window.innerWidth) * 100;
    const hPct = (newHeight / window.innerHeight) * 100;
    
    setPos(p => ({
      ...p,
      width: `${wPct}%`,
      height: `${hPct}%`
    }));
  };

  const handleResizeUp = (e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newWidth = Math.max(50, posStart.current.width + dx);
    const newHeight = Math.max(50, posStart.current.height + dy);
    
    const wPct = (newWidth / window.innerWidth) * 100;
    const hPct = (newHeight / window.innerHeight) * 100;

    window.parent.postMessage({ type: 'WIDGET_RESIZED', widgetId: id, width: wPct, height: hPct }, '*');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.parent.postMessage({ type: 'WIDGET_DELETED', widgetId: id }, '*');
  };

  return (
    <div 
      className="widget-draggable-container"
      style={{ 
        position: 'absolute', 
        ...pos, 
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        transition: isDragging || isResizing ? 'none' : 'border-color 0.2s ease',
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
        {children}
      </div>
      
      {/* Move Handle */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Move Widget"
        style={{ 
          position: 'absolute', top: '-14px', left: '-14px', width: '28px', height: '28px', 
          background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '50%', 
          color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: isDragging ? 'grabbing' : 'grab', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', touchAction: 'none',
          zIndex: 10
        }}
      >
        <Move size={14} strokeWidth={2.5} />
      </div>

      {/* Delete Button */}
      <div 
        onClick={handleDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title="Delete Widget"
        style={{ 
          position: 'absolute', top: '-14px', right: '-14px', width: '28px', height: '28px', 
          background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '50%', 
          color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          zIndex: 10
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </div>

      {/* Resize Handle */}
      <div 
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        title="Resize Widget"
        style={{ 
          position: 'absolute', bottom: '-8px', right: '-8px', width: '16px', height: '16px', 
          background: 'var(--brand-primary)', border: '2px solid var(--background)', borderRadius: '50%', 
          cursor: 'nwse-resize', touchAction: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          zIndex: 10
        }}
      />
    </div>
  );
}

import { Suspense } from 'react';

let proofOfPlayQueue: { screenId: string, mediaId: string, duration: number }[] = [];

  // 4. Playback Engine Loop (extracted to ZonePlayer)
  const ZonePlayer = ({ playlist, isEditMode, screenId, style, overrideType, draftOverlays, getWidgetPositionStyles, renderWidgetContent }: { playlist: any, isEditMode: boolean, screenId: string, style?: any, overrideType?: string | null, draftOverlays?: any[] | null, getWidgetPositionStyles: any, renderWidgetContent: any }) => {
    const [currentIndexRaw, setCurrentIndexRaw] = useState(0);
    const [prevIndex, setPrevIndex] = useState<number | null>(null);

    const setCurrentIndex = useCallback((updater: React.SetStateAction<number>) => {
      setCurrentIndexRaw(prev => {
        const nextIdx = typeof updater === 'function' ? updater(prev) : updater;
        if (nextIdx !== prev) {
          setPrevIndex(prev);
          setTimeout(() => setPrevIndex(null), 1000);
        }
        return nextIdx;
      });
    }, []);
    
    // Automatically reset to the beginning when a NEW playlist is applied seamlessly
    useEffect(() => {
      setCurrentIndexRaw(0);
      setPrevIndex(null);
    }, [playlist]);

    // Filter active items based on activeFrom / activeUntil and media auto-expiration
    const activeItems = useMemo(() => {
      if (!playlist?.items) return [];
      const nowTime = Date.now();
      const filtered = playlist.items.filter((item: any) => {
        if (item.activeFrom && new Date(item.activeFrom).getTime() > nowTime) return false;
        if (item.activeUntil && new Date(item.activeUntil).getTime() < nowTime) return false;
        if (item.media?.expiresAt && new Date(item.media.expiresAt).getTime() < nowTime) return false;
        if (item.expiresAt && new Date(item.expiresAt).getTime() < nowTime) return false;
        return true;
      });
      return filtered.length > 0 ? filtered : playlist.items; // Fallback to playlist items if all filtered
    }, [playlist]);
    
    const currentIndex = activeItems.length > 0 ? (currentIndexRaw % activeItems.length) : 0;
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number | null>(null);

    const goNext = useCallback(() => {
      if (!activeItems.length) return;
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }, [activeItems]);

    const goPrev = useCallback(() => {
      if (!activeItems.length) return;
      setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    }, [activeItems]);

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      
      if (Math.abs(diff) > 50) { // Swipe threshold
        if (diff > 0) goNext(); // Swipe left -> Next
        else goPrev(); // Swipe right -> Prev
      }
      touchStartX.current = null;
    };

    useEffect(() => {
      if (isEditMode) return;
      if (overrideType) {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (videoRef.current) videoRef.current.pause();
        return;
      } else {
        if (videoRef.current) videoRef.current.play().catch(()=>{});
      }
      
      if (!activeItems || activeItems.length === 0) return;

      const currentItem = activeItems[currentIndex];
      if (timerRef.current) clearTimeout(timerRef.current);

      // Evaluate weather conditions for current slide if configured
      if (currentItem && currentItem.conditionPayload) {
        try {
          const condition = JSON.parse(currentItem.conditionPayload);
          if (condition.enabled) {
            const weather = (window as any).__vvsignage_weather;
            if (weather) {
              let conditionMatches = true;
              if (condition.type === 'temperature' && weather.temp !== undefined) {
                const cur = Number(weather.temp);
                const target = Number(condition.tempValue !== undefined ? condition.tempValue : 75);
                if (condition.tempOperator === 'gt' && cur <= target) conditionMatches = false;
                if (condition.tempOperator === 'lt' && cur >= target) conditionMatches = false;
              } else if (condition.type === 'condition' && weather.condition) {
                const curCond = String(weather.condition).toLowerCase();
                const targetCond = String(condition.weatherCondition || 'rain').toLowerCase();
                if (!curCond.includes(targetCond)) conditionMatches = false;
              }

              // If condition fails, advance immediately to next slide
              if (!conditionMatches && activeItems.length > 1) {
                setCurrentIndex((prev) => (prev + 1) % activeItems.length);
                return;
              }
            }
          }
        } catch (e) {}
      }

      const reportProofOfPlay = (durationInSeconds: number) => {
        if (!screenId || !currentItem.id) return;
        proofOfPlayQueue.push({ screenId, mediaId: currentItem.id, duration: durationInSeconds });
      };

      if (currentItem.type === 'image' || currentItem.type === 'web' || currentItem.type === 'widget' || currentItem.type === 'creative') {
        const durationSecs = currentItem.duration || 10;
        const durationMs = durationSecs * 1000;
        timerRef.current = setTimeout(() => {
          reportProofOfPlay(durationSecs);
          setCurrentIndex((prev) => (prev + 1) % activeItems.length);
        }, durationMs);
      }
      
      if (currentItem.type === 'video') {
         if (currentItem.duration) {
            const durationSecs = currentItem.duration;
            const durationMs = durationSecs * 1000;
            timerRef.current = setTimeout(() => {
              reportProofOfPlay(durationSecs);
              setCurrentIndex((prev) => (prev + 1) % activeItems.length);
            }, durationMs);
         }
      }

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [activeItems, currentIndex, overrideType, isEditMode, screenId]);

    const handleVideoEnded = () => {
      if (!activeItems || activeItems.length === 0) return;
      const currentItem = activeItems[currentIndex];
      
      if (screenId && currentItem.id) {
        let playedDuration = currentItem.duration || 0;
        if (!playedDuration && videoRef.current) {
          playedDuration = Math.round(videoRef.current.currentTime);
        }
        proofOfPlayQueue.push({ screenId, mediaId: currentItem.id, duration: playedDuration });
      }

      if (!currentItem.duration) {
        setCurrentIndex((prev) => (prev + 1) % activeItems.length);
      }
    };

    if (!activeItems || activeItems.length === 0) {
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <MonitorPlay size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px' }}>Empty Zone</div>
          </div>
        </div>
      );
    }

    const currentItem = activeItems[currentIndex];
    const transitionType = currentItem?.transition || playlist.transition || 'none';
    let animationStyle = 'none';
    if (transitionType === 'fade') animationStyle = 'fadeIn 1s ease-in-out';
    else if (transitionType === 'slide-left') animationStyle = 'slideInLeft 1s ease-in-out';
    else if (transitionType === 'slide-right') animationStyle = 'slideInRight 1s ease-in-out';
    else if (transitionType === 'slide-up') animationStyle = 'slideInUp 1s ease-in-out';
    else if (transitionType === 'slide-down') animationStyle = 'slideInDown 1s ease-in-out';
    else if (transitionType === 'zoom-in') animationStyle = 'zoomIn 1s ease-in-out';
    else if (transitionType === 'flip-in') animationStyle = 'flipIn 1s ease-in-out';
    else if (transitionType === 'blur-fade') animationStyle = 'blurFade 1s ease-in-out';

    const renderMediaItem = (item: any, idx: number, isPrev: boolean = false) => (
      <div 
        key={`${item?.id}-${idx}`}
        style={{ 
          ...style, 
          position: 'absolute', 
          overflow: 'hidden', 
          animation: isPrev ? 'none' : animationStyle,
          zIndex: isPrev ? 0 : 1
        }}
        onTouchStart={!isPrev ? handleTouchStart : undefined}
        onTouchEnd={!isPrev ? handleTouchEnd : undefined}
        onClick={!isPrev ? goNext : undefined}
      >
        {item?.type === 'image' && (
          <img src={item.url} alt="signage content" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
        )}
        
        {item?.type === 'video' && (
          <video 
            ref={!isPrev ? videoRef : undefined}
            src={item.url} 
            autoPlay 
            muted 
            playsInline
            crossOrigin="anonymous"
            onEnded={!isPrev ? handleVideoEnded : undefined}
            onError={!isPrev ? handleVideoEnded : undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {item?.type === 'web' && (() => {
          let finalUrl = item.url || '';
          if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
          }
          return <iframe src={finalUrl} style={{ width: '100%', height: '100%', border: 'none' }} />;
        })()}

        {item?.type === 'widget' && (
          <div style={{ width: '100%', height: '100%', backgroundColor: item.backgroundColor || 'var(--card-bg)', ...getWidgetPositionStyles('full-screen') }}>
            {renderWidgetContent(item)}
          </div>
        )}

        {item?.type === 'creative' && (() => {
          let payloadStr = item.url || '{}';
          let bgColor = 'transparent';
          try {
             const parsed = JSON.parse(payloadStr);
             if (parsed.background && parsed.background.color) bgColor = parsed.background.color;
          } catch(e) {}
          return (
            <div style={{ width: '100%', height: '100%', backgroundColor: bgColor, ...getWidgetPositionStyles('full-screen') }}>
              {renderWidgetContent({ id: item.id, type: 'canvas', dataPayload: payloadStr })}
            </div>
          );
        })()}

        {!isPrev && ((draftOverlays || playlist?.overlays) && (draftOverlays || playlist?.overlays).length > 0) && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: isEditMode ? 'auto' : 'none', zIndex: 9000 }}>
            {(draftOverlays || playlist?.overlays || []).map((overlay: any) => {
              const widgetPos = overlay.widget?.position || overlay.position || 'center';
              const widgetPayload = overlay.widget?.dataPayload || overlay.dataPayload;
              const initialPos = getWidgetPositionStyles(widgetPos, widgetPayload);
              const content = (
                <div 
                  style={{ 
                    position: isEditMode ? 'relative' : 'absolute', 
                    backgroundColor: overlay.widget?.backgroundColor || overlay.backgroundColor ? (overlay.widget?.backgroundColor || overlay.backgroundColor) : 'transparent',
                    width: '100%',
                    height: '100%',
                    ...(!isEditMode ? initialPos : {})
                  }}
                >
                  {renderWidgetContent(overlay)}
                </div>
              );

              return isEditMode ? (
                <DraggableWidget key={overlay.id} id={overlay.widgetId || overlay.id} initialPos={initialPos}>
                  {content}
                </DraggableWidget>
              ) : (
                <div key={overlay.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    );

    const prevItem = (prevIndex !== null && playlist?.items) ? playlist.items[prevIndex] : null;

    return (
      <>
        {prevItem && renderMediaItem(prevItem, prevIndex as number, true)}
        {renderMediaItem(currentItem, currentIndex, false)}
      </>
    );
  };

  // End of ZonePlayer extraction
  // End of ZonePlayer extraction
function PlayerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const urlId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const queryScreenId = searchParams.get('screenId');
  const previewPlaylistId = searchParams.get('previewPlaylistId');
  const isTestMode = searchParams.get('testMode') === 'true';

  useEffect(() => {
    // Only bind Escape to close the window if we are explicitly in test/preview mode
    if (!isTestMode && !previewPlaylistId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close(); // Close the popup window
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTestMode, previewPlaylistId]);
  
  const isEditMode = searchParams.get('editMode') === 'true';
  
  const [screenId, setScreenId] = useState<string | null>(urlId || queryScreenId);
  const [screenName, setScreenName] = useState<string | null>(null);
  const [isPaired, setIsPaired] = useState(!!(urlId || queryScreenId || previewPlaylistId));
  const [tvAccountId, setTvAccountId] = useState<string | null>(null);
  const [tvUsername, setTvUsername] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const keySequenceRef = useRef<{ key: string; time: number }[]>([]);
  const [playlist, setPlaylist] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTestOverlay, setShowTestOverlay] = useState(false);
  const [overrideType, setOverrideType] = useState<string | null>(null);
  const [overridePayload, setOverridePayload] = useState<any>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  const [rssData, setRssData] = useState<Record<string, any[]>>({});
  const [draftOverlays, setDraftOverlays] = useState<any[] | null>(null);

  const [screenConfig, setScreenConfig] = useState<any>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [weatherLocation, setWeatherLocation] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vvsignage_weather_location') || '';
      if (stored.toLowerCase().includes('miami')) {
        localStorage.removeItem('vvsignage_weather_location');
        return '';
      }
      return stored;
    }
    return '';
  });

  // Keep local weather constantly synced for weather-conditional slides
  useEffect(() => {
    const locToUse = weatherLocation || screenConfig?.location || '';
    if (!locToUse) return;

    const fetchLocalWeather = async () => {
      try {
        const res = await fetch(`/api/weather?location=${encodeURIComponent(locToUse)}`);
        if (res.ok) {
          const data = await res.json();
          let conditionStr = 'Clear';
          const c = data.code;
          if (c === 2 || c === 3 || c === 45 || c === 48) conditionStr = 'Clouds';
          else if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) conditionStr = 'Rain';
          else if ((c >= 71 && c <= 77) || (c >= 85 && c <= 86)) conditionStr = 'Snow';
          else if (c >= 95 && c <= 99) conditionStr = 'Thunderstorm';

          (window as any).__vvsignage_weather = {
            temp: data.temperature,
            condition: conditionStr,
            locationName: data.locationName,
            code: data.code
          };
        }
      } catch (e) {}
    };

    fetchLocalWeather();
    const interval = setInterval(fetchLocalWeather, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, [weatherLocation, screenConfig?.location]);

  // Evaluate Operating Hours and Alert from screenConfig
  useEffect(() => {
    if (!screenConfig) return;

    // Alert check
    if (screenConfig.alertActive && screenConfig.alertPayload) {
      try {
        const payload = JSON.parse(screenConfig.alertPayload);
        setActiveAlert(payload);
      } catch (e) {
        setActiveAlert(null);
      }
    } else {
      setActiveAlert(null);
    }

    // Operating Hours check
    if (screenConfig.operatingHoursActive && screenConfig.wakeTime && screenConfig.sleepTime) {
      const checkSleep = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMins = now.getMinutes();
        const currentTotal = currentHours * 60 + currentMins;

        const [wakeH, wakeM] = screenConfig.wakeTime.split(':').map(Number);
        const [sleepH, sleepM] = screenConfig.sleepTime.split(':').map(Number);
        const wakeTotal = (wakeH || 0) * 60 + (wakeM || 0);
        const sleepTotal = (sleepH || 0) * 60 + (sleepM || 0);

        let shouldSleep = false;
        if (wakeTotal < sleepTotal) {
          shouldSleep = currentTotal < wakeTotal || currentTotal >= sleepTotal;
        } else {
          shouldSleep = currentTotal >= sleepTotal && currentTotal < wakeTotal;
        }
        setIsSleeping(shouldSleep);
      };
      checkSleep();
      const interval = setInterval(checkSleep, 15000);
      return () => clearInterval(interval);
    } else {
      setIsSleeping(false);
    }
  }, [screenConfig]);

  // Unlink State
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [unlinkError, setUnlinkError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Flush proof of play queue every 60 seconds
  useEffect(() => {
    const flushQueue = async () => {
      if (proofOfPlayQueue.length === 0) return;
      const events = [...proofOfPlayQueue];
      proofOfPlayQueue = [];
      try {
        await fetch('/api/analytics/proof-of-play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        });
      } catch (e) {
        console.error("Failed to flush proof of play queue", e);
        // Put back in queue if failed
        proofOfPlayQueue = [...events, ...proofOfPlayQueue];
      }
    };
    const intervalId = setInterval(flushQueue, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Tell the Service Worker to warm its chunk cache whenever we're online
  // This ensures offline playback always has the latest JS chunks cached.
  useEffect(() => {
    const warmSWCache = () => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'WARM_CACHE' });
        }
      } catch(e) {}
    };
    // Warm on mount
    warmSWCache();
    // Re-warm whenever we come back online
    window.addEventListener('online', warmSWCache);
    return () => window.removeEventListener('online', warmSWCache);
  }, []);

  const [template, setTemplate] = useState<any>(null);
  const [interactivePlaylist, setInteractivePlaylist] = useState<any>(null);
  const [inactivityTimeout, setInactivityTimeout] = useState<number>(30);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    current: number;
    total: number;
    statusText: string;
    isDownloading: boolean;
  }>({
    percent: 0,
    current: 0,
    total: 0,
    statusText: 'Syncing playlist content...',
    isDownloading: false
  });
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStaggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInteraction = useCallback(() => {
    if (!interactivePlaylist) return; // Kiosk mode disabled

    // Switch to interactive mode if not already
    setIsInteractiveMode(true);

    // Reset inactivity timer
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      setIsInteractiveMode(false);
    }, inactivityTimeout * 1000);
  }, [interactivePlaylist, inactivityTimeout]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // Unified Back Button logic (Double back press to exit app, preserving screen pairing)
  const backPressCountRef = useRef(0);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const requestExit = useCallback(async () => {
    if (isTestMode || previewPlaylistId) {
      window.close();
      return;
    }

    backPressCountRef.current += 1;
    if (backPressCountRef.current === 1) {
      setShowExitWarning(true);
      setTimeout(() => {
        backPressCountRef.current = 0;
        setShowExitWarning(false);
      }, 3000);
    } else {
      try {
        const { App } = await import('@capacitor/app');
        App.exitApp();
      } catch (e) {
        console.error('Failed to exit app', e);
      }
    }
  }, [isTestMode, previewPlaylistId]);

  useEffect(() => {
    if (isEditMode) return;
    
    let backListener: any;
    const setupListeners = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backListener = await App.addListener('backButton', () => {
          requestExit();
        });
      } catch (e) {
        // Not capacitor
      }
    };
    setupListeners();

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check for D-pad circle combo: Up -> Right -> Down -> Left (within 2s)
      const validComboKeys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
      if (validComboKeys.includes(e.key)) {
        const now = Date.now();
        const seq = [...keySequenceRef.current, { key: e.key, time: now }]
          .filter(item => now - item.time < 2000);
        
        keySequenceRef.current = seq;

        if (seq.length >= 4) {
          const last4 = seq.slice(-4).map(i => i.key);
          if (
            last4[0] === 'ArrowUp' &&
            last4[1] === 'ArrowRight' &&
            last4[2] === 'ArrowDown' &&
            last4[3] === 'ArrowLeft'
          ) {
            e.preventDefault();
            setShowSettings(prev => !prev);
            keySequenceRef.current = [];
            return;
          }
        }
      }

      // Quick developer shortcut 'S'
      if (e.key === 's' || e.key === 'S') {
        setShowSettings(prev => !prev);
        return;
      }

      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack' || e.keyCode === 27 || e.keyCode === 10009) {
        if (showSettings) {
          e.preventDefault();
          setShowSettings(false);
          return;
        }

        e.preventDefault();
        requestExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (backListener) backListener.remove();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditMode, requestExit, showSettings]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_DRAFT_OVERLAYS') {
        setDraftOverlays(e.data.overlays);
        fetchDynamicWidgetData({ overlays: e.data.overlays });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDynamicWidgetData = async (pl: any) => {
    const allWidgets: any[] = [];
    if (pl.overlays) allWidgets.push(...pl.overlays);
    if (pl.items) pl.items.forEach((item: any) => { if (item.type === 'widget') allWidgets.push(item); });

    // Expand canvas widgets to include their internal elements
    const expandedWidgets: any[] = [];
    allWidgets.forEach(w => {
      expandedWidgets.push(w);
      const type = w.type || w.widgetType;
      const payload = w.dataPayload || {};
      let parsedPayload = payload;
      if (typeof payload === 'string') {
        try { parsedPayload = JSON.parse(payload); } catch(e){}
      }
      
      if (type === 'canvas' && parsedPayload.elements) {
        parsedPayload.elements.forEach((el: any) => {
          expandedWidgets.push({ id: el.id, type: el.type, dataPayload: el.payload });
        });
      }
    });

    expandedWidgets.forEach(async w => {
      const widgetId = w.widget?.id || w.id; // Handle overlays vs standalone items vs elements
      if (w.type === 'weather' || w.widgetType === 'weather') {
        try {
          const payload = w.dataPayload || {};
          const loc = payload.location || '';
          if (!loc && !payload.lat) return;
          const unit = payload.unit === 'c' ? 'c' : 'f';
          const query = payload.lat && payload.lon 
            ? `lat=${payload.lat}&lon=${payload.lon}&location=${encodeURIComponent(loc)}&unit=${unit}` 
            : `location=${encodeURIComponent(loc)}&unit=${unit}`;
          const res = await fetch(`/api/weather?${query}`);
          if (res.ok) {
            const data = await res.json();
            setWeatherData(prev => ({ ...prev, [widgetId]: data }));
            (window as any).__vvsignage_weather = { temp: data.temp, condition: data.condition || data.description };
          }
        } catch (e) { console.error("Weather fetch failed", e); }
      }
      if (w.type === 'rss' || w.widgetType === 'rss') {
        try {
          const url = w.dataPayload?.url;
          if (url) {
            const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.items) {
                setRssData(prev => ({ ...prev, [widgetId]: data.items }));
              }
            }
          }
        } catch (e) { console.error("RSS fetch failed", e); }
      }
    });
  };

  // 1. Boot up and register (or restore from localStorage)
  // NoviSign-style: ALWAYS start from cache first, network is secondary.
  useEffect(() => {
    // Global safety net: catch any uncaught JS errors and prevent Capacitor crash dialog
    const handleError = (e: ErrorEvent) => { e.preventDefault(); console.error('[GlobalError]', e.message); };
    const handleRejection = (e: PromiseRejectionEvent) => { e.preventDefault(); console.error('[UnhandledRejection]', e.reason); };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    const bootSequence = async () => {
      try {
        // STEP 1: If in preview mode, bypass all device registration and caching
        if (previewPlaylistId) {
          setIsPaired(true);
          setIsBooting(false);
          return;
        }

        // Setup persistent hardware Device ID via AndroidBridge or @capacitor/device
        let did = (typeof window !== 'undefined' && (window as any).AndroidBridge?.getDeviceId?.()) || null;
        if (did) {
          localStorage.setItem('vvsignage_device_id', did);
        } else {
          did = localStorage.getItem('vvsignage_device_id');
          if (!did) {
            try {
              const { Device } = await import('@capacitor/device');
              const info = await Device.getId();
              if (info && info.identifier) {
                did = info.identifier;
              }
            } catch(e) {}
            if (!did) {
              did = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            }
            localStorage.setItem('vvsignage_device_id', did);
          }
        }
        setDeviceId(did);

        const accId = localStorage.getItem('vvsignage_tv_account');
        const savedUser = localStorage.getItem('vvsignage_tv_username');
        const savedOrgName = localStorage.getItem('vvsignage_org_name');
        const savedScreenName = localStorage.getItem('vvsignage_screen_name');
        if (accId) setTvAccountId(accId);
        if (savedUser) setTvUsername(savedUser);
        if (savedOrgName) setCompanyName(savedOrgName);
        if (savedScreenName) setScreenName(savedScreenName);

        // Check if direct link is used (bypass auth for testing)
        if (urlId) {
          setScreenId(urlId);
          setIsPaired(true);
          localStorage.setItem('vvsignage_screen_id', urlId);
          setIsBooting(false);
          return;
        }

        // STEP 2: Immediately boot from cache (0ms delay — works fully offline)
        const savedScreenId = queryScreenId || localStorage.getItem('vvsignage_screen_id');
        if (savedScreenId) {
          setScreenId(savedScreenId);
          setIsPaired(true);

          // Load cached playlist immediately into state
          try {
            const rawCached = localStorage.getItem('vvsignage_cached_config');
            if (rawCached) {
              const parsed = JSON.parse(rawCached);
              if (parsed && typeof parsed === 'object') {
                setPlaylist(parsed.playlist || null);
                setTemplate(parsed.template || null);
                setInteractivePlaylist(parsed.interactivePlaylist || null);
                if (parsed.inactivityTimeout) setInactivityTimeout(parsed.inactivityTimeout);
              }
            }
          } catch (cacheErr) {
            console.error('Cache read error (non-fatal):', cacheErr);
          }

          setIsBooting(false);
          // Background network verification happens separately in the sync useEffect below
          return;
        }

        // No saved screen — show the not-configured screen
        setIsBooting(false);
      } catch (fatalErr) {
        console.error('Boot sequence error (non-fatal):', fatalErr);
        setIsBooting(false); // Always unblock the UI
      }
    };

    bootSequence();
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [urlId, queryScreenId]);

  // Auth and Screen UI has been moved to /tv

  // Background online-only sync: ping CMS and check for commands
  useEffect(() => {
    if (!tvAccountId || !deviceId || previewPlaylistId) return;
    const ping = async () => {
      try {
        const token = localStorage.getItem('vvsignage_tv_token');
        
        // Gather telemetry metrics safely
        let currentAppVersion = '1.0.0';
        try {
          if ((window as any).AndroidBridge?.getAppVersion) {
            currentAppVersion = (window as any).AndroidBridge.getAppVersion();
          } else {
            const { App } = await import('@capacitor/app');
            const info = await App.getInfo();
            if (info?.version) currentAppVersion = info.version;
          }
        } catch (e) {}

        let freeStorageMb: number | undefined;
        let totalStorageMb: number | undefined;
        try {
          if (navigator.storage && navigator.storage.estimate) {
            const est = await navigator.storage.estimate();
            if (est.quota) {
              totalStorageMb = Math.round(est.quota / (1024 * 1024));
              if (est.usage !== undefined) {
                freeStorageMb = Math.round((est.quota - est.usage) / (1024 * 1024));
              }
            }
          }
        } catch (e) {}

        let wifiSignalStrength: number | undefined;
        try {
          if ((window as any).AndroidBridge?.getWifiSignal) {
            wifiSignalStrength = (window as any).AndroidBridge.getWifiSignal();
          } else if ((navigator as any).connection) {
            const conn = (navigator as any).connection;
            if (conn.downlink) {
              wifiSignalStrength = Math.min(100, Math.round((conn.downlink / 10) * 100));
            }
          }
        } catch (e) {}

        let cpuUsage: number | undefined;
        try {
          if ((window as any).AndroidBridge?.getCpuUsage) {
            cpuUsage = (window as any).AndroidBridge.getCpuUsage();
          }
        } catch (e) {}

        let memoryAvailableMb: number | undefined;
        try {
          if ((window as any).performance?.memory?.jsHeapSizeLimit) {
            memoryAvailableMb = Math.round((window as any).performance.memory.jsHeapSizeLimit / (1024 * 1024));
          }
        } catch (e) {}

        const res = await fetch('/api/tv-ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ 
            accountId: tvAccountId, 
            deviceId, 
            currentScreenId: screenId,
            appVersion: currentAppVersion,
            cpuUsage,
            freeStorageMb,
            totalStorageMb,
            memoryAvailableMb,
            wifiSignalStrength
          })
        });
        if (!res.ok) return; // Silently skip - offline or server error
        const data = await res.json();
        if (data.command === 'FULL_LOGOUT') {
          // Remotely wipe company code, TV account, and screen
          localStorage.clear();
          try {
            if ('caches' in window) {
              caches.keys().then(names => {
                for (const name of names) caches.delete(name);
              });
            }
          } catch(e) {}
          window.location.replace('/tv');
          return;
        } else if (data.command === 'LOGOUT') {
          // Screen / TV Account logout only (preserves company code)
          localStorage.removeItem('vvsignage_screen_id');
          localStorage.removeItem('vvsignage_tv_account');
          localStorage.removeItem('vvsignage_tv_token');
          localStorage.removeItem('vvsignage_cached_config');
          window.location.replace('/tv');
          return;
        } else if (data.command === 'SYNC_SCREEN' && data.screenId) {
          setScreenId(data.screenId);
          setIsPaired(true);
          localStorage.setItem('vvsignage_screen_id', data.screenId);
        } else if (data.command === 'RELOAD') {
          setForceRefreshKey(k => k + 1);
        } else if (data.command === 'INSTALL_UPDATE' && data.updateUrl) {
          console.log('[OTA Update] Triggering update from:', data.updateUrl);
          try {
            if ((window as any).AndroidBridge?.installApk) {
              (window as any).AndroidBridge.installApk(data.updateUrl);
            } else {
              const a = document.createElement('a');
              a.href = data.updateUrl;
              a.download = 'tv-app.apk';
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } catch (otaErr) {
            console.error('[OTA Update] Failed to trigger APK install:', otaErr);
          }
        } else if (data.command === 'TAKE_SNAPSHOT') {
          try {
            let imgBase64 = (window as any).AndroidBridge?.captureScreenshot?.();
            if (!imgBase64) {
              const canvas = document.createElement('canvas');
              canvas.width = window.innerWidth || 1280;
              canvas.height = window.innerHeight || 720;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#020617';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const activeImg = document.querySelector('img') as HTMLImageElement;
                if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
                  try { ctx.drawImage(activeImg, 0, 0, canvas.width, canvas.height); } catch (e) {}
                }
                imgBase64 = canvas.toDataURL('image/jpeg', 0.7);
              }
            }

            if (imgBase64) {
              if (deviceId) {
                fetch(`/api/tv-devices/${deviceId}/snapshot`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageBase64: imgBase64, screenId })
                }).catch(() => {});
              }
              if (screenId) {
                fetch(`/api/screens/${screenId}/snapshot`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageBase64: imgBase64, deviceId })
                }).catch(() => {});
              }
            }
          } catch (e) {
            console.error('Snapshot capture failed:', e);
          }
        }
        if (data.screenConfig) {
          setScreenConfig(data.screenConfig);
        }
        if (data.autoStart !== undefined) {
          Preferences.set({ key: 'autoStart', value: String(data.autoStart) }).catch(e => {});
        }
      } catch (e) { /* Offline - ignore silently */ }
    };
    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, [tvAccountId, deviceId, screenId]);

  // Poll for pairing status (only when not yet paired and not offline)
  useEffect(() => {
    if (!screenId || isPaired) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('vvsignage_tv_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/screens/status?id=${screenId}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (data.paired) {
          setIsPaired(true);
          clearInterval(interval);
        }
      } catch (err) { /* Offline - ignore silently */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [screenId, isPaired]);

  // 3. Setup SSE and fetch config once paired
  useEffect(() => {
    if (!isPaired || (!screenId && !previewPlaylistId)) return;

    const fetchConfig = async () => {
      try {
        let config;
        
        if (previewPlaylistId) {
          const res = await fetch(`/api/playlists/${previewPlaylistId}`);
          if (!res.ok) throw new Error('Playlist fetch error');
          const playlistData = await res.json();
          
          // Format playlist to match config output
          const formatPlaylist = async (pl: any) => {
            if (!pl) return null;
            
            // Fetch allowed domains to mirror backend security in preview mode
            let allowedDomains: string[] = [];
            try {
              const settingsRes = await fetch('/api/settings');
              if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData.allowedWebDomains) {
                  allowedDomains = JSON.parse(settingsData.allowedWebDomains);
                }
              }
            } catch(e) {}
            
            const isUrlAllowed = (urlStr: string) => {
              if (allowedDomains.length === 0) return false;
              try {
                const url = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
                const hostname = new URL(url).hostname.toLowerCase();
                return allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
              } catch (e) {
                return false;
              }
            };
            
            return {
              name: pl.name,
              transition: pl.transition,
              overlays: pl.overlays?.map((o: any) => {
                let payload = o.widget?.dataPayload || o.dataPayload;
                if (typeof payload === 'string') {
                  try { payload = JSON.parse(payload); } catch(e){}
                }
                const wType = o.widget?.type || o.type;
                if ((wType === 'embed' || wType === 'webpage' || wType === 'canva') && payload?.url) {
                   if (!isUrlAllowed(payload.url)) return null;
                }
                return {
                  id: o.widget?.id || o.id,
                  type: wType,
                  position: o.widget?.position || o.position,
                  dataPayload: payload
                };
              }).filter(Boolean) || [],
              items: pl.items?.map((item: any) => {
                if (item.widget) {
                  let payload = item.widget.dataPayload;
                  if (typeof payload === 'string') {
                    try { payload = JSON.parse(payload); } catch(e){}
                  }
                  if ((item.widget.type === 'embed' || item.widget.type === 'webpage' || item.widget.type === 'canva') && payload?.url) {
                     if (!isUrlAllowed(payload.url)) return null;
                  }
                  return {
                    id: item.widget.id,
                    type: 'widget',
                    widgetType: item.widget.type,
                    position: item.widget.position,
                    backgroundColor: item.widget.backgroundColor,
                    dataPayload: payload,
                    duration: item.duration || 10,
                    transition: item.transition || null
                  };
                }
                if (item.media) {
                  if (item.media.type === 'web') {
                    if (!isUrlAllowed(item.media.url)) return null;
                  }
                  return {
                    id: item.media.id,
                    type: item.media.type,
                    url: item.media.url,
                    duration: item.duration || (item.media.type === 'image' || item.media.type === 'web' ? 10 : null),
                    transition: item.transition || null
                  };
                }
                return null;
              }).filter(Boolean) || []
            };
          };
          
          config = { playlist: await formatPlaylist(playlistData) };
        } else {
          const token = localStorage.getItem('vvsignage_tv_token');
          const headers: any = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const res = await fetch(`/api/screens/${screenId}/config?_t=${Date.now()}`, { 
            headers,
            cache: 'no-store' 
          });
          
          if (res.status === 404) {
            // The screen was deleted from the CMS!
            localStorage.removeItem('vvsignage_screen_id');
            window.location.reload();
            return;
          }
          
          if (!res.ok) {
            throw new Error('Network or Auth error');
          }
          
          const fetchedConfig = await res.json();

          // CRITICAL: Validate config before applying.
          // The Service Worker may return an empty {} fallback when offline.
          // An empty or structureless response must NEVER overwrite the working cached config.
          const isValidConfig = fetchedConfig && (
            fetchedConfig.screenName ||
            fetchedConfig.playlist ||
            fetchedConfig.template ||
            fetchedConfig.interactivePlaylist
          );

          if (!isValidConfig) {
            throw new Error('Received empty/invalid config (likely offline fallback). Using localStorage cache.');
          }

          config = fetchedConfig;
          // Only save a VALID config to localStorage cache
          localStorage.setItem('vvsignage_cached_config', JSON.stringify(config));
        }
        
        applyConfig(config);
      } catch (err) {
        console.error("Config fetch error, falling back to localStorage cache", err);
        const cached = localStorage.getItem('vvsignage_cached_config');
        if (cached) {
          try {
            const parsedCached = JSON.parse(cached);
            // Only apply cached config if it has actual content
            if (parsedCached && (parsedCached.playlist || parsedCached.template)) {
              applyConfig(parsedCached);
            }
          } catch (parseErr) {
            console.error("Failed to parse cached config", parseErr);
          }
        }
      }
    };

    const applyConfig = (config: any) => {
      if (!config) return;
      // Handle overrides
      setOverrideType(config.overrideType || null);
      setOverridePayload(config.overridePayload || null);

      const updateStateAndPrefetch = (c: any) => {
        // Collect media URLs (images and videos) for full offline pre-loading
        const mediaItems: { url: string; type: string }[] = [];
        if (c.playlist?.items) {
          c.playlist.items.forEach((item: any) => {
            if (item.url) mediaItems.push({ url: item.url, type: item.type });
          });
        }
        if (c.template?.zones) {
          c.template.zones.forEach((z: any) => {
            if (z.playlist?.items) {
              z.playlist.items.forEach((item: any) => {
                if (item.url) mediaItems.push({ url: item.url, type: item.type });
              });
            }
          });
        }

        // Cache config in localStorage for instant offline restore
        try {
          if (!previewPlaylistId) {
            localStorage.setItem('vvsignage_cached_config', JSON.stringify(c));
            
            // Sync autoStart setting to native layer (now handled via tv-ping for TvDevice)
            // Preferences.set({ key: 'autoStart', value: String(c.autoStart !== false) }).catch(e => {
            //   console.warn("Preferences set failed (likely running in standard browser)", e);
            // });
          }
        } catch(e) {}

        // Tell Service Worker to evict old media not in the current active list
        try {
          if (!previewPlaylistId && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'EVICT_OLD_MEDIA',
              activeUrls: mediaItems.map(m => m.url)
            });
          }
        } catch(e) {}

        const reportSyncComplete = async () => {
          if (previewPlaylistId || !screenId) return;
          try {
            const token = localStorage.getItem('vvsignage_tv_token') || localStorage.getItem('vvsignage_token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const plId = c.playlist?.id || (c.template?.zones ? c.template.zones[0]?.playlist?.id : null);
            const plName = c.playlist?.name || (c.template?.zones ? c.template.zones[0]?.playlist?.name : null);

            if (plId) {
              await fetch(`/api/screens/${screenId}/sync-status`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  playlistId: plId,
                  playlistName: plName,
                  status: 'OFFLINE_READY',
                  mediaCount: mediaItems.length,
                  deviceId: deviceId
                })
              });
            }
          } catch (err) {
            // Non-fatal, e.g. offline
          }
        };

        const startPlayback = () => {
          // CRITICAL: Never clear a working playlist to null.
          // Only update playlist/template if the new config actually has content.
          if (c.playlist) setPlaylist(c.playlist);
          else if (c.template) setPlaylist(null); // template mode, clear playlist
          // else: keep existing playlist playing!

          if (c.template !== undefined) setTemplate(c.template || null);
          if (c.interactivePlaylist !== undefined) setInteractivePlaylist(c.interactivePlaylist || null);
          if (c.inactivityTimeout) setInactivityTimeout(c.inactivityTimeout);

          if (c.playlist) fetchDynamicWidgetData(c.playlist);
          if (c.interactivePlaylist) fetchDynamicWidgetData(c.interactivePlaylist);
          if (c.template && c.template.zones) {
            c.template.zones.forEach((z: any) => {
              if (z.playlist) fetchDynamicWidgetData(z.playlist);
            });
          }

          // Report sync completion to CMS
          reportSyncComplete();
        };

        if (mediaItems.length > 0 && (!playlist && !template)) {
          setDownloadProgress({
            percent: 5,
            current: 0,
            total: mediaItems.length,
            statusText: `Syncing media items (0/${mediaItems.length})...`,
            isDownloading: true
          });

          let loadedCount = 0;
          mediaItems.forEach(item => {
            const finish = () => {
              loadedCount++;
              const pct = Math.min(100, Math.round((loadedCount / mediaItems.length) * 95) + 5);
              setDownloadProgress({
                percent: pct,
                current: loadedCount,
                total: mediaItems.length,
                statusText: loadedCount >= mediaItems.length ? 'Playback starting...' : `Downloading content (${loadedCount}/${mediaItems.length})...`,
                isDownloading: loadedCount < mediaItems.length
              });

              if (loadedCount >= mediaItems.length) {
                // All items 100% downloaded & cached! Now launch playback!
                setTimeout(() => {
                  startPlayback();
                }, 300);
              }
            };

            if (item.type === 'video' || item.type === 'image') {
              if (previewPlaylistId && item.type === 'video') {
                // In preview mode, skip aggressive caching and just let the video tag stream it
                finish();
              } else {
                fetch(item.url, { mode: 'cors' })
                  .then(async (res) => {
                    if (!res.body) return;
                    // Consume the body stream chunk-by-chunk to wait for full download without blowing up RAM!
                    // The Service Worker simultaneously intercepts this and streams the file to disk cache.
                    const reader = res.body.getReader();
                    while (true) {
                      const { done } = await reader.read();
                      if (done) break;
                    }
                  })
                  .then(() => finish())
                  .catch(() => {
                    // Fallback to no-cors image prefetch if cors fails (e.g., non-Vercel external URLs)
                    if (item.type === 'image') {
                      const img = new Image();
                      img.onload = finish;
                      img.onerror = finish;
                      img.src = item.url;
                    } else {
                      finish();
                    }
                  });
              }
            } else {
              finish();
            }
          });
        } else {
          setDownloadProgress({
            percent: 100,
            current: 1,
            total: 1,
            statusText: 'Playback ready',
            isDownloading: false
          });
          startPlayback();
        }
      };

      // Only stagger background SSE re-syncs, NEVER stagger initial boot or manual pushes!
      const isInitialBoot = !playlist && !template;
      const isManualReload = forceRefreshKey > 0;
      
      // SCHEDULED PUSH PREVENTION:
      // If the backend has a future scheduledPushAt date, and we already have a working playlist,
      // we should ignore this config update until the scheduled time arrives.
      if (!isInitialBoot && !isManualReload) {
        if (config.playlist && config.playlist.scheduledPushAt) {
          const pushTime = new Date(config.playlist.scheduledPushAt).getTime();
          if (pushTime > Date.now()) {
            console.log("Scheduled push pending. Ignoring config update.");
            return; // Abort applying config
          }
        }
        if (config.template && config.template.zones) {
          let pendingSchedule = false;
          config.template.zones.forEach((z: any) => {
            if (z.playlist && z.playlist.scheduledPushAt) {
              if (new Date(z.playlist.scheduledPushAt).getTime() > Date.now()) {
                pendingSchedule = true;
              }
            }
          });
          if (pendingSchedule) {
            console.log("Scheduled push pending for a template zone. Ignoring config update.");
            return; // Abort applying config
          }
        }
      }

      if (config.networkThrottlingEnabled && config.staggerDelaySeconds > 0 && !isInitialBoot && !isManualReload) {
        if (pendingStaggerTimeoutRef.current) clearTimeout(pendingStaggerTimeoutRef.current);
        pendingStaggerTimeoutRef.current = setTimeout(() => {
          updateStateAndPrefetch(config);
        }, config.staggerDelaySeconds * 1000);
      } else {
        updateStateAndPrefetch(config);
      }
    };

    fetchConfig();
    const configInterval = setInterval(fetchConfig, 60000); // Poll every minute for schedule changes

    if (previewPlaylistId) return; // Disable SSE when previewing a playlist

    // Connect to SSE for real-time updates
    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource(`/api/screens/${screenId}/stream`);
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'UPDATE_CONFIG') {
              console.log("Received live commit update! Reloading playlist...");
              fetchConfig();
              setCurrentIndex(0); // Restart from beginning of new playlist
            } else if (data.type === 'TEST_CONNECTION') {
              setShowTestOverlay(true);
              setTimeout(() => setShowTestOverlay(false), 3000); // Hide after 3 seconds
            } else if (data.type === 'SYNC_STATE' && isEditMode) {
              if (data.currentIndex !== undefined) {
                setCurrentIndex(data.currentIndex);
              }
            }
          } catch (err) {
            console.error("Event parse error", err);
          }
        };

        eventSource.onerror = (err) => {
          // Gracefully suppress SSE connection errors when offline
        };
      }
    } catch (e) {
      console.log("SSE creation failed (offline)", e);
    }

    return () => {
      clearInterval(configInterval);
      if (eventSource) eventSource.close();
    };
  }, [isPaired, screenId, previewPlaylistId, forceRefreshKey]);

  // Auto-clear override based on duration
  useEffect(() => {
    if (overrideType && overridePayload?.duration && overridePayload.duration > 0 && screenId) {
      const durationMs = overridePayload.duration * 1000;
      const timer = setTimeout(async () => {
        // Clear locally for instant UI update
        setOverrideType(null);
        setOverridePayload(null);
        
        // Clear in DB with authorization header
        try {
          const token = localStorage.getItem('vvsignage_tv_token') || localStorage.getItem('vvsignage_token');
          const headers: any = { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };

          if (tvAccountId) {
            await fetch(`/api/tv-accounts/${tvAccountId}/override`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ type: null, payload: null })
            });
          }

          if (screenId) {
            await fetch(`/api/screens/${screenId}/override`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ type: null })
            });
          }
        } catch (e) {
          console.error('Failed to clear override in DB', e);
        }
      }, durationMs);

      return () => clearTimeout(timer);
    }
  }, [overrideType, overridePayload?.nonce, overridePayload?.duration, screenId, tvAccountId]);

  // Fast poll for overrides (to respond to tablet commands instantly)
  useEffect(() => {
    if (!isPaired || !screenId) return;

    const fetchOverride = async () => {
      try {
        const token = localStorage.getItem('vvsignage_tv_token');
        const res = await fetch(`/api/screens/${screenId}/override?_t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setOverrideType(data.overrideType || null);
          setOverridePayload(data.overridePayload || null);
        }
      } catch (e) {
        // ignore fast poll errors
      }
    };

    fetchOverride(); // Check immediately on mount
    const interval = setInterval(fetchOverride, 2000);
    return () => clearInterval(interval);
  }, [isPaired, screenId]);

  useEffect(() => {
    if ('serviceWorker' in navigator && !isEditMode && !previewPlaylistId) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered', reg))
        .catch((err) => console.error('Service Worker registration failed', err));
    }
  }, [isEditMode, previewPlaylistId]);

  if (isBooting) {
    return <div style={{ backgroundColor: '#000', width: '100vw', height: '100vh' }}></div>;
  }

  if (!isPaired) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#000', color: 'white', fontFamily: 'inherit' }}>
        <MonitorPlay size={80} style={{ color: 'var(--brand-primary)', marginBottom: '32px', opacity: 0.5 }} />
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#A0AEC0' }}>Device Not Configured</h1>
        <p style={{ fontSize: '20px', color: '#718096', marginBottom: '40px' }}>This device has not been assigned a screen.</p>
        
        <button 
          onClick={() => window.location.href = '/tv'}
          style={{
            background: 'var(--brand-primary)', color: 'white', fontSize: '24px', fontWeight: 'bold',
            border: 'none', borderRadius: '12px', padding: '16px 48px',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}
        >
          Go to TV Setup Portal
        </button>
      </div>
    );
  }

  // Override rendering moved to the bottom as an overlay so ZonePlayer doesn't unmount

  if (!playlist && !template) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
        backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center',
        color: '#f8fafc', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '460px', maxWidth: '90vw', background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)', padding: '40px 36px', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <MonitorPlay size={60} strokeWidth={1.5} style={{ color: '#38bdf8', marginBottom: '24px', filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.4))' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', letterSpacing: '-0.3px' }}>Syncing Display Content</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', textAlign: 'center' }}>
            {downloadProgress.statusText || 'Connected. Waiting for Layout or Playlist...'}
          </p>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${Math.max(5, downloadProgress.percent || 15)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
              borderRadius: '10px',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 12px rgba(56,189,248,0.6)'
            }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '12px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            <span>{downloadProgress.total ? `${downloadProgress.current} / ${downloadProgress.total} items` : 'Downloading...'}</span>
            <span>{downloadProgress.percent}%</span>
          </div>
        </div>
      </div>
    );
  }




  const renderWidgetContentBound = (widgetInfo: any) => {
    return renderWidgetContent(widgetInfo, weatherData, rssData, isEditMode);
  };

  const getWidgetPositionStyles = (position: string, dataPayload?: any) => {
    const defaultSize = { width: '250px', height: '150px' };
    
    if (position === 'custom' && dataPayload) {
      try {
        const parsed = typeof dataPayload === 'string' ? JSON.parse(dataPayload) : dataPayload;
        if (parsed.x !== undefined && parsed.y !== undefined) {
          const style: any = { top: `${parsed.y}%`, left: `${parsed.x}%`, transform: 'translate(-50%, -50%)' };
          const formatDim = (val: any, def: string) => {
            if (val === undefined || val === null) return def;
            if (typeof val === 'number') return `${val}%`;
            if (typeof val === 'string' && !val.endsWith('%') && !val.endsWith('px')) return `${val}%`;
            return val;
          };
          style.width = formatDim(parsed.width, defaultSize.width);
          style.height = formatDim(parsed.height, defaultSize.height);
          return style;
        }
      } catch (e) {
        // Fallback
      }
    }

    switch (position) {
      case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', ...defaultSize };
      case 'top-left': return { top: 0, left: 0, ...defaultSize };
      case 'top-right': return { top: 0, right: 0, ...defaultSize };
      case 'bottom-left': return { bottom: 0, left: 0, ...defaultSize };
      case 'bottom-right': return { bottom: 0, right: 0, ...defaultSize };
      case 'bottom-bar': return { bottom: 0, left: 0, width: '100vw', height: '60px' };
      case 'full-screen': return { top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' };
      default: return { top: 0, right: 0, ...defaultSize }; // default top-right
    }
  };



  return (
    <div 
      style={{ width: '100vw', height: '100vh', backgroundColor: 'black', overflow: 'hidden', position: 'relative' }}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onMouseMove={handleInteraction}
    >
      
      {isInteractiveMode && interactivePlaylist ? (
        // Render Interactive Kiosk Playlist Full-Screen
        <ZonePlayer 
          key={`interactive-zone`}
          playlist={interactivePlaylist}
          isEditMode={isEditMode}
          screenId={screenId!}
          overrideType={overrideType}
          style={{ left: 0, top: 0, width: '100%', height: '100%', zIndex: 1000 }}
          draftOverlays={draftOverlays}
          getWidgetPositionStyles={getWidgetPositionStyles}
          renderWidgetContent={renderWidgetContentBound}
        />
      ) : template ? (
        // Render Multiple Zones
        template.zones.map((z: any) => (
          <ZonePlayer 
            key={`${z.id}-zone`}
            playlist={z.playlist}
            isEditMode={isEditMode}
            screenId={screenId!}
            overrideType={overrideType}
            draftOverlays={null} // Draft overlays apply to the full screen, not individual zones (unless specified)
            style={{ 
              position: 'absolute',
              left: `${z.x}%`, 
              top: `${z.y}%`, 
              width: `${z.width}%`, 
              height: `${z.height}%`,
              zIndex: z.zIndex || 1
            }}
            getWidgetPositionStyles={getWidgetPositionStyles}
            renderWidgetContent={renderWidgetContentBound}
          />
        ))
      ) : (
        // Render Single Full-Screen Zone
        <ZonePlayer 
          key={`full-zone`}
          playlist={playlist}
          isEditMode={isEditMode}
          screenId={screenId!}
          overrideType={overrideType}
          draftOverlays={draftOverlays}
          style={{ left: 0, top: 0, width: '100%', height: '100%' }}
          getWidgetPositionStyles={getWidgetPositionStyles}
          renderWidgetContent={renderWidgetContentBound}
        />
      )}

      {/* Override Overlay */}
      {overrideType === 'html' && overridePayload && (
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, 
          display: 'flex', flexDirection: 'column', 
          backgroundColor: overridePayload.bgColor || overridePayload.htmlBgColor || '#1a1a1a', 
          color: overridePayload.color || overridePayload.htmlTextColor || 'white', 
          alignItems: 'center', justifyContent: 'center', 
          fontFamily: 'inherit', animation: 'fadeIn 0.5s ease-out', padding: '4vw', boxSizing: 'border-box', textAlign: 'center'
        }}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulseText {
              0% { opacity: 0.8; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
              100% { opacity: 0.8; transform: scale(1); }
            }
          `}} />
          {(overridePayload.imageUrl || overridePayload.mediaUrl || overridePayload.url) && (
            <div style={{ maxWidth: (overridePayload.title || overridePayload.htmlTitle) ? '65vw' : '90vw', maxHeight: (overridePayload.title || overridePayload.htmlTitle) ? '42vh' : '80vh', marginBottom: (overridePayload.title || overridePayload.htmlTitle) ? '2vh' : 0, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
              <img 
                src={overridePayload.imageUrl || overridePayload.mediaUrl || overridePayload.url} 
                alt="Announcement Attachment" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: (overridePayload.title || overridePayload.htmlTitle) ? '42vh' : '80vh', display: 'block' }} 
              />
            </div>
          )}
          {(overridePayload.title || overridePayload.htmlTitle) ? (
            <h1 style={{ fontSize: (overridePayload.imageUrl || overridePayload.mediaUrl || overridePayload.url) ? '6vw' : '9vw', margin: 0, fontWeight: '900', color: overridePayload.color || overridePayload.htmlTextColor || 'white', textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 10px 30px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
              {overridePayload.title || overridePayload.htmlTitle}
            </h1>
          ) : null}
          {(overridePayload.subtitle || overridePayload.htmlSubtitle) ? (
            <h2 style={{ fontSize: (overridePayload.imageUrl || overridePayload.mediaUrl || overridePayload.url) ? '2.8vw' : '4vw', margin: '2vh 0 0 0', fontWeight: '500', opacity: 0.95, animation: 'pulseText 2s infinite ease-in-out', lineHeight: 1.2 }}>
              {overridePayload.subtitle || overridePayload.htmlSubtitle}
            </h2>
          ) : null}
        </div>
      )}

      {overrideType === 'image' && overridePayload && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={overridePayload.url || overridePayload.mediaUrl || overridePayload.imageUrl} alt="Cast Photo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}

      {overrideType === 'video' && overridePayload && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, backgroundColor: 'black', overflow: 'hidden' }}>
          <video src={overridePayload.url || overridePayload.mediaUrl || overridePayload.videoUrl} autoPlay loop muted playsInline crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}

      {/* Test Connection Overlay */}
      {showTestOverlay && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34, 197, 94, 0.9)', color: 'white', zIndex: 9999, animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Wifi size={100} style={{ marginBottom: '20px' }} />
            <h1 style={{ fontSize: '40px', margin: 0 }}>Connection Successful</h1>
          </div>
        </div>
      )}

      {/* Emergency / Notice Broadcast Alert Banner */}
      {activeAlert && (
        <aside 
          aria-label="Emergency broadcast alert"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9997,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: activeAlert.severity === 'urgent' ? 'rgba(220, 38, 38, 0.95)' : activeAlert.severity === 'info' ? 'rgba(37, 99, 235, 0.95)' : 'rgba(217, 119, 6, 0.95)',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{activeAlert.title}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', opacity: 0.95 }}>{activeAlert.message}</p>
          </div>
        </aside>
      )}

      {/* Display Sleep Schedule / Power Saving Standby */}
      {isSleeping && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999, background: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          {screenConfig?.sleepMode === 'clock' && (
            <div style={{ textAlign: 'center', opacity: 0.35, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Moon size={44} />
              <h2 style={{ fontSize: '54px', margin: 0, fontWeight: '300', fontFamily: 'monospace', color: '#94a3b8' }}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h2>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Display Standby (Power Saver)</span>
            </div>
          )}
        </div>
      )}

      {/* Settings Diagnostic Overlay (▲ ▶ ▼ ◀ or 'S') */}
      <SettingsOverlay
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        deviceId={deviceId}
        tvAccountId={tvAccountId}
        tvUsername={tvUsername}
        companyName={companyName}
        screenId={screenId}
        screenName={screenName}
        location={weatherLocation || screenConfig?.location || ''}
        onUpdateLocation={(newLoc) => {
          setWeatherLocation(newLoc);
          localStorage.setItem('vvsignage_weather_location', newLoc);
        }}
        onLogout={() => {
          localStorage.removeItem('vvsignage_tv_account');
          localStorage.removeItem('vvsignage_screen_id');
          localStorage.removeItem('vvsignage_screen_name');
          localStorage.removeItem('vvsignage_tv_username');
          localStorage.removeItem('vvsignage_tv_token');
          localStorage.removeItem('vvsignage_cached_config');
          router.replace('/tv');
        }}
        onForceReload={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
export default function PlayerPage() { return ( <Suspense fallback={<div style={{ backgroundColor: '#000', width: '100vw', height: '100vh' }}></div>}> <PlayerContent /> </Suspense> ); }
