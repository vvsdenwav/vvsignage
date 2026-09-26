"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ShieldCheck, BarChart3, LayoutDashboard, MonitorPlay, Settings, FileVideo, ListVideo, Plus, UploadCloud, Trash2, Globe, ChevronLeft, ClipboardList, ChevronUp, ChevronDown, Wifi, TabletSmartphone, LogOut, LayoutTemplate, Users, CloudRain, Clock, Rss, Type, TextSelect, Image as ImageIcon, Film, Images, WholeWord, Hourglass, ListOrdered, Shapes, Server, Pointer, Code, Video, Radio, MessageSquare, Gamepad2, BarChart, Share2, Camera, MessageCircle, PlaySquare, X, Grid3X3, CalendarDays, Download, FileText, FileDown, QrCode, CalendarRange, CheckSquare, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { ScreenManagerTab } from "../components/ScreenManagerTab";
import { MediaLibraryTab } from "../components/MediaLibraryTab";
import dynamic from 'next/dynamic';
import { PlaylistManagerTab } from "../components/PlaylistManagerTab";
import { PlaylistEditor } from "../components/PlaylistEditor";
import { ScheduleCalendarTab } from "../components/ScheduleCalendarTab";
import { ApprovalsTab } from "../components/ApprovalsTab";
import { TemplateGalleryModal } from "../components/TemplateGalleryModal";
import { I18nProvider, useI18n } from "@/lib/i18n";
const VisualEditorModal = dynamic(() => import('../components/VisualEditorModal').then(mod => ({ default: mod.VisualEditorModal })));
const WidgetEditorModal = dynamic(() => import('../components/WidgetEditorModal').then(mod => ({ default: mod.WidgetEditorModal })));
const CreativeCanvasEditor = dynamic(() => import('../components/CreativeCanvasEditor').then(mod => ({ default: mod.CreativeCanvasEditor })));
import { SettingsTab } from "../components/SettingsTab";
import { AnalyticsTab } from "../components/AnalyticsTab";

import TvAccountsTab from "../components/TvAccountsTab";
import { ReportsTab } from "../components/ReportsTab";
import { MobileCommander } from "../components/mobile/MobileCommander";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StopImpersonatingButton from './super-admin/StopImpersonatingButton';
import UpgradePlanModal from '../components/UpgradePlanModal';

const WIDGET_TYPES = [
  { id: 'label', name: 'Label', icon: Type },
  { id: 'text', name: 'Text', icon: TextSelect },
  { id: 'image', name: 'Image', icon: ImageIcon },
  { id: 'video', name: 'Video', icon: Film },
  { id: 'slideshow', name: 'Slideshow', icon: Images },
  { id: 'ticker', name: 'Ticker', icon: WholeWord },
  { id: 'rss', name: 'RSS', icon: Rss },
  { id: 'mrss', name: 'MRSS', icon: Rss },
  { id: 'weather', name: 'Weather', icon: CloudRain },
  { id: 'clock', name: 'Clock', icon: Clock },
  { id: 'qrcode', name: 'QR Code', icon: QrCode },
  { id: 'countdown', name: 'Countdown', icon: Hourglass },
  { id: 'queue', name: 'Queue', icon: ListOrdered },
  { id: 'shape', name: 'Shape', icon: Shapes },
  { id: 'webpage', name: 'WebPage', icon: Globe },
  { id: 'webimage', name: 'WebImage', icon: ImageIcon },
  { id: 'table', name: 'Table', icon: Grid3X3 },
  { id: 'calendar', name: 'Calendar', icon: CalendarDays },
  { id: 'ftp', name: 'FTP Media', icon: Server },
  { id: 'touch', name: 'Touch', icon: Pointer },
  { id: 'embed', name: 'Embed', icon: Code },
  { id: 'canva', name: 'Canva/Slides', icon: LayoutTemplate },
  { id: 'youtube', name: 'YouTube', icon: PlaySquare },
  { id: 'ustream', name: 'Ustream', icon: Video },
  { id: 'streaming', name: 'Streaming', icon: Radio },
  { id: 'twitter', name: 'Twitter', icon: MessageCircle },
  { id: 'instagram', name: 'Instagram', icon: Camera },
  { id: 'facebook', name: 'Facebook', icon: Share2 },
  { id: 'yammer', name: 'Yammer', icon: MessageSquare },
  { id: 'game', name: 'Game', icon: Gamepad2 },
  { id: 'poll', name: 'Poll', icon: BarChart }
];

