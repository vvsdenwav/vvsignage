import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Monitor, ChevronLeft, ChevronRight, AlertTriangle, PlaySquare, Filter, RefreshCw, Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ScheduleCalendarTabProps {
  onSelectPlaylist?: (playlistId: string) => void;
}

const DAYS_OF_WEEK = [
  { key: 'schedule.mon', label: 'Mon' },
  { key: 'schedule.tue', label: 'Tue' },
  { key: 'schedule.wed', label: 'Wed' },
  { key: 'schedule.thu', label: 'Thu' },
  { key: 'schedule.fri', label: 'Fri' },
  { key: 'schedule.sat', label: 'Sat' },
  { key: 'schedule.sun', label: 'Sun' },
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ScheduleCalendarTab({ onSelectPlaylist }: ScheduleCalendarTabProps) {
  const { t } = useI18n();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // 0=Mon, 6=Sun
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        setScheduleData(await res.json());
      }
    } catch (e) {
      console.error('Failed to load schedule data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredScreens = scheduleData.filter(s =>
    s.screenName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Helper to compute time block offsets in percentage (0 to 100%)
  const getTimeOffset = (timeStr?: string | null) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return ((h * 60 + (m || 0)) / (24 * 60)) * 100;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={24} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{t('schedule.title', '24-Hour Visual Content Schedule Matrix')}</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0', fontSize: '14px' }}>
            {t('schedule.sub', 'Visual 24-hour campaign matrix across all screen displays. Inspect broadcast intervals and verify operating schedules.')}
          </p>
        </div>

        {/* Day of Week Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--background)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          {DAYS_OF_WEEK.map((day, idx) => (
            <button
              key={day.label}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: selectedDayIndex === idx ? 'var(--brand-primary)' : 'transparent',
                color: selectedDayIndex === idx ? 'white' : 'var(--text-muted)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t(day.key, day.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Workspace */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
        
        {/* Time Axis (00:00 to 23:00) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '12px', minWidth: '900px' }}>
          <div style={{ width: '220px', flexShrink: 0, fontWeight: 'bold', fontSize: '13px', color: 'var(--text-muted)' }}>
            SCREEN DISPLAY
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            {HOURS.map(h => (
              <div key={h} style={{ borderLeft: '1px dashed rgba(255,255,255,0.08)', padding: '2px 0' }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Screen Rows */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={24} className="animate-spin" />
            <span>Loading screen schedules...</span>
          </div>
        ) : filteredScreens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No screens found in this organization.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '900px' }}>
            {filteredScreens.map(scr => {
              const currentDayNum = String(selectedDayIndex + 1);
              const isAssigned = !!scr.playlist;
              const days = scr.playlist?.daysOfWeek ? scr.playlist.daysOfWeek.split(',') : ['1','2','3','4','5','6','7'];
              const isActiveToday = isAssigned && days.includes(currentDayNum);

              const startOffset = scr.playlist?.startTime ? getTimeOffset(scr.playlist.startTime) : 0;
              const endOffset = scr.playlist?.endTime ? getTimeOffset(scr.playlist.endTime) : 100;
              const widthPct = Math.max(5, endOffset - startOffset);

              const hasExpiringItems = scr.playlist?.items?.some((it: any) => {
                if (!it.activeUntil) return false;
                const diffDays = (new Date(it.activeUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 7;
              });

              return (
                <div
                  key={scr.screenId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    position: 'relative'
                  }}
                >
                  {/* Screen Info */}
                  <div style={{ width: '204px', flexShrink: 0, paddingRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: scr.status === 'online' ? '#10b981' : '#ef4444' }} />
                      <strong style={{ fontSize: '14px', color: 'var(--foreground)' }}>{scr.screenName}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {scr.operatingHoursActive ? `Sleep: ${scr.sleepTime || '22:00'} - ${scr.wakeTime || '07:00'}` : '24/7 Always On'}
                    </div>
                  </div>

                  {/* 24-Hour Timeline Bar */}
                  <div style={{ flex: 1, height: '42px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Hour grid lines */}
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', pointerEvents: 'none' }}>
                      {HOURS.map(h => (
                        <div key={h} style={{ borderLeft: '1px dashed rgba(255,255,255,0.05)', height: '100%' }} />
                      ))}
                    </div>

                    {/* Active Playlist Block */}
                    {isActiveToday && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${startOffset}%`,
                          width: `${widthPct}%`,
                          top: '4px',
                          bottom: '4px',
                          background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.85), rgba(2, 132, 199, 0.85))',
                          border: '1px solid rgba(56, 189, 248, 0.5)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 10px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                        title={`Playlist: ${scr.playlist.name} (${scr.playlist.startTime || '00:00'} - ${scr.playlist.endTime || '23:59'})`}
                        onClick={() => onSelectPlaylist && onSelectPlaylist(scr.playlist.id)}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          ▶ {scr.playlist.name} ({scr.playlist.itemsCount} slides)
                        </span>

                        {hasExpiringItems && (
                          <span style={{ background: 'rgba(234, 179, 8, 0.3)', color: '#fef08a', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={10} /> Expiring Soon
                          </span>
                        )}
                      </div>
                    )}

                    {!isActiveToday && isAssigned && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                        Playlist scheduled off on {t(DAYS_OF_WEEK[selectedDayIndex].key, DAYS_OF_WEEK[selectedDayIndex].label)}
                      </div>
                    )}

                    {!isAssigned && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.5 }}>
                        No playlist assigned
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
