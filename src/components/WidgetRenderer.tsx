"use client";

import React, { useState, useEffect } from "react";
import { Sun, Cloud, CloudSun, CloudSnow, CloudLightning, CloudDrizzle, CloudRain, Moon, Wind, Droplets, Eye } from "lucide-react";

/* ─── Live Clock (self-updating) ─── */
export function LiveClock({ payload }: { payload: any }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = payload.format || 'HH:mm:ss';
  const color = payload.color || 'white';
  const bg = payload.backgroundColor || 'transparent';
  const fontFamily = payload.fontFamily || 'inherit';
  const fontWeight = payload.fontWeight || 'bold';
  const textAlign = payload.textAlign || 'center';

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: fmt.includes('ss') ? '2-digit' : undefined,
    hour12: fmt.includes('A') || fmt.includes('a')
  });

  if (payload.fontSize) {
    return (
      <div style={{ 
        width: '100%', height: '100%', 
        display: 'flex', alignItems: 'center', 
        justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        color, backgroundColor: bg, fontFamily, fontWeight,
        fontSize: `${payload.fontSize}px`, padding: '8px', boxSizing: 'border-box', overflow: 'hidden'
      }}>
        <span style={{ lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{timeString}</span>
      </div>
    );
  }

  // Canva-style SVG Vector Auto-Scaling: Text automatically scales with box resize!
  const charCount = Math.max(5, timeString.length);
  const viewBoxWidth = charCount * 62;
  const viewBoxHeight = 100;
  const textAnchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';
  const textX = textAlign === 'left' ? '2%' : textAlign === 'right' ? '98%' : '50%';

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      backgroundColor: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      padding: '4px',
      overflow: 'hidden'
    }}>
      <svg 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet" 
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <text
          x={textX}
          y="52%"
          textAnchor={textAnchor}
          dominantBaseline="central"
          fill={color}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontSize="76"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
        >
          {timeString}
        </text>
      </svg>
    </div>
  );
}

/* ─── Live Countdown (self-updating) ─── */
export function LiveCountdown({ payload }: { payload: any }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const target = payload.targetDate ? new Date(payload.targetDate).getTime() : 0;
    if (!target) { setRemaining('Set a target date'); return; }
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining('00:00:00:00'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [payload.targetDate]);

  const color = payload.color || 'white';
  const bg = payload.backgroundColor || 'transparent';
  const fontFamily = payload.fontFamily || 'inherit';
  const fontWeight = payload.fontWeight || 'bold';
  const textAlign = payload.textAlign || 'center';

  if (payload.fontSize) {
    return (
      <div style={{ 
        width: '100%', height: '100%', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        color, backgroundColor: bg, fontFamily, 
        fontSize: `${payload.fontSize}px`, padding: '12px', boxSizing: 'border-box', overflow: 'hidden' 
      }}>
        {payload.label && <div style={{ fontSize: '0.5em', opacity: 0.8, marginBottom: '4px' }}>{payload.label}</div>}
        <div style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{remaining}</div>
      </div>
    );
  }

  const textStr = remaining || '00d 00:00:00';
  const charCount = Math.max(8, textStr.length);
  const viewBoxWidth = charCount * 60;
  const viewBoxHeight = payload.label ? 140 : 100;
  const textAnchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';
  const textX = textAlign === 'left' ? '2%' : textAlign === 'right' ? '98%' : '50%';

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      backgroundColor: bg, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      boxSizing: 'border-box', 
      padding: '4px', 
      overflow: 'hidden' 
    }}>
      <svg 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
        preserveAspectRatio="xMidYMid meet" 
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {payload.label && (
          <text 
            x={textX} 
            y="25%" 
            textAnchor={textAnchor} 
            dominantBaseline="central" 
            fill={color} 
            fontFamily={fontFamily} 
            fontSize="30" 
            opacity="0.85"
          >
            {payload.label}
          </text>
        )}
        <text 
          x={textX} 
          y={payload.label ? '72%' : '52%'} 
          textAnchor={textAnchor} 
          dominantBaseline="central" 
          fill={color} 
          fontFamily={fontFamily} 
          fontWeight={fontWeight} 
          fontSize="72" 
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
        >
          {textStr}
        </text>
      </svg>
    </div>
  );
}

