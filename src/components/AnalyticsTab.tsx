import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, FileVideo, PlaySquare, Calendar, Monitor, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface AnalyticsTabProps {
  proofOfPlayStats?: any[];
}

export function AnalyticsTab({ proofOfPlayStats: initialStats }: AnalyticsTabProps) {
  const [stats, setStats] = useState<any[]>(initialStats || []);
  const [screens, setScreens] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'plays', direction: 'desc' });

  useEffect(() => {
    fetchScreens();
    fetchAnalytics();
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await fetch('/api/screens');
      if (res.ok) setScreens(await res.json());
    } catch (e) {}
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = '/api/reports?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (selectedScreenId) url += `screenId=${selectedScreenId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStats = useMemo(() => {
    let items = [...stats];
    items.sort((a, b) => {
      let valA = a[sortConfig.key] ?? '';
      let valB = b[sortConfig.key] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [stats, sortConfig]);

  const totalPlays = useMemo(() => stats.reduce((sum, item) => sum + (item.plays || 0), 0), [stats]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp size={14} style={{ opacity: 0.2 }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart size={24} style={{ color: 'var(--brand-primary)' }} /> Proof of Play Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
            Verify exactly how many times each ad or media asset has been displayed on your screens.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Filters bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: '13px' }} title="Start Date" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: '13px' }} title="End Date" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Monitor size={16} color="var(--text-muted)" />
            <select
              value={selectedScreenId}
              onChange={(e) => setSelectedScreenId(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="">All Screens</option>
              {screens.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={fetchAnalytics} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} /> Apply Filters
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading analytics data...
          </div>
        ) : sortedStats.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No analytics data found for the selected criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                  <th onClick={() => handleSort('mediaName')} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Media Asset <SortIcon columnKey="mediaName" /></div>
                  </th>
                  <th onClick={() => handleSort('mediaType')} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Type <SortIcon columnKey="mediaType" /></div>
                  </th>
                  <th onClick={() => handleSort('screenName')} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Screen <SortIcon columnKey="screenName" /></div>
                  </th>
                  <th onClick={() => handleSort('plays')} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Total Plays <SortIcon columnKey="plays" /></div>
                  </th>
                  <th onClick={() => handleSort('totalSeconds')} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Duration <SortIcon columnKey="totalSeconds" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((stat, idx) => (
                  <tr key={`${stat.mediaId}-${stat.screenId || idx}`} style={{ borderBottom: idx === sortedStats.length - 1 ? 'none' : '1px solid var(--border)', fontSize: '13px' }}>
                    <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}>
                      {stat.mediaType === 'video' ? <FileVideo size={18} color="var(--brand-primary)" /> : <PlaySquare size={18} color="var(--brand-primary)" />}
                      {stat.mediaName}
                    </td>
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                      {stat.mediaType}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {stat.screenName || 'All Screens'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                      {stat.plays ? stat.plays.toLocaleString() : 0}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--brand-primary)' }}>
                      {stat.formattedDuration || `${stat.totalSeconds || 0}s`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 'bold', fontSize: '14px' }}>
                  <td colSpan={3} style={{ padding: '14px 16px' }}>Total Plays Across Selection</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--brand-primary)' }}>{totalPlays.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
