import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LocationAutocomplete({ value, onChange, placeholder, className, style }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal state with external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const updatePosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 240)
      });
    }
  };

  useEffect(() => {
    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    const handleScrollOrResize = () => {
      if (isOpen) updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!query || query.length < 2 || query === value) {
        setResults([]);
        return;
      }

      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          if (data.results && data.results.length > 0) {
            updatePosition();
            setIsOpen(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch locations', e);
      }
    };

    const debounceTimer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, value]);

  const handleSelect = (loc: any) => {
    const formatted = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}${loc.country ? ', ' + loc.country : ''}`;
    setQuery(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      <input
        type="text"
        className={className}
        placeholder={placeholder || "Search city..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            updatePosition();
            setIsOpen(true);
          }
        }}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {mounted && isOpen && results.length > 0 && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, rgba(255,255,255,0.15))',
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 999999,
            maxHeight: '220px',
            overflowY: 'auto',
            color: 'var(--foreground, white)'
          }}
        >
          {results.map((loc) => (
            <div
              key={loc.id}
              onClick={() => handleSelect(loc)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg, rgba(255,255,255,0.1))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <MapPin size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{loc.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.6 }}>
                  {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
