import React, { useState, useEffect, useMemo } from 'react';
import { FileDown, FileVideo, PlaySquare, Calendar, Monitor, Search, BarChart3, ChevronUp, ChevronDown, FileText, Download, ShieldCheck, Activity, QrCode, Smartphone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ReportsTab() {
  const [reportType, setReportType] = useState<'proof_of_play' | 'uptime' | 'audit' | 'qr_scans'>('proof_of_play');
  const [reports, setReports] = useState<any[]>([]);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [screenId, setScreenId] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'plays', direction: 'desc' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    fetchScreens();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const fetchScreens = async () => {
    try {
      const res = await fetch('/api/screens');
      if (res.ok) setScreens(await res.json());
    } catch (e) {}
  };

  const fetchReports = async () => {
    setLoading(true);
    setReports([]);
    try {
      if (reportType === 'audit') {
        const res = await fetch('/api/audit');
        const data = await res.json();
        const logs = Array.isArray(data?.logs) ? data.logs : (Array.isArray(data) ? data : []);
        setReports(logs);
      } else if (reportType === 'qr_scans') {
        const res = await fetch('/api/reports/qr-scans');
        const data = await res.json();
        setReports(Array.isArray(data?.summary) ? data.summary : []);
      } else {
        let url = `/api/reports?type=${reportType}&`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        if (screenId) url += `screenId=${screenId}`;

        const res = await fetch(url);
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
      setReports([]);
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

  const sortedReports = useMemo(() => {
    let items = [...reports];
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key] ?? '';
        let valB = b[sortConfig.key] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [reports, sortConfig]);

  const downloadCSV = () => {
    setShowDownloadMenu(false);
    if (sortedReports.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    const dateStr = new Date().toISOString().split('T')[0];

    if (reportType === 'proof_of_play') {
      csvContent += "Media Asset,Type,Screen,Total Plays,Total Seconds,Formatted Duration\n";
      sortedReports.forEach(r => {
        csvContent += `"${r.mediaName}",${r.mediaType},"${r.screenName}",${r.plays},${r.totalSeconds},"${r.formattedDuration}"\n`;
      });
    } else if (reportType === 'uptime') {
      csvContent += "Screen Name,Current Status,Last Seen At,Online Events,Offline Events,Uptime Percentage\n";
      sortedReports.forEach(r => {
        const localLastSeen = r.lastSeenAt && r.lastSeenAt !== 'Never' ? new Date(r.lastSeenAt).toLocaleString() : 'Never';
        csvContent += `"${r.screenName}",${r.currentStatus},"${localLastSeen}",${r.onlineEvents},${r.offlineEvents},"${r.uptimePercent}"\n`;
      });
    } else if (reportType === 'audit') {
      csvContent += "Timestamp,User,Action,Details\n";
      sortedReports.forEach(r => {
        csvContent += `"${new Date(r.createdAt).toLocaleString()}","${r.userName || 'System'}","${r.action}","${r.details || ''}"\n`;
      });
    } else if (reportType === 'qr_scans') {
      csvContent += "Campaign,QR Code,Destination,Total Scans,Unique Devices,Last Scanned\n";
      sortedReports.forEach(r => {
        csvContent += `"${r.campaign || 'Default'}","${r.code}","${r.destination}",${r.totalScans},${r.uniqueDevices},"${r.lastScan ? new Date(r.lastScan).toLocaleString() : 'Never'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SIGNAGE_${reportType}_report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    setShowDownloadMenu(false);
    if (sortedReports.length === 0) return;

    const doc = new jsPDF();
    const dateStr = new Date().toISOString().split('T')[0];

    doc.setFontSize(20);
    const titleMap: Record<string, string> = {
      proof_of_play: 'SIGNAGE Playback Report',
      uptime: 'SIGNAGE Screen Uptime Report',
      audit: 'SIGNAGE System Audit Log',
      qr_scans: 'SIGNAGE Dynamic QR Scan Analytics'
    };
    doc.text(titleMap[reportType] || 'SIGNAGE Report', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    let tableColumn: string[] = [];
    let tableRows: any[] = [];

    if (reportType === 'proof_of_play') {
      tableColumn = ["Media Asset", "Screen", "Total Plays", "Duration (D:H:M)"];
      tableRows = sortedReports.map(r => [r.mediaName, r.screenName, r.plays.toLocaleString(), r.formattedDuration]);
    } else if (reportType === 'uptime') {
      tableColumn = ["Screen", "Current Status", "Last Seen", "Uptime %"];
      tableRows = sortedReports.map(r => {
        const localLastSeen = r.lastSeenAt && r.lastSeenAt !== 'Never' ? new Date(r.lastSeenAt).toLocaleString() : 'Never';
        return [r.screenName, (r.currentStatus || 'offline').toUpperCase(), localLastSeen, r.uptimePercent];
      });
    } else if (reportType === 'audit') {
      tableColumn = ["Timestamp", "User", "Action", "Details"];
      tableRows = sortedReports.map(r => [new Date(r.createdAt).toLocaleString(), r.userName || 'System', r.action, r.details || '']);
    } else if (reportType === 'qr_scans') {
      tableColumn = ["Campaign", "QR Code", "Scans", "Unique Visitors", "Last Scan"];
      tableRows = sortedReports.map(r => [
        r.campaign || 'Default',
        r.code,
        (r.totalScans || 0).toLocaleString(),
        (r.uniqueDevices || 0).toLocaleString(),
        r.lastScan ? new Date(r.lastScan).toLocaleDateString() : 'Never'
      ]);
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 36,
      theme: 'grid',
      headStyles: { fillColor: [44, 76, 124] },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    doc.save(`SIGNAGE_${reportType}_report_${dateStr}.pdf`);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp size={14} style={{ opacity: 0.2 }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onClick={() => setShowDownloadMenu(false)}>
      {/* Top Header & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} style={{ color: 'var(--brand-primary)' }} /> Comprehensive System Reports
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
            Export proof-of-play analytics, screen uptime tracking, and audit log histories.
          </p>
        </div>

        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button className="btn-primary" onClick={() => setShowDownloadMenu(!showDownloadMenu)} disabled={reports.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export Report
          </button>
          
          {showDownloadMenu && (
            <div style={{ 
              position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
              background: 'var(--card-bg)', border: '1px solid var(--border)', 
              borderRadius: '10px', boxShadow: 'var(--shadow-lg)', zIndex: 50,
              minWidth: '160px', overflow: 'hidden'
            }}>
              <button 
                onClick={downloadCSV}
                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileText size={16} color="var(--brand-primary)" /> CSV Format
              </button>
              <button 
                onClick={downloadPDF}
                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileDown size={16} color="var(--brand-secondary)" /> PDF Document
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Report Type Selector Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <button
            onClick={() => { setReportType('proof_of_play'); setSortConfig({ key: 'plays', direction: 'desc' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: reportType === 'proof_of_play' ? 'var(--brand-primary)' : 'var(--card-bg)',
              color: reportType === 'proof_of_play' ? 'white' : 'var(--text-muted)'
            }}
          >
            <BarChart3 size={15} /> Proof of Play
          </button>
          <button
            onClick={() => { setReportType('uptime'); setSortConfig({ key: 'screenName', direction: 'asc' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: reportType === 'uptime' ? 'var(--brand-primary)' : 'var(--card-bg)',
              color: reportType === 'uptime' ? 'white' : 'var(--text-muted)'
            }}
          >
            <Activity size={15} /> Screen Uptime
          </button>
          <button
            onClick={() => { setReportType('audit'); setSortConfig({ key: 'createdAt', direction: 'desc' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: reportType === 'audit' ? 'var(--brand-primary)' : 'var(--card-bg)',
              color: reportType === 'audit' ? 'white' : 'var(--text-muted)'
            }}
          >
            <ShieldCheck size={15} /> Audit Log
          </button>
          <button
            onClick={() => { setReportType('qr_scans'); setSortConfig({ key: 'totalScans', direction: 'desc' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: reportType === 'qr_scans' ? 'var(--brand-primary)' : 'var(--card-bg)',
              color: reportType === 'qr_scans' ? 'white' : 'var(--text-muted)'
            }}
          >
            <QrCode size={15} /> QR Scan Analytics
          </button>
        </div>

        {/* Filter Toolbar */}
        {reportType !== 'audit' && reportType !== 'qr_scans' && (
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
                value={screenId}
                onChange={(e) => setScreenId(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: '13px', cursor: 'pointer' }}
              >
                <option value="">All Screens</option>
                {screens.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" onClick={fetchReports} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={16} /> Apply Filters
            </button>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Generating report data...
          </div>
        ) : sortedReports.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No records found for the selected report criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                  {reportType === 'proof_of_play' && (
                    <>
                      <th onClick={() => handleSort('mediaName')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Media Asset <SortIcon columnKey="mediaName" /></div>
                      </th>
                      <th onClick={() => handleSort('screenName')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Screen <SortIcon columnKey="screenName" /></div>
                      </th>
                      <th onClick={() => handleSort('plays')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Total Plays <SortIcon columnKey="plays" /></div>
                      </th>
                      <th onClick={() => handleSort('totalSeconds')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Duration (D:H:M) <SortIcon columnKey="totalSeconds" /></div>
                      </th>
                    </>
                  )}

                  {reportType === 'uptime' && (
                    <>
                      <th onClick={() => handleSort('screenName')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Screen <SortIcon columnKey="screenName" /></div>
                      </th>
                      <th onClick={() => handleSort('currentStatus')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Current Status <SortIcon columnKey="currentStatus" /></div>
                      </th>
                      <th onClick={() => handleSort('lastSeenAt')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Last Heartbeat <SortIcon columnKey="lastSeenAt" /></div>
                      </th>
                      <th onClick={() => handleSort('uptimePercent')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Uptime % <SortIcon columnKey="uptimePercent" /></div>
                      </th>
                    </>
                  )}

                  {reportType === 'audit' && (
                    <>
                      <th onClick={() => handleSort('createdAt')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Timestamp <SortIcon columnKey="createdAt" /></div>
                      </th>
                      <th onClick={() => handleSort('userName')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>User <SortIcon columnKey="userName" /></div>
                      </th>
                      <th onClick={() => handleSort('action')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Action <SortIcon columnKey="action" /></div>
                      </th>
                      <th onClick={() => handleSort('details')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Details <SortIcon columnKey="details" /></div>
                      </th>
                    </>
                  )}

                  {reportType === 'qr_scans' && (
                    <>
                      <th onClick={() => handleSort('campaign')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Campaign <SortIcon columnKey="campaign" /></div>
                      </th>
                      <th onClick={() => handleSort('code')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>QR Code / Target <SortIcon columnKey="code" /></div>
                      </th>
                      <th onClick={() => handleSort('totalScans')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Total Scans <SortIcon columnKey="totalScans" /></div>
                      </th>
                      <th onClick={() => handleSort('uniqueDevices')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Unique Visitors <SortIcon columnKey="uniqueDevices" /></div>
                      </th>
                      <th onClick={() => handleSort('lastScan')} style={{ padding: '12px 16px', color: 'var(--foreground)', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Last Scan <SortIcon columnKey="lastScan" /></div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: idx === sortedReports.length - 1 ? 'none' : '1px solid var(--border)', fontSize: '13px' }}>
                    {reportType === 'proof_of_play' && (
                      <>
                        <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}>
                          {row.mediaType === 'video' ? <FileVideo size={18} color="var(--brand-primary)" /> : <PlaySquare size={18} color="var(--brand-primary)" />}
                          {row.mediaName}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Monitor size={16} /> {row.screenName}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                          {(row.plays || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                          {row.formattedDuration}
                        </td>
                      </>
                    )}

                    {reportType === 'uptime' && (
                      <>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>{row.screenName}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', background: (row.currentStatus || 'offline') === 'online' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: (row.currentStatus || 'offline') === 'online' ? '#22c55e' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                            {(row.currentStatus || 'offline').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                          {row.lastSeenAt && row.lastSeenAt !== 'Never' ? new Date(row.lastSeenAt).toLocaleString() : 'Never'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{row.uptimePercent}</td>
                      </>
                    )}

                    {reportType === 'audit' && (
                      <>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(row.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>{row.userName || 'System'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(44, 76, 124, 0.08)', color: 'var(--brand-primary)', fontSize: '12px', fontWeight: '600' }}>
                            {row.action}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{row.details}</td>
                      </>
                    )}

                    {reportType === 'qr_scans' && (
                      <>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '12px', fontWeight: '700' }}>
                            {row.campaign || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--foreground)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600' }}>{row.code}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.destination}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                          {(row.totalScans || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                          {(row.uniqueDevices || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          {row.lastScan ? new Date(row.lastScan).toLocaleString() : 'Never'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