/* ─── Live Weather (self-updating in edit mode & live player) ─── */
export function LiveWeather({ payload, widgetId, isEditMode, initialData }: any) {
  const [weather, setWeather] = useState(initialData);

  useEffect(() => {
    let isMounted = true;
    const targetLoc = payload.location || 'San Pedro, Belize';
    const unit = payload.unit || 'fahrenheit';

    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?location=${encodeURIComponent(targetLoc)}&unit=${unit}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && !data.error) {
            setWeather(data);
          }
        }
      } catch (e) {
        console.error("LiveWeather fetch failed", e);
      }
    };

    fetchWeather();
    // Refresh weather data every 5 minutes
    const interval = setInterval(fetchWeather, 300000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [payload.location, payload.unit]);

  const wData = weather || initialData || {};
  let code = wData?.code ?? 0;
  let temp = wData?.temperature;
  let unit = wData?.unit || (payload.unit === 'c' || payload.unit === 'celsius' ? 'C' : 'F');
  let humidity = wData?.humidity ?? '--';
  let windSpeed = wData?.windSpeed ?? '--';
  let isDay = wData?.isDay !== undefined ? wData.isDay : true;
  let locationName = wData?.locationName || payload.location || '';
  if (locationName.toLowerCase().includes('miami')) {
    locationName = '';
  }
  
  let visString = '--';
  if (wData?.visibility !== undefined && wData?.visibility !== null) {
    if (unit === 'F') {
      visString = `${Math.round(wData.visibility * 0.000621371)} mi`;
    } else {
      visString = `${Math.round(wData.visibility / 1000)} km`;
    }
  }
  
  // WMO Weather Interpretation Codes mapping
  let conditionText = 'Clear';
  let WeatherIcon = isDay ? Sun : Moon;

  if (code === 0) {
    conditionText = isDay ? 'Sunny' : 'Clear Sky';
    WeatherIcon = isDay ? Sun : Moon;
  } else if (code === 1) {
    conditionText = isDay ? 'Mainly Clear' : 'Mostly Clear';
    WeatherIcon = isDay ? Sun : Moon;
  } else if (code === 2) {
    conditionText = 'Partly Cloudy';
    WeatherIcon = isDay ? CloudSun : Cloud;
  } else if (code === 3) {
    conditionText = 'Overcast';
    WeatherIcon = Cloud;
  } else if (code >= 45 && code <= 48) {
    conditionText = 'Foggy';
    WeatherIcon = Cloud;
  } else if (code >= 51 && code <= 57) {
    conditionText = 'Light Drizzle';
    WeatherIcon = CloudDrizzle;
  } else if (code >= 61 && code <= 67) {
    conditionText = 'Rainy';
    WeatherIcon = CloudRain;
  } else if (code >= 71 && code <= 77) {
    conditionText = 'Snowfall';
    WeatherIcon = CloudSnow;
  } else if (code >= 80 && code <= 82) {
    conditionText = 'Rain Showers';
    WeatherIcon = CloudRain;
  } else if (code >= 85 && code <= 86) {
    conditionText = 'Snow Showers';
    WeatherIcon = CloudSnow;
  } else if (code >= 95) {
    conditionText = 'Thunderstorm';
    WeatherIcon = CloudLightning;
  }
  
  if (payload.mockCondition && payload.mockCondition !== 'auto') {
    const mockMap: any = { 'sunny': 0, 'cloudy': 3, 'rain': 61, 'snow': 71, 'thunderstorm': 95 };
    code = mockMap[payload.mockCondition];
  }

  let bg = payload.backgroundColor !== undefined ? payload.backgroundColor : 'rgba(13, 15, 22, 0.75)';
  let backdrop = payload.backgroundColor !== undefined && payload.backgroundColor !== 'transparent' ? 'none' : 'blur(20px)';
  let color = payload.color !== undefined ? payload.color : 'white';
  let border = '1px solid rgba(255,255,255,0.12)';
  let iconColor = payload.color !== undefined ? payload.color : '#F59E0B'; // Warm amber sun by default
  
  if (payload.theme === 'minimal') {
    if (payload.backgroundColor === undefined) bg = 'rgba(255, 255, 255, 0.95)';
    backdrop = 'none';
    if (payload.color === undefined) color = '#111827';
    border = '1px solid rgba(0,0,0,0.08)';
    if (payload.color === undefined) iconColor = '#2563EB';
  } else if (payload.theme === 'flat') {
    if (payload.backgroundColor === undefined) bg = '#2563EB';
    backdrop = 'none';
    if (payload.color === undefined) color = 'white';
    border = 'none';
    if (payload.color === undefined) iconColor = '#FDE047';
  }

  // Compact horizontal banner style theme
  if (payload.theme === 'compact') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        background: bg, color: color, fontFamily: payload.fontFamily || 'inherit',
        padding: '8px 20px', width: '100%', height: '100%', boxSizing: 'border-box',
        overflow: 'hidden', containerType: 'size'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <WeatherIcon size={32} color={iconColor} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'clamp(14px, 20cqh, 32px)', fontWeight: 'bold' }}>
          <div>{temp !== undefined ? `${temp}°${unit}` : `--°${unit}`}</div>
          <div style={{ fontSize: '0.8em', opacity: 0.85, fontWeight: 'normal' }}>{conditionText}</div>
        </div>
      </div>
    );
  }

  // Tropic Air layout theme
  if (payload.theme === 'tropic') {
    if (payload.backgroundColor === undefined) bg = 'rgba(255, 255, 255, 0.25)';
    if (payload.color === undefined) color = 'white';
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', 
        background: bg,
        backdropFilter: payload.backgroundColor === 'transparent' ? 'none' : 'blur(12px)', 
        WebkitBackdropFilter: payload.backgroundColor === 'transparent' ? 'none' : 'blur(12px)',
        color: color, 
        fontFamily: payload.fontFamily || 'inherit', 
        padding: '20px',
        width: '100%', height: '100%',
        justifyContent: 'center',
        boxSizing: 'border-box',
        containerType: 'size',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <WeatherIcon size={56} style={{ flexShrink: 0 }} color={iconColor} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 'clamp(24px, min(18cqw, 40cqh), 64px)', fontWeight: '900', lineHeight: 1 }}>{temp !== undefined ? `${temp}°${unit}` : `--°${unit}`}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'clamp(11px, min(8cqw, 16cqh), 22px)', fontWeight: '600', opacity: 0.95 }}>
          <div>Condition: <span style={{ fontWeight: 'bold' }}>{conditionText}</span></div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Humidity: {humidity}%</span>
            <span>Visibility: {visString}</span>
          </div>
        </div>
      </div>
    );
  }

  // Glass Dark / Modern Default layout theme
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: bg,
      backdropFilter: backdrop, WebkitBackdropFilter: backdrop,
      color: color, 
      fontFamily: payload.fontFamily || 'inherit', 
      padding: '16px', borderRadius: '20px',
      boxShadow: payload.theme === 'flat' ? 'none' : '0 10px 30px rgba(0,0,0,0.25)',
      width: '100%', height: '100%',
      border: border,
      boxSizing: 'border-box',
      containerType: 'size',
      overflow: 'hidden'
    }}>
      <WeatherIcon size={54} style={{ marginBottom: '8px', flexShrink: 0 }} color={iconColor} />
      <div style={{ fontSize: 'clamp(28px, min(22cqw, 40cqh), 80px)', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {temp !== undefined ? `${temp}°${unit}` : `--°${unit}`}
      </div>
      <div style={{ fontSize: 'clamp(13px, min(10cqw, 18cqh), 28px)', fontWeight: 'bold', marginTop: '4px', textAlign: 'center' }}>
        {conditionText}
      </div>

      {/* Weather Detail Badges (Humidity, Visibility, Wind) */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
        marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 'clamp(10px, min(6cqw, 12cqh), 16px)', width: '100%' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
          <Droplets size={14} color="#3B82F6" /> {humidity}%
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
          <Eye size={14} color="#10B981" /> {visString}
        </div>
        {windSpeed !== '--' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
            <Wind size={14} color="#A855F7" /> {windSpeed} {unit === 'F' ? 'mph' : 'km/h'}
          </div>
        )}
      </div>
    </div>
  );
}