export default function Home() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [screens, setScreens] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [proofOfPlayStats, setProofOfPlayStats] = useState<any[]>([]);
  const [auditSortConfig, setAuditSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [showAuditDownloadMenu, setShowAuditDownloadMenu] = useState(false);

  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [editingWidget, setEditingWidget] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);


  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dashboard stats
  const [stats, setStats] = useState<any>({ totalScreens: 0, activeScreens: 0, totalPlaylists: 0, totalMedia: 0 });

  // Web Embed modal state
  const [showWebEmbedModal, setShowWebEmbedModal] = useState(false);
  const [webEmbedName, setWebEmbedName] = useState("");
  const [webEmbedUrl, setWebEmbedUrl] = useState("https://");

  // Screen pairing state
  const [showPairModal, setShowPairModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pairCode, setPairCode] = useState("");
  const [pairName, setPairName] = useState("");
  const [pairScreenId, setPairScreenId] = useState("");

  // Playlist creation state
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Widget creation state
  const [showCreateWidget, setShowCreateWidget] = useState(false);
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetType, setNewWidgetType] = useState("weather");
  const [newWidgetPosition, setNewWidgetPosition] = useState("bottom-right");
  const [newWidgetPayload, setNewWidgetPayload] = useState("{}");
  const [newWidgetBgColor, setNewWidgetBgColor] = useState("transparent");
  const [weatherSearchResults, setWeatherSearchResults] = useState<any[]>([]);
  const [editWeatherSearchResults, setEditWeatherSearchResults] = useState<any[]>([]);
  const [visualEditorScreenId, setVisualEditorScreenId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);

  // Playlist Editor Media Filter State
  const [playlistMediaFolder, setPlaylistMediaFolder] = useState<string>('all');
  const [playlistMediaSort, setPlaylistMediaSort] = useState<'date' | 'name'>('date');
  const [visualEditorRightTab, setVisualEditorRightTab] = useState<'overlays' | 'content' | 'properties'>('overlays');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  

  const stateRef = useRef({ screens, playlists, widgets, visualEditorScreenId });
  useEffect(() => {
    stateRef.current = { screens, playlists, widgets, visualEditorScreenId };
  }, [screens, playlists, widgets, visualEditorScreenId]);

  // User creation state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUserRole, setNewUserRole] = useState("AGENT");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);

  // High Value Feature States
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Mobile detection
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const isMobileMode = isMobileViewport;

  // Mobile Presence Polling on Desktop
  const [mobilePresence, setMobilePresence] = useState<{ activeSessions: any[]; count: number }>({ activeSessions: [], count: 0 });
  const [showMobilePresenceDropdown, setShowMobilePresenceDropdown] = useState(false);

  const fetchMobilePresence = async () => {
    try {
      const res = await fetch('/api/presence/mobile');
      if (res.ok) {
        const data = await res.json();
        setMobilePresence(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchMobilePresence();
    const interval = setInterval(fetchMobilePresence, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingApprovalsCount = async () => {
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        const pending = Array.isArray(data) ? data.filter((d: any) => d.status === 'PENDING').length : 0;
        setPendingApprovalsCount(pending);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchPendingApprovalsCount();
    fetchStats();
    fetchScreens();
    fetchMedia();
    fetchFolders();
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (activeTab === 'media' || activeTab === 'tv_accounts' || editingPlaylist) {
      if (mediaAssets.length === 0) fetchMedia();
      if (folders.length === 0) fetchFolders();
    } 
    if (activeTab === 'dashboard') {
      fetchStats();
    }
    if (activeTab === 'playlists') {
      if (playlists.length === 0) fetchPlaylists();
    }
    if (activeTab === 'screens') {
      if (screens.length === 0) fetchScreens();
      if (groups.length === 0) fetchGroups();
      if (playlists.length === 0) fetchPlaylists();
    }
    if (activeTab === 'audit' || activeTab === 'dashboard') {
      fetchAuditLogs();
    }
    if (activeTab === 'analytics') {
      fetchProofOfPlayStats();
    }
    if (activeTab === 'widgets' || editingPlaylist) {
      if (widgets.length === 0) fetchWidgets();
      if (mediaAssets.length === 0) fetchMedia();
    }
    if (activeTab === 'users') {
      if (users.length === 0) fetchUsers();
    }
  }, [activeTab, editingPlaylist]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/dashboard?t=${Date.now()}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch(`/api/media?t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setMediaAssets(data);
    } catch (e) {
      console.error("Failed to fetch media", e);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch(`/api/media/folders?t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setFolders(data);
    } catch (e) {
      console.error("Failed to fetch folders", e);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      if (Array.isArray(data)) setPlaylists(data);
    } catch (e) {
      console.error("Failed to fetch playlists", e);
    }
  };

  const fetchScreens = async () => {
    try {
      const res = await fetch('/api/screens');
      const data = await res.json();
      if (Array.isArray(data)) setScreens(data);
    } catch (e) {
      console.error("Failed to fetch screens", e);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (Array.isArray(data)) setGroups(data);
    } catch (e) {
      console.error("Failed to fetch groups", e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      if (data && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      } else if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    }
  };

  const fetchProofOfPlayStats = async () => {
    try {
      const res = await fetch('/api/analytics/proof-of-play');
      const data = await res.json();
      if (Array.isArray(data)) setProofOfPlayStats(data);
    } catch (e) {
      console.error("Failed to fetch proof of play stats", e);
    }
  };



  const fetchWidgets = async () => {
    try {
      const res = await fetch('/api/widgets');
      const data = await res.json();
      if (Array.isArray(data)) setWidgets(data);
    } catch (e) {
      console.error("Failed to fetch widgets", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users?t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const [isInitialized, setIsInitialized] = useState(false);

  const getFirstAllowedTab = (sessionObj: any) => {
    if (sessionObj?.user?.role === 'SUPER_ADMIN' || sessionObj?.user?.role === 'ADMIN') return 'dashboard';
    try {
      const perms = JSON.parse(sessionObj?.user?.permissions || '[]');
      if (perms.includes('dashboard')) return 'dashboard';
      if (perms.length > 0) {
        return perms[0].split(':')[0];
      }
    } catch (e) {}
    return 'dashboard';
  };

  useEffect(() => {
    if (status === "loading") return;

    const fallbackTab = getFirstAllowedTab(session);
    const saved = localStorage.getItem('SIGNAGE_admin_tab');
    if (saved) {
      // Validate access
      if ((session?.user as any)?.role === 'SUPER_ADMIN' || (session?.user as any)?.role === 'ADMIN') {
        setActiveTab(saved);
      } else {
        try {
          const perms = JSON.parse((session?.user as any)?.permissions || '[]');
          if (perms.includes(saved)) {
            setActiveTab(saved);
          } else {
            setActiveTab(fallbackTab);
          }
        } catch(e) {
          setActiveTab(fallbackTab);
        }
      }
    } else {
      setActiveTab(fallbackTab);
    }
    setIsInitialized(true);
  }, [session, status]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('SIGNAGE_admin_tab', activeTab);
    }
  }, [activeTab, isInitialized]);

  const hasInitPlaylist = useRef(false);

  useEffect(() => {
    if (playlists.length > 0 && !hasInitPlaylist.current) {
      hasInitPlaylist.current = true;
      const savedPlaylistId = localStorage.getItem('SIGNAGE_editing_playlist_id');
      if (savedPlaylistId) {
        const p = playlists.find(p => p.id === savedPlaylistId);
        if (p) setEditingPlaylist(p);
      }
    }
  }, [playlists]);

  useEffect(() => {
    if (editingPlaylist && playlists.length > 0) {
      const updated = playlists.find(p => p.id === editingPlaylist.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(editingPlaylist)) {
        setEditingPlaylist(updated);
      }
    }
  }, [playlists]);

  useEffect(() => {
    if (editingPlaylist) {
      localStorage.setItem('SIGNAGE_editing_playlist_id', editingPlaylist.id);
    } else {
      localStorage.removeItem('SIGNAGE_editing_playlist_id');
    }
  }, [editingPlaylist]);


  const handleCommit = async (silentParam: any = false) => {
    const silent = typeof silentParam === 'boolean' ? silentParam : false;
    try {
      const res = await fetch('/api/screens/commit', { method: 'POST' });
      if (res.ok && !silent) alert("Successfully committed updates to all screens!");
    } catch (e) {
      console.error(e);
    }
  };

  const formatActivityDetail = (log: any): string => {
    if (!log.details) return log.action || 'Updated system';
    try {
      if (typeof log.details === 'string' && log.details.trim().startsWith('{')) {
        const parsed = JSON.parse(log.details);
        if (parsed.message) return parsed.message;
        if (parsed.screenName) return `Screen "${parsed.screenName}" status: ${parsed.status || 'Updated'}`;
        if (parsed.title) return `Alert: ${parsed.title}`;
      }
    } catch (_) {}
    return log.details;
  };

  const handleCreateScreen = async () => {
    if (!pairName.trim() && !pairCode.trim()) return;
    try {
      const endpoint = pairCode ? '/api/screens/pair' : '/api/screens';
      const body = pairCode ? { name: pairName, code: pairCode } : { name: pairName };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        setPairScreenId(data.screen?.id || data.id);
        setShowPairModal(false);
        setPairName("");
        setPairCode("");
        fetchScreens();
        fetchStats();
      } else {
        const status = res.status;
        let errStr = "Creation failed";
        try {
          const err = await res.json();
          errStr = err.error || errStr;
        } catch (_) {}

        if (status === 403 || errStr.toLowerCase().includes('limit') || errStr.toLowerCase().includes('maximum')) {
          setShowPairModal(false);
          setShowUpgradeModal(true);
        } else {
          alert(errStr);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Error creating screen: " + e.message);
    }
  };

  const handleAssignPlaylist = async (screenId: string, playlistId: string) => {
    try {
      const res = await fetch(`/api/screens/${screenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlistId === "" ? null : playlistId })
      });
      if (res.ok) {
        fetchScreens();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteScreen = async (screenId: string) => {
    if (!confirm("Are you sure you want to delete this screen?")) return;
    try {
      const res = await fetch(`/api/screens/${screenId}`, { method: 'DELETE' });
      if (res.ok) fetchScreens();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateScreen = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/screens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchScreens();
      }
    } catch (e) {
      console.error('Failed to update screen', e);
    }
  };

  const handleUpdateWidgets = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/screens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchScreens();
      }
    } catch (err) {
      console.error("Failed to update widgets", err);
    }
  };
  const weatherSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const editWeatherSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleWeatherSearchInput = (query: string) => {
    setNewWidgetPayload(JSON.stringify({ location: query }, null, 2));
    if (weatherSearchTimeout.current) clearTimeout(weatherSearchTimeout.current);
    
    if (query.length < 3) {
      setWeatherSearchResults([]);
      return;
    }

    weatherSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
        const data = await res.json();
        setWeatherSearchResults(data);
      } catch (e) {
        console.error("Geocode error", e);
      }
    }, 500);
  };

  const handleEditWeatherSearchInput = (query: string, widgetId: string, currentPayload: any) => {
    // Note: widget state update is handled by VisualEditorModal's draft state
    if (editWeatherSearchTimeout.current) clearTimeout(editWeatherSearchTimeout.current);
    
    if (query.length < 3) {
      setEditWeatherSearchResults([]);
      return;
    }

    editWeatherSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
        const data = await res.json();
        setEditWeatherSearchResults(data);
      } catch (e) {
        console.error("Geocode error", e);
      }
    }, 500);
  };
  const handleTestConnection = async (screenId: string) => {
    try {
      await fetch(`/api/screens/${screenId}/test`, { method: 'POST' });
    } catch (e) {
      console.error("Test connection failed", e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });
      if (res.ok) fetchMedia();
    } catch (err) {
      console.error("Upload failed", err);
} finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleWebEmbed = async () => {
    if (!webEmbedName || !webEmbedUrl) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: webEmbedName, url: webEmbedUrl })
      });
      if (res.ok) {
        setShowWebEmbedModal(false);
        setWebEmbedName("");
        setWebEmbedUrl("https://");
        fetchMedia();
      }
    } catch (err) {
      console.error("Web embed failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media asset? It will be removed from all playlists.")) return;
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMedia();
        fetchFolders();
        fetchPlaylists(); // update playlists as items might have been deleted
      }
    } catch (e) {
      console.error("Delete media error", e);
    }
  };

  const handleUpdatePlaylist = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/playlists/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchPlaylists();
      }
    } catch (e) {
      console.error('Failed to update playlist', e);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName) {
      alert("Please enter a playlist name");
      return;
    }
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newPlaylistName
        })
      });
      if (res.ok) {
        setNewPlaylistName("");
        setShowCreatePlaylist(false);
        fetchPlaylists();
      } else {
        const errData = await res.json();
        alert('Failed to save playlist: ' + (errData.error || res.statusText));
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error when saving playlist: ' + err.message);
    }
  };

  const handleCreateWidget = async () => {
    if (!newWidgetName) return;
    try {
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWidgetName,
          type: newWidgetType,
          position: newWidgetPosition,
          dataPayload: newWidgetPayload,
          backgroundColor: newWidgetBgColor
        })
      });
      if (res.ok) {
        setNewWidgetName("");
        setNewWidgetType("weather");
        setNewWidgetPosition("bottom-right");
        setNewWidgetPayload("{}");
        setNewWidgetBgColor("transparent");
        setShowCreateWidget(false);
        fetchWidgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWidget = async (widgetId: string | null, updatedData: any) => {
    try {
      if (widgetId) {
        const res = await fetch(`/api/widgets/${widgetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (res.ok) {
          fetchWidgets();
          fetchPlaylists();
        }
      } else {
        const res = await fetch('/api/widgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (res.ok) {
          fetchWidgets();
        }
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleSaveCreative = async (creativeId: string | null, updatedData: any) => {
    try {
      if (creativeId) {
        const res = await fetch(`/api/media/${creativeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: updatedData.name, url: updatedData.dataPayload })
        });
        if (res.ok) {
          fetchMedia();
        }
      } else {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: updatedData.name, url: updatedData.dataPayload, type: 'creative', folderId: updatedData.folderId })
        });
        if (res.ok) {
          fetchMedia();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWidget = async (id: string) => {
    if (!confirm("Delete this widget?")) return;
    try {
      const res = await fetch(`/api/widgets/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWidgets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newUserPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newUserPassword,
          role: newUserRole,
          permissions: JSON.stringify(newUserPermissions)
        })
      });
      if (res.ok) {
        setNewUsername("");
        setNewUserPassword("");
        setNewUserRole("AGENT");
        setNewUserPermissions([]);
        setShowCreateUser(false);
        fetchUsers();
      } else {
        const err = await res.json();
        let errMsg = err.error || "Failed to create user";
        if (err.details) {
          const formatted = Object.entries(err.details).map(([key, val]: any) => {
            if (key === '_errors') return '';
            return `${key}: ${val._errors?.join(', ')}`;
          }).filter(Boolean).join('\n');
          errMsg += '\n' + formatted;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const addToPlaylist = async (mediaId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, duration: 10 }) // default 10s
      });
      if (res.ok) {
        const updatedRes = await fetch('/api/playlists');
        const data = await updatedRes.json();
        if (Array.isArray(data)) {
          setPlaylists(data);
          const updated = data.find((p: any) => p.id === editingPlaylist.id);
          if (updated) setEditingPlaylist(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addWidgetToPlaylist = async (widgetId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId, duration: 10 }) // default 10s
      });
      if (res.ok) {
        const updatedRes = await fetch('/api/playlists');
        const data = await updatedRes.json();
        if (Array.isArray(data)) {
          setPlaylists(data);
          const updated = data.find((p: any) => p.id === editingPlaylist.id);
          if (updated) setEditingPlaylist(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };



  const addOverlayToPlaylist = async (widgetId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/overlays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId })
      });
      if (res.ok) {
        const updatedRes = await fetch('/api/playlists');
        const data = await updatedRes.json();
        if (Array.isArray(data)) {
          setPlaylists(data);
          const updated = data.find((p: any) => p.id === editingPlaylist.id);
          if (updated) setEditingPlaylist(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeOverlay = async (overlayId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/overlays/${overlayId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPlaylists();
        setEditingPlaylist({ ...editingPlaylist, overlays: editingPlaylist.overlays.filter((o: any) => o.id !== overlayId) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateWidgetProperties = async (widgetId: string, updates: any, silent = false) => {
    try {
      const res = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await fetchWidgets();
        await fetchPlaylists(); // To get updated overlay data
        if (!silent) {
          setIframeKey(k => k + 1); // Live update locally
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeFromPlaylist = async (itemId: string) => {
    try {
      const res = await fetch(`/api/playlists/items/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPlaylists();
        // Update local editing state so it disappears instantly
        setEditingPlaylist({ ...editingPlaylist, items: editingPlaylist.items.filter((i: any) => i.id !== itemId) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist? This will stop it from playing on any assigned screens.")) return;
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingPlaylist(null);
        setActiveTab('playlists');
        fetchPlaylists();
        fetchScreens(); // update screens as they may have been unassigned
      }
    } catch (e) {
      console.error("Delete playlist error", e);
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!editingPlaylist || !editingPlaylist.items) return;
    
    const items = [...editingPlaylist.items];
    if (direction === 'up' && index > 0) {
      // Swap
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    } else if (direction === 'down' && index < items.length - 1) {
      // Swap
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    } else {
      return; // Invalid move
    }

    // Optimistically update UI
    setEditingPlaylist({ ...editingPlaylist, items });

    // Send new order to server
    const itemIds = items.map(item => item.id);
    try {
      await fetch(`/api/playlists/${editingPlaylist.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      fetchPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  const updateItemDuration = async (itemId: string, duration: number) => {
    try {
      const res = await fetch(`/api/playlists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      });
      if (res.ok) {
        const updatedRes = await fetch('/api/playlists');
        const data = await updatedRes.json();
        if (Array.isArray(data)) {
          setPlaylists(data);
          const updated = data.find((p: any) => p.id === editingPlaylist.id);
          if (updated) setEditingPlaylist(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateItemTransition = async (itemId: string, transition: string | null) => {
    try {
      const res = await fetch(`/api/playlists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition })
      });
      if (res.ok) {
        const updatedRes = await fetch('/api/playlists');
        const data = await updatedRes.json();
        if (Array.isArray(data)) {
          setPlaylists(data);
          const updated = data.find((p: any) => p.id === editingPlaylist.id);
          if (updated) setEditingPlaylist(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updatePlaylistTransition = async (transition: string) => {
    if (!editingPlaylist) return;
    try {
      setEditingPlaylist({ ...editingPlaylist, transition });
      const res = await fetch(`/api/playlists/${editingPlaylist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingPlaylist, transition })
      });
      if (res.ok) {
        const { playlist } = await res.json();
        setEditingPlaylist(playlist);
        fetchPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isScreenOnline = (screen: any) => {
    if (!screen.lastSeenAt) return false;
    return (new Date().getTime() - new Date(screen.lastSeenAt).getTime()) < 60000;
  };

  const handleAuditSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (auditSortConfig.key === key && auditSortConfig.direction === 'asc') direction = 'desc';
    setAuditSortConfig({ key, direction });
  };

  const sortedAuditLogs = useMemo(() => {
    let sortableItems = [...auditLogs];
    sortableItems.sort((a, b) => {
      let valA = a[auditSortConfig.key] || '';
      let valB = b[auditSortConfig.key] || '';
      if (auditSortConfig.key === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      if (valA < valB) return auditSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return auditSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [auditLogs, auditSortConfig]);

  const downloadAuditCSV = () => {
    setShowAuditDownloadMenu(false);
    if (sortedAuditLogs.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time,User,Action,Details\n";
    sortedAuditLogs.forEach(log => {
      const row = [
        `"${new Date(log.createdAt).toLocaleString()}"`,
        `"${log.userName || 'System'}"`,
        `"${log.action}"`,
        `"${log.details || ''}"`
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `SIGNAGE_audit_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAuditPDF = () => {
    setShowAuditDownloadMenu(false);
    if (sortedAuditLogs.length === 0) return;
    const doc = new jsPDF();
    const dateStr = new Date().toISOString().split('T')[0];
    doc.setFontSize(20);
    doc.text('SIGNAGE Audit Logs', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableColumn = ["Time", "User", "Action", "Details"];
    const tableRows = sortedAuditLogs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.userName || 'System',
      log.action,
      log.details || ''
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 36,
      theme: 'grid',
      headStyles: { fillColor: [44, 76, 124] },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    doc.save(`SIGNAGE_audit_${dateStr}.pdf`);
  };

  const AuditSortIcon = ({ columnKey }: { columnKey: string }) => {
    if (auditSortConfig.key !== columnKey) return <ChevronUp size={14} style={{ opacity: 0.2 }} />;
    return auditSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const userRole = (session?.user as any)?.role;
  let userPerms: string[] = [];
  try { userPerms = JSON.parse((session?.user as any)?.permissions || '[]'); } catch(e) {}
  const hasPerm = (mod: string) => userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userPerms.includes(mod);
  return (
    <>
      {stats.brandingColor && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --brand-primary: ${stats.brandingColor};
          }
        `}} />
      )}
      
      {stats.isImpersonating && (
        <div style={{ background: '#FF4500', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          ⚠️ You are currently impersonating {stats.orgName || 'a tenant'}.
          <StopImpersonatingButton />
        </div>
      )}

      {isMobileMode ? (
        <MobileCommander
          session={session}
          stats={stats}
          screens={screens}
          mediaAssets={mediaAssets}
          folders={folders}
          playlists={playlists}
          fetchScreens={fetchScreens}
          fetchMedia={fetchMedia}
          fetchFolders={fetchFolders}
          handleAssignPlaylist={handleAssignPlaylist}
          handleTestConnection={handleTestConnection}
        />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', height: stats.isImpersonating ? 'calc(100vh - 46px)' : '100vh', width: '100vw', backgroundColor: 'var(--background)' }}>
        {/* Top Navigation Bar */}
        <header style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 32px', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', flexShrink: 0, justifyContent: 'space-between', zIndex: 10 }}>
          
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setActiveTab('dashboard'); setEditingPlaylist(null); }}>
            <img src={stats.brandingLogoUrl || "/logo.png"} alt="Logo" style={{ height: '38px', objectFit: 'contain' }} />
          </div>

          {/* Center: Main Nav */}
          <nav style={{ display: 'flex', gap: '32px', height: '100%' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', mod: 'dashboard' },
            { id: 'media', label: 'Media Library', mod: 'media' },
            { id: 'playlists', label: 'Playlists', mod: 'playlists' },
            { id: 'screens', label: 'Screens', mod: 'screens' },
            { id: 'approvals', label: 'Approvals', mod: 'approvals', count: pendingApprovalsCount },
            { id: 'tv_accounts', label: 'TV Accounts', icon: ShieldCheck, mod: 'tv-accounts' },
            { id: 'users', label: 'Users', icon: Users, mod: 'users' },
          ].filter(tab => {
            if ((session?.user as any)?.role === 'SUPER_ADMIN' || (session?.user as any)?.role === 'ADMIN') return true;
            if (!tab.mod) return true; 
            try {
              const perms = JSON.parse((session?.user as any)?.permissions || '[]');
              return perms.includes(tab.mod);
            } catch (e) { return false; }
          }).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setEditingPlaylist(null); }}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                height: '100%', padding: '0 4px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {t(`nav.${tab.id}`, tab.label)}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{ fontSize: '10px', background: '#EF4444', color: 'white', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

          {hasPerm('reports') && <button onClick={() => { setActiveTab('reports'); setEditingPlaylist(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'reports' ? 'var(--brand-primary)' : 'var(--text-muted)' }} title={t('nav.reports', 'Reports')}><BarChart3 size={18} /></button>}
          {hasPerm('analytics') && <button onClick={() => { setActiveTab('analytics'); setEditingPlaylist(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'analytics' ? 'var(--brand-primary)' : 'var(--text-muted)' }} title={t('nav.analytics', 'Analytics')}><BarChart size={18} /></button>}
          {hasPerm('audit') && <button onClick={() => { setActiveTab('audit'); setEditingPlaylist(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'audit' ? 'var(--brand-primary)' : 'var(--text-muted)' }} title={t('nav.audit', 'Audit Logs')}><ClipboardList size={18} /></button>}
          {hasPerm('settings') && <button onClick={() => { setActiveTab('settings'); setEditingPlaylist(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'settings' ? 'var(--brand-primary)' : 'var(--text-muted)' }} title={t('nav.settings', 'Settings')}><Settings size={18} /></button>}
          
          {hasPerm('users') && (
            <button onClick={() => { setActiveTab('users'); setEditingPlaylist(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'users' ? 'var(--brand-primary)' : 'var(--text-muted)' }} title={t('nav.users', 'Users')}><Users size={18} /></button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
            {(session?.user as any)?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => window.location.href = '/super-admin'}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Settings style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                {t('nav.super_admin', 'Super Admin Panel')}
              </button>
            )}
            {/* Active Mobile Presence Indicator */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMobilePresenceDropdown(!showMobilePresenceDropdown)}
                title={mobilePresence.count > 0 ? `${mobilePresence.count} Mobile User(s) Connected` : "No mobile devices connected"}
                style={{
                  background: mobilePresence.count > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  color: mobilePresence.count > 0 ? '#059669' : 'var(--text-muted)',
                  border: `1px solid ${mobilePresence.count > 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: mobilePresence.count > 0 ? '#10B981' : '#94A3B8',
                  boxShadow: mobilePresence.count > 0 ? '0 0 8px #10B981' : 'none'
                }} />
                <TabletSmartphone size={14} />
                <span>
                  {mobilePresence.count > 0 ? `${mobilePresence.count} Mobile Active` : '0 Mobile'}
                </span>
              </button>

              {/* Dropdown Popup */}
              {showMobilePresenceDropdown && (
                <div 
                  className="glass-panel" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '280px',
                    padding: '12px',
                    borderRadius: '12px',
                    zIndex: 50,
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--foreground)' }}>
                      Active Mobile Sessions ({mobilePresence.count})
                    </span>
                    <button 
                      onClick={() => setShowMobilePresenceDropdown(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                    >
                      ✕
                    </button>
                  </div>

                  {mobilePresence.activeSessions.length === 0 ? (
                    <div style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No mobile sessions currently active.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                      {mobilePresence.activeSessions.map((sess: any, idx: number) => (
                        <div key={idx} style={{ background: 'var(--muted)', padding: '8px 10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)' }}>
                              📱 {sess.userName}
                            </span>
                            <span style={{ fontSize: '10px', color: '#10B981', fontWeight: '700' }}>Live</span>
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {sess.deviceType} {sess.screenName ? `• ${sess.screenName}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px', marginLeft: '8px' }}>
              {(session?.user?.name || "A")[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)' }}>{session?.user?.name || "Admin User"}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '11px', textAlign: 'left', padding: 0 }}>{t('nav.sign_out', 'Sign Out')}</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
        
        {/* Render Title inside Main if editing a playlist */}
        {editingPlaylist && (
          <div style={{ padding: '24px 40px 0', flexShrink: 0 }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)' }}>{t('playlists.edit_sequence', 'Editing')}: {editingPlaylist.name}</h2>
          </div>
        )}
        
        {/* Tab Headers for non-playlist edits */}
        {!editingPlaylist && activeTab !== 'dashboard' && (
           <div style={{ padding: '32px 32px 0 32px' }}>
             <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
               {t(`nav.${activeTab}`, activeTab === 'tv_accounts' ? 'TV Accounts' : activeTab === 'media' ? 'Media Library' : activeTab === 'playlists' ? 'Playlists' : activeTab === 'screens' ? 'Screens' : activeTab === 'users' ? 'Users' : activeTab === 'reports' ? 'Reports' : activeTab === 'analytics' ? 'Analytics' : activeTab === 'audit' ? 'Audit Logs' : activeTab === 'settings' ? 'Settings' : activeTab.replace('_', ' '))}
             </h2>
           </div>
        )}

        {/* Scrollable Content Area */}
        <div style={{ padding: '24px 40px 60px', flex: 1, overflowY: 'auto' }}>
          
          {activeTab === 'tv_accounts' && <TvAccountsTab mediaAssets={mediaAssets} />}

          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '8px' }}>
                    {t('dash.welcome', 'Welcome back')}, {session?.user?.name || "Admin"}
                  </h2>
                  <p style={{ color: 'var(--text-muted)' }}>{t('dash.subtitle', "Here's what's happening with your signage network today.")}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><MonitorPlay size={100} /></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><Wifi size={16} color="var(--success, #10b981)" /> {t('dash.online_screens', 'Online Screens')}</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.activeScreens || 0} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {stats.totalScreens || 0}</span></div>
                </div>
                
                <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><ListVideo size={100} /></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><ListVideo size={16} color="var(--brand-primary)" /> {t('dash.total_playlists', 'Total Playlists')}</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.totalPlaylists || 0}</div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><ImageIcon size={100} /></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={16} color="var(--brand-secondary)" /> {t('dash.media_assets', 'Media Assets')}</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.totalMedia || 0}</div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><TabletSmartphone size={100} /></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TabletSmartphone size={16} color={mobilePresence.count > 0 ? "#10B981" : "var(--brand-primary)"} /> 
                    Mobile Controllers
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--foreground)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {mobilePresence.count || 0}
                    <span style={{ fontSize: '13px', color: mobilePresence.count > 0 ? '#10B981' : 'var(--text-muted)', fontWeight: '600' }}>
                      {mobilePresence.count > 0 ? '🟢 Active' : 'Idle'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Mobile Live Banner */}
              {mobilePresence.count > 0 && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', display: 'block' }}>
                        📱 Mobile Sessions Active: {mobilePresence.activeSessions.map((s: any) => s.userName).join(', ')}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Staff members are currently connected and controlling signage from mobile devices.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: hasPerm('audit') ? '1fr 300px' : '300px', gap: '24px', alignItems: 'start', justifyContent: hasPerm('audit') ? 'start' : 'end' }}>
                {hasPerm('audit') && (
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={18} color="var(--brand-primary)"/> {t('dash.recent_activity', 'Recent Activity')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {auditLogs.slice(0, 6).map(log => (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                            {(log.userName || "S")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>
                              {log.userName || 'System'} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>{formatActivityDetail(log)}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('dash.no_activity', 'No recent activity.')}</div>
                      )}
                    </div>
                  </div>
                )}

                {(hasPerm('media') || hasPerm('playlists') || hasPerm('screens')) && (
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{t('dash.quick_actions', 'Quick Actions')}</h3>
                    
                    {hasPerm('media') && (
                      <button onClick={() => setActiveTab('media')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '10px', borderRadius: '8px', color: 'var(--brand-primary)' }}><UploadCloud size={20} /></div>
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--foreground)' }}>{t('dash.upload_media', 'Upload Media')}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('dash.upload_sub', 'Add images or videos')}</div>
                        </div>
                      </button>
                    )}

                    {hasPerm('playlists') && (
                      <button onClick={() => setActiveTab('playlists')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '8px', color: 'var(--brand-secondary)' }}><Plus size={20} /></div>
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--foreground)' }}>{t('dash.create_playlist', 'Create Playlist')}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('dash.create_playlist_sub', 'Build a new sequence')}</div>
                        </div>
                      </button>
                    )}

                    {hasPerm('screens') && (
                      <button onClick={() => setActiveTab('screens')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', color: '#10b981' }}><MonitorPlay size={20} /></div>
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--foreground)' }}>{t('dash.manage_screens', 'Manage Screens')}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('dash.manage_screens_sub', 'Check status and pair')}</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'screens' && (
            <ScreenManagerTab 
              stats={stats}
              screens={screens}
              groups={groups}
              playlists={playlists}
              mediaAssets={mediaAssets}
              showPairModal={showPairModal}
              setShowPairModal={setShowPairModal}
              pairCode={pairCode}
              setPairCode={setPairCode}
              pairName={pairName}
              setPairName={setPairName}
              pairScreenId={pairScreenId}
              handleCreateScreen={handleCreateScreen}
              handleAssignPlaylist={handleAssignPlaylist}
              setVisualEditorScreenId={setVisualEditorScreenId}
              handleTestConnection={handleTestConnection}
              handleDeleteScreen={handleDeleteScreen}
              isScreenOnline={isScreenOnline}
              fetchGroups={fetchGroups}
              fetchScreens={fetchScreens}
              handleUpdateScreen={handleUpdateScreen}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab proofOfPlayStats={proofOfPlayStats} />
          )}

          {activeTab === 'reports' && (
            <ReportsTab />
          )}

          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onClick={() => setShowAuditDownloadMenu(false)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Track administrative actions, user logins, and system audit logs.</p>
                <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-primary" onClick={() => setShowAuditDownloadMenu(!showAuditDownloadMenu)} disabled={auditLogs.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <Download size={16} /> Export Audit Log
                  </button>
                  
                  {showAuditDownloadMenu && (
                    <div style={{ 
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                      background: 'var(--card-bg)', border: '1px solid var(--border)', 
                      borderRadius: '10px', boxShadow: 'var(--shadow-lg)', zIndex: 50,
                      minWidth: '170px', overflow: 'hidden'
                    }}>
                      <button 
                        onClick={downloadAuditCSV}
                        style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FileText size={16} color="var(--brand-primary)" /> Export CSV Format
                      </button>
                      <button 
                        onClick={downloadAuditPDF}
                        style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FileDown size={16} color="var(--brand-secondary)" /> Export PDF Document
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                  <thead>
                    <tr style={{ background: 'var(--secondary)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <th onClick={() => handleAuditSort('createdAt')} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Timestamp <AuditSortIcon columnKey="createdAt" /></div>
                      </th>
                      <th onClick={() => handleAuditSort('userName')} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>User <AuditSortIcon columnKey="userName" /></div>
                      </th>
                      <th onClick={() => handleAuditSort('action')} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Action <AuditSortIcon columnKey="action" /></div>
                      </th>
                      <th onClick={() => handleAuditSort('details')} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Details <AuditSortIcon columnKey="details" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAuditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '13px' }}>
                          {log.userName || <span style={{ color: 'var(--text-muted)' }}>System</span>}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                          <span style={{ background: 'rgba(44, 76, 124, 0.08)', color: 'var(--brand-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                          No audit log records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsTab />
          )}

          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Manage CMS system administrators and role-based content agents.</p>
                <button 
                  onClick={() => setShowCreateUser(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Add New User
                </button>
              </div>

              {showCreateUser && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
                    {editingUser ? "Edit User Privileges" : "Create New CMS User"}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="input-field"
                    />
                    <input 
                      type="password" 
                      placeholder={editingUser ? "New Password (leave blank to keep)" : "Password"} 
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      className="input-field"
                    />
                    <select 
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value)}
                      className="input-field"
                    >
                      <option value="AGENT">Content Agent</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  
                  {newUserRole === 'AGENT' && (
                    <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '12px', fontWeight: '600', margin: 0 }}>Assign Module Access & Permissions:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                        {['dashboard', 'screens', 'media', 'playlists', 'widgets', 'tv-accounts', 'groups', 'reports', 'analytics', 'audit', 'settings', 'users'].map(mod => (
                           <div key={mod} style={{ padding: '10px', border: `1px solid ${newUserPermissions.includes(mod) ? 'var(--brand-primary)' : 'var(--border)'}`, borderRadius: '8px', background: newUserPermissions.includes(mod) ? 'rgba(44, 76, 124, 0.05)' : 'var(--card-bg)' }}>
                             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '700', color: 'var(--foreground)' }}>
                               <input 
                                 type="checkbox" 
                                 checked={newUserPermissions.includes(mod)}
                                 onChange={(e) => {
                                   if (e.target.checked) setNewUserPermissions(prev => [...prev, mod]);
                                   else setNewUserPermissions(prev => prev.filter(p => !p.startsWith(mod)));
                                 }}
                                 style={{ accentColor: 'var(--brand-primary)' }}
                               />
                               <span style={{ textTransform: 'capitalize' }}>{mod.replace('-', ' ')}</span>
                             </label>
                             {newUserPermissions.includes(mod) && !['dashboard', 'reports', 'analytics', 'audit', 'settings'].includes(mod) && (
                               <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '22px' }}>
                                 {['create', 'edit', 'delete'].map(action => {
                                   const permKey = `${mod}:${action}`;
                                   return (
                                     <label key={permKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                       <input 
                                         type="checkbox" 
                                         checked={newUserPermissions.includes(permKey)}
                                         onChange={(e) => {
                                           if (e.target.checked) setNewUserPermissions(prev => [...prev, permKey]);
                                           else setNewUserPermissions(prev => prev.filter(p => p !== permKey));
                                         }}
                                         style={{ accentColor: 'var(--brand-primary)' }}
                                       />
                                       <span style={{ textTransform: 'capitalize' }}>{action}</span>
                                     </label>
                                   );
                                 })}
                               </div>
                             )}
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => { setShowCreateUser(false); setEditingUser(null); setNewUsername(''); setNewUserPassword(''); setNewUserPermissions([]); setNewUserRole('AGENT'); }} className="btn-secondary">Cancel</button>
                    <button onClick={async () => {
                       if (editingUser) {
                          // update user
                          await fetch(`/api/users/${editingUser.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: newUserRole, permissions: JSON.stringify(newUserPermissions), ...(newUserPassword ? { password: newUserPassword } : {}) })
                          });
                          fetchUsers();
                          setShowCreateUser(false);
                          setEditingUser(null);
                          setNewUsername('');
                          setNewUserPassword('');
                          setNewUserRole('AGENT');
                          setNewUserPermissions([]);
                       } else {
                          handleCreateUser();
                       }
                    }} className="btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
                  </div>
                </div>
              )}

              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                  <thead>
                    <tr style={{ background: 'var(--secondary)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Username</th>
                      <th style={{ padding: '14px 16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</th>
                      <th style={{ padding: '14px 16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created At</th>
                      <th style={{ padding: '14px 16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>{u.username}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(44, 76, 124, 0.1)', color: u.role === 'ADMIN' ? '#EF4444' : 'var(--brand-primary)', fontSize: '12px', fontWeight: '700' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => {
                               setEditingUser(u);
                               setNewUsername(u.username);
                               setNewUserRole(u.role);
                               try { setNewUserPermissions(JSON.parse(u.permissions || '[]')); } catch(e) { setNewUserPermissions([]); }
                               setNewUserPassword('');
                               setShowCreateUser(true);
                            }} className="btn-secondary" style={{ padding: '4px 8px', height: 'auto', fontSize: '12px' }} title="Edit Privileges"><Settings size={14} /></button>
                            {u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px' }} title="Primary Org Admin cannot be deleted">
                                Protected
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleDeleteUser(u.id)} 
                                disabled={u.id === (session?.user as any)?.id}
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  color: u.id === (session?.user as any)?.id ? 'var(--border)' : '#EF4444', 
                                  cursor: u.id === (session?.user as any)?.id ? 'not-allowed' : 'pointer', 
                                  padding: '4px' 
                                }}
                                title={u.id === (session?.user as any)?.id ? "Cannot delete yourself" : "Delete User"}
                              >
                                <Trash2 size={16}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <ApprovalsTab onCountChange={fetchPendingApprovalsCount} />
          )}

          {activeTab === 'media' && !editingPlaylist && (
            <MediaLibraryTab
              stats={stats}
              mediaAssets={mediaAssets}
              folders={folders}
              refreshMedia={fetchMedia}
              refreshFolders={fetchFolders}
              onEditCreative={(media) => setEditingWidget({ id: media.id, name: media.name, type: 'canvas', dataPayload: media.url, folderId: media.folderId })}
              onCreateCreative={() => setEditingWidget({ id: 'new', name: 'New Creative', type: 'canvas', position: 'center', dataPayload: '{}' })}
              onOpenTemplates={() => setShowTemplateGallery(true)}
            />
          )}

          {activeTab === 'playlists' && !editingPlaylist && (
            <PlaylistManagerTab
              playlists={playlists}
              showCreatePlaylist={showCreatePlaylist}
              setShowCreatePlaylist={setShowCreatePlaylist}
              newPlaylistName={newPlaylistName}
              setNewPlaylistName={setNewPlaylistName}
              handleCreatePlaylist={handleCreatePlaylist}
              setEditingPlaylist={setEditingPlaylist}
              setActiveTab={setActiveTab}
              handleDeletePlaylist={handleDeletePlaylist}
            />
          )}

          {activeTab === 'playlists' && editingPlaylist && (
            <PlaylistEditor
              editingPlaylist={editingPlaylist}
              setEditingPlaylist={setEditingPlaylist}
              mediaAssets={mediaAssets}
              folders={folders}
              widgets={widgets}
              screens={screens}
              setEditingWidget={setEditingWidget}
              refreshPlaylists={fetchPlaylists}
              handleAssignPlaylist={handleAssignPlaylist}
              isScreenOnline={isScreenOnline}
              onExit={() => setEditingPlaylist(null)}
            />
          )}

          {showWebEmbedModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Add Website as Slide</h3>
                <button onClick={() => setShowWebEmbedModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24}/></button>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>The website will load full-screen in the playlist without any address bars.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Slide Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dashboard, News, Weather" 
                  value={webEmbedName}
                  onChange={e => setWebEmbedName(e.target.value)}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Website URL</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={webEmbedUrl}
                  onChange={e => setWebEmbedUrl(e.target.value)}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setShowWebEmbedModal(false)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleWebEmbed} disabled={isUploading} style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: 'white', cursor: 'pointer', fontWeight: '600' }}>{isUploading ? 'Saving...' : 'Add to Library'}</button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      <VisualEditorModal
        visualEditorScreenId={visualEditorScreenId} setVisualEditorScreenId={setVisualEditorScreenId}
        screens={screens} visualEditorRightTab={visualEditorRightTab} setVisualEditorRightTab={setVisualEditorRightTab}
        selectedOverlayId={selectedOverlayId} setSelectedOverlayId={setSelectedOverlayId} fetchWidgets={fetchWidgets}
        fetchPlaylists={fetchPlaylists} playlists={playlists} handleUpdatePlaylist={handleUpdatePlaylist}
        weatherSearchTimeout={weatherSearchTimeout} editWeatherSearchTimeout={editWeatherSearchTimeout}
        weatherSearchResults={weatherSearchResults} setWeatherSearchResults={setWeatherSearchResults}
        editWeatherSearchResults={editWeatherSearchResults} setEditWeatherSearchResults={setEditWeatherSearchResults}
        iframeKey={iframeKey} setIframeKey={setIframeKey}
        WIDGET_TYPES={WIDGET_TYPES} mediaAssets={mediaAssets} folders={folders}
        handleEditWeatherSearchInput={handleEditWeatherSearchInput}
        handleCommit={handleCommit}
        isDraggingWidget={isDraggingWidget}
        setIsDraggingWidget={setIsDraggingWidget}
      />

      <TemplateGalleryModal
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={(template) => {
          setShowTemplateGallery(false);
          setEditingWidget({
            id: 'new',
            name: template.name,
            type: 'canvas',
            position: 'center',
            dataPayload: JSON.stringify(template.layoutData || {})
          });
        }}
      />

      {editingWidget && editingWidget.type === 'canvas' ? (
        <CreativeCanvasEditor
          widget={editingWidget}
          onClose={() => setEditingWidget(null)}
          onSave={handleSaveCreative}
          mediaAssets={mediaAssets}
          folders={folders}
          WIDGET_TYPES={WIDGET_TYPES}
          isDraggingWidget={isDraggingWidget}
          setIsDraggingWidget={setIsDraggingWidget}
        />
      ) : editingWidget && (
        <WidgetEditorModal
          widget={editingWidget}
          onClose={() => setEditingWidget(null)}
          onSave={handleSaveWidget}
          mediaAssets={mediaAssets}
          folders={folders}
        />
      )}

      <UpgradePlanModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        limitType="screens" 
        currentPlanName={stats?.planName}
        maxScreens={stats?.maxScreens}
        currentScreensCount={screens.length}
      />
    </div>
    )}
    </>
  );
}