export const renderWidgetContent = (
  widgetInfo: any, 
  weatherData: any = {}, 
  rssData: any = {}, 
  isEditMode: boolean = false
) => {
  const widget = widgetInfo.widget || widgetInfo;
  const type = widget.widgetType || widget.type;
  let payload: any = {};
  if (typeof widget.dataPayload === 'string') {
    try { payload = JSON.parse(widget.dataPayload || '{}'); } catch(e){}
  } else if (widget.dataPayload && typeof widget.dataPayload === 'object') {
    payload = widget.dataPayload;
  }
  
  if (type === 'canvas') {
    const { background, elements } = payload;
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: background?.color || 'transparent',
        backgroundImage: background?.image ? `url(${background.image})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        overflow: 'hidden'
      }}>
        {(elements || []).map((el: any) => {
          const elWidget = { id: el.id, type: el.type, dataPayload: el.payload };
          return (
            <div key={el.id} style={{
              position: 'absolute',
              left: `${(el.x / 1920) * 100}%`,
              top: `${(el.y / 1080) * 100}%`,
              width: `${(el.width / 1920) * 100}%`,
              height: `${(el.height / 1080) * 100}%`,
              zIndex: el.zIndex || 1
            }}>
              {renderWidgetContent(elWidget, weatherData, rssData, isEditMode)}
            </div>
          );
        })}
      </div>
    );
  }
  
  if (type === 'clock') {
    return <LiveClock payload={payload} />;
  }

  if (type === 'text') {
    const fontSize = payload.fontSize ? `${payload.fontSize}px` : '48px';
    const color = payload.color || 'white';
    const bg = payload.backgroundColor || 'transparent';
    const fontFamily = payload.fontFamily || 'inherit';
    const fontWeight = payload.fontWeight || 'normal';
    const textAlign = payload.textAlign || 'center';

    const justifyMap: any = {
      left: 'flex-start',
      right: 'flex-end',
      center: 'center'
    };

    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: justifyMap[textAlign] || 'center',
        color: color,
        backgroundColor: bg,
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontFamily: fontFamily,
        textAlign: textAlign as any,
        padding: '16px',
        boxSizing: 'border-box'
      }}>
        {payload.text || 'Text'}
      </div>
    );
  }

  if (type === 'weather') {
    return <LiveWeather payload={payload} widgetId={widget.id || widget.widgetId} isEditMode={isEditMode} initialData={weatherData[widget.id || widget.widgetId]} />;
  }

  if (type === 'shape') {
    const shapeType = payload.shapeType || 'rectangle';
    let borderRadius = '0px';
    if (shapeType === 'circle') borderRadius = '50%';
    if (shapeType === 'rounded') borderRadius = '16px';
    const textColor = payload.color || payload.textColor || 'white';
    const fontWeight = payload.fontWeight || 'bold';
    const fontFamily = payload.fontFamily || 'inherit';
    const textContent = payload.text || '';
    const bg = payload.gradient 
      ? `linear-gradient(135deg, ${payload.backgroundColor || 'var(--brand-primary)'}, ${payload.gradient})`
      : (payload.backgroundColor || 'var(--brand-primary)');
    
    if (payload.fontSize) {
      return (
        <div style={{ 
          width: '100%', height: '100%', background: bg, borderRadius,
          border: payload.border ? `4px solid ${payload.borderColor || 'white'}` : 'none',
          boxShadow: payload.shadow ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor,
          fontSize: `${payload.fontSize}px`, fontWeight, fontFamily, overflow: 'hidden'
        }}>
          {textContent}
        </div>
      );
    }

    const charCount = Math.max(1, textContent.length);
    const viewBoxWidth = Math.max(150, charCount * 55);
    return (
      <div style={{ 
        width: '100%', height: '100%', background: bg, borderRadius,
        border: payload.border ? `4px solid ${payload.borderColor || 'white'}` : 'none',
        boxShadow: payload.shadow ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor,
        overflow: 'hidden', padding: '8px', boxSizing: 'border-box'
      }}>
        {textContent ? (
          <svg viewBox={`0 0 ${viewBoxWidth} 100`} preserveAspectRatio="xMidYMid meet" style={{ width: '90%', height: '90%' }}>
            <text x="50%" y="52%" textAnchor="middle" dominantBaseline="central" fill={textColor} fontFamily={fontFamily} fontWeight={fontWeight} fontSize="68">
              {textContent}
            </text>
          </svg>
        ) : null}
      </div>
    );
  }

  if (type === 'youtube') {
    let videoId = '';
    if (payload.url) {
      const match = payload.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^"&?\/\s]{11})/);
      videoId = match ? match[1] : '';
    }
    return (
      <div style={{ width: '100%', height: '100%', background: 'black', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        {videoId ? (
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`} 
            title="YouTube player" 
            frameBorder="0" 
            style={{ pointerEvents: isEditMode ? 'none' : 'auto' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen>
          </iframe>
        ) : (
          <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'sans-serif' }}>Enter YouTube URL</div>
        )}
      </div>
    );
  }

  if (type === 'ticker') {
    const speed = payload.speed || 50;
    const duration = Math.max(5, 65 - (speed * 0.55));
    const bg = payload.backgroundColor !== undefined ? payload.backgroundColor : 'rgba(13, 15, 22, 0.9)';
    const color = payload.color || 'white';
    const fontSize = payload.fontSize ? `${payload.fontSize}px` : 'clamp(16px, 60cqh, 48px)';
    const fontFamily = payload.fontFamily || 'inherit';
    const fontWeight = payload.fontWeight || 'bold';
    const textContent = payload.text || 'Welcome to Tropic Air Signage • Real-time announcements • Have a safe flight!';
    
    return (
      <div style={{ 
        width: '100%', height: '100%', background: bg, color: color, padding: '0 16px', 
        overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', 
        boxSizing: 'border-box', position: 'relative', containerType: 'size'
      }}>
        <div style={{ 
          display: 'inline-block', 
          whiteSpace: 'nowrap',
          animation: `inner-ticker ${duration}s linear infinite`, 
          fontSize: fontSize, fontWeight: fontWeight, fontFamily: fontFamily,
          willChange: 'transform'
        }}>
          <span>{textContent} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; {textContent}</span>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes inner-ticker {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}} />
      </div>
    );
  }

  if (type === 'webpage' || type === 'embed' || type === 'canva') {
    const autoScroll = payload.autoScroll;
    const speed = payload.scrollSpeed || 20;
    let finalUrl = payload.url || '';
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    return (
      <div style={{ width: '100%', height: '100%', background: 'white', overflow: 'hidden', position: 'relative' }}>
        {finalUrl ? (
          <div style={{ 
            width: '100%', 
            height: autoScroll ? '300vh' : '100%', 
            animation: autoScroll ? `scroll-up ${Math.max(10, 100 - speed)}s linear infinite` : 'none' 
          }}>
            <iframe src={finalUrl} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: isEditMode ? 'none' : 'auto' }} />
          </div>
        ) : (
          <div style={{ color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'sans-serif' }}>No URL Configured</div>
        )}
        {autoScroll && (
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scroll-up {
              0% { transform: translateY(0); }
              100% { transform: translateY(-66%); }
            }
          `}} />
        )}
      </div>
    );
  }

  if (type === 'table') {
    let columns = payload.columns || ['Flight #', 'Destination', 'Time', 'Gate', 'Status'];
    let rows = payload.rows || [
      ['301', 'San Pedro', '09:15 AM', 'G1', 'Boarding'],
      ['302', 'Belize City', '09:45 AM', 'G2', 'On Time'],
      ['305', 'Caye Caulker', '10:30 AM', 'G1', 'Scheduled'],
      ['308', 'Placencia', '11:15 AM', 'G3', 'On Time']
    ];

    // If CSV data provided, parse it dynamically!
    if (payload.csvData && typeof payload.csvData === 'string') {
      const lines = payload.csvData.split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        columns = lines[0].split(',').map((c: string) => c.trim());
        rows = lines.slice(1).map((l: string) => l.split(',').map((c: string) => c.trim()));
      }
    }

    const fontSize = payload.fontSize ? `${payload.fontSize}px` : 'clamp(12px, 20cqh, 20px)';
    const fontFamily = payload.fontFamily || 'inherit';

    return (
      <div style={{ 
        width: '100%', height: '100%', 
        background: payload.backgroundColor || 'rgba(13, 15, 22, 0.85)', 
        backdropFilter: 'blur(12px)',
        padding: '16px', color: payload.textColor || payload.color || 'white', 
        fontSize: fontSize, fontFamily: fontFamily, overflow: 'auto',
        boxSizing: 'border-box', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
        containerType: 'size'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              {columns.map((col: string, i: number) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string[], i: number) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                {row.map((cell: string, j: number) => (
                  <td key={j} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {cell === 'Boarding' ? <span style={{ color: '#10B981', fontWeight: 'bold' }}>Boarding</span> :
                     cell === 'On Time' ? <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>On Time</span> :
                     cell === 'Delayed' ? <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Delayed</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'calendar') {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    // Accurately calculate starting day of week and total days in month!
    const startDayOfWeek = new Date(currentYear, now.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
    const blankCells = Array(startDayOfWeek).fill(null);
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const fontSize = payload.fontSize ? `${payload.fontSize}px` : 'clamp(11px, 14cqh, 18px)';
    const fontFamily = payload.fontFamily || 'inherit';

    return (
      <div style={{ 
        width: '100%', height: '100%', 
        background: payload.backgroundColor || 'rgba(13, 15, 22, 0.85)', 
        backdropFilter: 'blur(12px)',
        padding: '16px', color: payload.textColor || payload.color || 'white', 
        fontFamily: fontFamily, display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
        containerType: 'size', overflow: 'hidden'
      }}>
        <div style={{ fontSize: 'clamp(16px, 24cqh, 32px)', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center', color: 'var(--brand-primary, #3B82F6)' }}>
          {currentMonth} {currentYear}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', flex: 1, alignItems: 'center' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', opacity: 0.7, fontSize: '0.85em' }}>{d}</div>
          ))}
          {blankCells.map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {dayNumbers.map(d => {
            const isToday = d === now.getDate();
            return (
              <div key={d} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: isToday ? '#3B82F6' : 'rgba(255,255,255,0.06)', 
                color: isToday ? 'white' : 'inherit',
                borderRadius: '8px', fontSize: fontSize, fontWeight: isToday ? 'bold' : '500',
                aspectRatio: '1', boxShadow: isToday ? '0 0 12px rgba(59, 130, 246, 0.6)' : 'none'
              }}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'rss' || type === 'mrss') {
    const [rssDataState, setRssDataState] = useState<any[]>([]);

    useEffect(() => {
      let isMounted = true;
      const fetchRss = async () => {
        try {
          const feedUrl = payload.feedUrl || 'http://feeds.bbci.co.uk/news/rss.xml';
          const res = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.items) {
              setRssDataState(data.items);
            }
          }
        } catch(e) {
          console.error(e);
        }
      };
      fetchRss();
      const interval = setInterval(fetchRss, 180000);
      return () => { isMounted = false; clearInterval(interval); };
    }, [payload.feedUrl]);

    const items = rssDataState.length > 0 ? rssDataState : [
      { title: 'Tropic Air Expands Regional Flight Services Across Belize' },
      { title: 'Weather Forecast: Sunny skies expected throughout the weekend' },
      { title: 'Local Tourism Reaches New Record High This Season' }
    ];

    const bg = payload.backgroundColor || 'rgba(13, 15, 22, 0.9)';
    const color = payload.color || 'white';
    const fontSize = payload.fontSize ? `${payload.fontSize}px` : 'clamp(14px, 50cqh, 28px)';
    const fontFamily = payload.fontFamily || 'inherit';

    return (
      <div style={{ 
        width: '100%', height: '100%', background: bg, color: color, 
        padding: '0 16px', overflow: 'hidden', whiteSpace: 'nowrap', 
        display: 'flex', alignItems: 'center', boxSizing: 'border-box',
        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
        containerType: 'size', position: 'relative'
      }}>
        <div style={{ 
          display: 'inline-block', whiteSpace: 'nowrap',
          animation: 'rss-ticker 35s linear infinite', 
          fontSize: fontSize, fontFamily: fontFamily, fontWeight: payload.fontWeight || '600' 
        }}>
          {items.map((it: any) => it.title).join(' &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; ')}
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes rss-ticker {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}} />
      </div>
    );
  }

  if (['label', 'text'].includes(type)) {
    const textColor = payload.color || 'white';
    const bg = payload.backgroundColor || 'transparent';
    const fontWeight = payload.fontWeight || (type === 'label' ? 'bold' : 'normal');
    const fontFamily = payload.fontFamily || 'inherit';
    const textAlign = payload.textAlign || 'center';
    const textContent = payload.text || (isEditMode ? 'Click to edit…' : '');

    const justifyMap: any = {
      left: 'flex-start',
      right: 'flex-end',
      center: 'center'
    };

    if (payload.fontSize) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: justifyMap[textAlign] || 'center', 
          color: textColor, 
          backgroundColor: bg,
          fontFamily: fontFamily, 
          padding: '8px', 
          overflow: 'hidden',
          boxSizing: 'border-box' 
        }}>
          <div 
             contentEditable={isEditMode}
             suppressContentEditableWarning
             onBlur={(e) => {
               if (isEditMode && typeof window !== 'undefined') {
                  window.parent.postMessage({ type: 'WIDGET_TEXT_UPDATED', widgetId: widgetInfo.id || widgetInfo.widgetId, text: e.currentTarget.innerText }, '*');
               }
             }}
             style={{ 
               fontSize: `${payload.fontSize}px`, 
               fontWeight, 
               textAlign: textAlign as any, 
               outline: 'none', 
               cursor: isEditMode ? 'text' : 'inherit', 
               width: '100%', 
               textShadow: '0 2px 8px rgba(0,0,0,0.6)' 
             }}
          >
            {textContent}
          </div>
        </div>
      );
    }

    // Canva-style SVG vector scaling: Scales dynamically with bounding box drag!
    const charCount = Math.max(1, textContent.length);
    const viewBoxWidth = Math.max(150, charCount * 55);
    const viewBoxHeight = 100;
    const textAnchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';
    const textX = textAlign === 'left' ? '2%' : textAlign === 'right' ? '98%' : '50%';

    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: bg, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '4px', 
        boxSizing: 'border-box', 
        overflow: 'hidden' 
      }}>
        <svg 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
          preserveAspectRatio="xMidYMid meet" 
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <text
            x={textX}
            y="52%"
            textAnchor={textAnchor}
            dominantBaseline="central"
            fill={textColor}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontSize="68"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {textContent}
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'image' || type === 'webimage') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
         {payload.url ? (
           <img src={payload.url} draggable={false} style={{ width: '100%', height: '100%', objectFit: (payload.objectFit || 'contain') as any, pointerEvents: isEditMode ? 'none' : 'auto' }} alt="" />
         ) : (
           <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>No Image URL configured</div>
         )}
      </div>
    );
  }

  if (type === 'video' || type === 'streaming') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
         {payload.url ? (
           <video src={payload.url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: (payload.objectFit || 'cover') as any }} />
         ) : (
           <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>No Video URL configured</div>
         )}
      </div>
    );
  }

  if (type === 'countdown') {
    return <LiveCountdown payload={payload} />;
  }

  if (type === 'qrcode') {
    return <LiveQrCode payload={payload} />;
  }

  if (type === 'embed' || type === 'canva') {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        {payload.url ? (
          <iframe src={payload.url} style={{ width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No URL</div>
        )}
      </div>
    );
  }

  // Generic Fallback Placeholder
  return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minWidth: '150px', minHeight: '100px', background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontFamily: payload.fontFamily || 'inherit' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize' }}>{type} Widget</div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Placeholder</div>
      </div>
  );
};

/* ─── Live QR Code with Dynamic Tracking ─── */
export function LiveQrCode({ payload, screenId }: { payload: any; screenId?: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const destination = payload.destinationUrl || payload.url || 'https://www.tropicair.com';
  const label = payload.label || '';
  const fg = payload.foregroundColor || payload.color || '#ffffff';
  const bg = payload.backgroundColor || 'transparent';

  const shortCode = payload.code || (payload.name ? payload.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'qr_promo');
  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/go/${shortCode}${screenId ? `?s=${screenId}` : ''}&dest=${encodeURIComponent(destination)}&c=${encodeURIComponent(label || 'QR Campaign')}`
    : destination;

  useEffect(() => {
    let isMounted = true;
    import('qrcode').then((QRCodeModule) => {
      const QRCode = QRCodeModule.default || QRCodeModule;
      QRCode.toDataURL(trackingUrl, {
        color: {
          dark: fg.startsWith('#') ? fg : '#ffffff',
          light: bg === 'transparent' ? '#00000000' : (bg.startsWith('#') ? bg : '#00000000')
        },
        margin: 1,
        width: 300
      }).then(url => {
        if (isMounted) setDataUrl(url);
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    }).catch(e => console.error('Failed to load qrcode module:', e));

    return () => { isMounted = false; };
  }, [trackingUrl, fg, bg]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      boxSizing: 'border-box',
      backgroundColor: bg !== 'transparent' ? bg : undefined,
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {dataUrl ? (
        <img src={dataUrl} alt={label || 'QR Code'} style={{ maxWidth: '85%', maxHeight: label ? '75%' : '90%', objectFit: 'contain' }} />
      ) : (
        <div style={{ color: fg, fontSize: '13px', opacity: 0.7 }}>Loading QR...</div>
      )}
      {label && (
        <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: '600', color: fg, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%' }}>
          {label}
        </div>
      )}
    </div>
  );
}
