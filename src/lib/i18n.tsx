"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'es';

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.media': 'Media Library',
    'nav.playlists': 'Playlists',
    'nav.screens': 'Screens',
    'nav.approvals': 'Approvals',
    'nav.tv_accounts': 'TV Accounts',
    'nav.users': 'Users',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.audit': 'Audit Logs',
    'nav.settings': 'Settings',
    'nav.super_admin': 'Super Admin Panel',
    'nav.sign_out': 'Sign Out',

    // Dashboard
    'dash.welcome': 'Welcome back',
    'dash.subtitle': "Here's what's happening with your signage network today.",
    'dash.online_screens': 'Online Screens',
    'dash.total_playlists': 'Total Playlists',
    'dash.media_assets': 'Media Assets',
    'dash.recent_activity': 'Recent Activity',
    'dash.no_activity': 'No recent activity.',
    'dash.quick_actions': 'Quick Actions',
    'dash.upload_media': 'Upload Media',
    'dash.upload_sub': 'Add images or videos',
    'dash.create_playlist': 'Create Playlist',
    'dash.create_playlist_sub': 'Build a new sequence',
    'dash.manage_screens': 'Manage Screens',
    'dash.manage_screens_sub': 'Check status and pair',

    // Common Buttons & Labels
    'btn.save': 'Save Changes',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Delete',
    'btn.edit': 'Edit',
    'btn.close': 'Close',
    'btn.preview': 'Preview',
    'btn.upload': 'Upload File',
    'btn.approve': 'Approve',
    'btn.reject': 'Reject',
    'btn.submit_decision': 'Submit Decision',
    'btn.push_to_tvs': 'Push to TVs',
    'btn.rollback': 'Rollback',
    'btn.done': 'Done',
    'btn.add': 'Add',
    'btn.search': 'Search...',
    'btn.load_more': 'Load More',

    // Screens Tab
    'screens.title': 'Screens',
    'screens.pair_screen': 'Pair New Screen',
    'screens.table_view': 'Table View',
    'screens.cards_view': 'Card Grid',
    'screens.groups_view': 'Groups',
    'screens.schedule_view': 'Schedule Timeline',
    'screens.col_name': 'Screen Name',
    'screens.col_status': 'Status',
    'screens.col_playlist': 'Assigned Playlist',
    'screens.col_location': 'Location',
    'screens.col_operating_hours': 'Operating Hours',
    'screens.col_actions': 'Actions',
    'screens.online': 'Online',
    'screens.offline': 'Offline',
    'screens.standby': 'Standby (Sleeping)',
    'screens.no_playlist': 'None (Idle)',
    'screens.broadcast_alert': 'Broadcast Alert',
    'screens.screenshot': 'Capture Snapshot',
    'screens.emergency_broadcast': 'Emergency Notice Broadcast',
    'screens.operating_hours_title': 'Operating Hours / Sleep Schedule',

    // Media Library Tab
    'media.title': 'Media Library',
    'media.folders': 'Folders',
    'media.root_directory': 'Root Directory',
    'media.new_folder_placeholder': 'New folder name...',
    'media.search_placeholder': 'Search media...',
    'media.sort_date': 'Date',
    'media.sort_name': 'Name',
    'media.browse_templates': 'Browse Templates',
    'media.upgrade_storage': 'Upgrade Storage',
    'media.add_embed': 'Add Embed',
    'media.create_creative': 'Create Creative',
    'media.tags': 'Tags:',
    'media.all_tags': 'All',
    'media.no_media': 'No media assets found',
    'media.no_media_sub': 'Upload images/videos or create a canvas design to get started.',
    'media.edit_creative': 'Edit Creative',
    'media.manage_tags': 'Manage Tags',
    'media.set_expiration': 'Set Expiration Date',
    'media.submit_approval': 'Submit for Approval',
    'media.open_new_tab': 'Open in New Tab',
    'media.delete_media': 'Delete Media',
    'media.expired_badge': 'EXPIRED',
    'media.pending_badge': 'PENDING',
    'media.approved_badge': 'APPROVED',
    'media.rejected_badge': 'REJECTED',

    // Playlists Tab
    'playlists.title': 'Playlists',
    'playlists.new_smart': 'New Smart Playlist',
    'playlists.create': 'Create Playlist',
    'playlists.edit_sequence': 'Edit Sequence',
    'playlists.active_matching': 'Active Matching Slides',
    'playlists.media_items': 'Media Items',
    'playlists.cycle_time': 'Estimated Cycle',
    'playlists.screens_attached': 'Screens Attached',
    'playlists.smart_badge': 'Smart',
    'playlists.pending_approval': 'Pending Approval',
    'playlists.rejected': 'Rejected',
    'playlists.sub_header': 'Create standard slide sequences or rule-based Smart Playlists that auto-populate from tagged content.',

    // Approvals Tab
    'approvals.title': 'Content Approval Pipeline',
    'approvals.sub': 'Review and authorize media uploads and playlist publications before they broadcast to physical displays.',
    'approvals.pending_filter': 'Pending Review',
    'approvals.approved_filter': 'Approved',
    'approvals.rejected_filter': 'Rejected',
    'approvals.all_filter': 'All Requests',
    'approvals.approve_btn': 'Approve Content',
    'approvals.reject_btn': 'Reject Content',
    'approvals.decision_notes': 'Reviewer Feedback / Revision Note (Optional)',
    'approvals.no_requests': 'No approval requests found for this filter.',

    // Schedule Timeline
    'schedule.title': '24-Hour Visual Content Schedule Matrix',
    'schedule.sub': 'Real-time overview of active playlist slides, scheduled time blocks, and display operating hours.',
    'schedule.all_screens': 'All Displays & Zones',
    'schedule.inspect_screen': 'Filter Screen:',
    'schedule.mon': 'Mon',
    'schedule.tue': 'Tue',
    'schedule.wed': 'Wed',
    'schedule.thu': 'Thu',
    'schedule.fri': 'Fri',
    'schedule.sat': 'Sat',
    'schedule.sun': 'Sun',

    // Settings
    'settings.title': 'Settings',
    'settings.branding': 'Brand Customization',
    'settings.language': 'CMS Display Language',
    'settings.language_desc': 'Select your preferred language for the CMS interface.',
    'settings.alerts': 'Offline Alert Notifications',
    'settings.wifi_throttle': 'Wi-Fi Download Throttling',
    'settings.whitelist': 'Embedded Domain Whitelist',
    'settings.save': 'Save Settings',
    'settings.saved': 'Settings saved successfully!',

    // Reports & Analytics
    'reports.title': 'Reports',
    'reports.sub': 'Export detailed compliance, proof-of-play, and system telemetry records.',
    'reports.export_csv': 'Export CSV Format',
    'reports.export_pdf': 'Export PDF Document',
    'reports.qr_tab': 'QR Scan Analytics',
    'reports.qr_scans': 'Total Scans',
    'analytics.title': 'Analytics',
    'audit.title': 'Audit Logs',
    'audit.sub': 'Track administrative actions, user logins, and system audit logs.',
    'audit.timestamp': 'Timestamp',
    'audit.user': 'User',
    'audit.action': 'Action',
    'audit.details': 'Details',

    // Users
    'users.title': 'Users',
    'users.sub': 'Manage CMS system administrators and role-based content agents.',
    'users.add_user': 'Add New User',
    'users.username': 'Username',
    'users.role': 'Role',
    'users.created_at': 'Created At',
    'users.actions': 'Actions',
    'users.admin_role': 'Administrator',
    'users.agent_role': 'Content Agent'
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel Principal',
    'nav.media': 'Biblioteca de Medios',
    'nav.playlists': 'Listas de Reproducción',
    'nav.screens': 'Pantallas',
    'nav.approvals': 'Aprobaciones',
    'nav.tv_accounts': 'Cuentas de TV',
    'nav.users': 'Usuarios',
    'nav.reports': 'Reportes',
    'nav.analytics': 'Analítica',
    'nav.audit': 'Auditoría',
    'nav.settings': 'Configuración',
    'nav.super_admin': 'Panel Super Admin',
    'nav.sign_out': 'Cerrar Sesión',

    // Dashboard
    'dash.welcome': 'Bienvenido de nuevo',
    'dash.subtitle': 'Este es el estado actual de tu red de señalización digital hoy.',
    'dash.online_screens': 'Pantallas En Línea',
    'dash.total_playlists': 'Total de Listas',
    'dash.media_assets': 'Recursos Multimedia',
    'dash.recent_activity': 'Actividad Reciente',
    'dash.no_activity': 'Sin actividad reciente.',
    'dash.quick_actions': 'Acciones Rápidas',
    'dash.upload_media': 'Subir Multimedia',
    'dash.upload_sub': 'Agregar fotos o videos',
    'dash.create_playlist': 'Crear Lista',
    'dash.create_playlist_sub': 'Diseñar nueva secuencia',
    'dash.manage_screens': 'Gestionar Pantallas',
    'dash.manage_screens_sub': 'Ver estado y sincronizar',

    // Common Buttons & Labels
    'btn.save': 'Guardar Cambios',
    'btn.cancel': 'Cancelar',
    'btn.delete': 'Eliminar',
    'btn.edit': 'Editar',
    'btn.close': 'Cerrar',
    'btn.preview': 'Vista Previa',
    'btn.upload': 'Subir Archivo',
    'btn.approve': 'Aprobar',
    'btn.reject': 'Rechazar',
    'btn.submit_decision': 'Confirmar Decisión',
    'btn.push_to_tvs': 'Enviar a TVs',
    'btn.rollback': 'Revertir Versión',
    'btn.done': 'Listo',
    'btn.add': 'Agregar',
    'btn.search': 'Buscar...',
    'btn.load_more': 'Cargar Más',

    // Screens Tab
    'screens.title': 'Pantallas',
    'screens.pair_screen': 'Vincular Pantalla',
    'screens.table_view': 'Vista Tabla',
    'screens.cards_view': 'Cuadrícula',
    'screens.groups_view': 'Grupos',
    'screens.schedule_view': 'Cronograma Visual',
    'screens.col_name': 'Nombre de Pantalla',
    'screens.col_status': 'Estado',
    'screens.col_playlist': 'Lista Asignada',
    'screens.col_location': 'Ubicación',
    'screens.col_operating_hours': 'Horario Operativo',
    'screens.col_actions': 'Acciones',
    'screens.online': 'En Línea',
    'screens.offline': 'Desconectado',
    'screens.standby': 'En Espera (Reposo)',
    'screens.no_playlist': 'Ninguna (Inactiva)',
    'screens.broadcast_alert': 'Transmitir Alerta',
    'screens.screenshot': 'Captura de Pantalla',
    'screens.emergency_broadcast': 'Transmisión de Aviso de Emergencia',
    'screens.operating_hours_title': 'Horario de Operación / Ahorro de Energía',

    // Media Library Tab
    'media.title': 'Biblioteca de Medios',
    'media.folders': 'Carpetas',
    'media.root_directory': 'Directorio Raíz',
    'media.new_folder_placeholder': 'Nombre de nueva carpeta...',
    'media.search_placeholder': 'Buscar multimedia...',
    'media.sort_date': 'Fecha',
    'media.sort_name': 'Nombre',
    'media.browse_templates': 'Ver Plantillas',
    'media.upgrade_storage': 'Ampliar Almacenamiento',
    'media.add_embed': 'Agregar Enlace Web',
    'media.create_creative': 'Crear Diseño',
    'media.tags': 'Etiquetas:',
    'media.all_tags': 'Todas',
    'media.no_media': 'No se encontraron recursos multimedia',
    'media.no_media_sub': 'Sube imágenes/videos o crea un diseño en el lienzo para comenzar.',
    'media.edit_creative': 'Editar Diseño',
    'media.manage_tags': 'Gestionar Etiquetas',
    'media.set_expiration': 'Fijar Fecha de Expiración',
    'media.submit_approval': 'Enviar a Aprobación',
    'media.open_new_tab': 'Abrir en Nueva Pestaña',
    'media.delete_media': 'Eliminar Multimedia',
    'media.expired_badge': 'EXPIRADO',
    'media.pending_badge': 'PENDIENTE',
    'media.approved_badge': 'APROBADO',
    'media.rejected_badge': 'RECHAZADO',

    // Playlists Tab
    'playlists.title': 'Listas de Reproducción',
    'playlists.new_smart': 'Nueva Lista Inteligente',
    'playlists.create': 'Crear Lista',
    'playlists.edit_sequence': 'Editar Secuencia',
    'playlists.active_matching': 'Diapositivas Activas',
    'playlists.media_items': 'Elementos Multimedia',
    'playlists.cycle_time': 'Ciclo Estimado',
    'playlists.screens_attached': 'Pantallas Conectadas',
    'playlists.smart_badge': 'Inteligente',
    'playlists.pending_approval': 'Pendiente de Aprobación',
    'playlists.rejected': 'Rechazado',
    'playlists.sub_header': 'Crea secuencias estándar o Listas Inteligentes que se actualizan automáticamente según etiquetas.',

    // Approvals Tab
    'approvals.title': 'Flujo de Aprobación de Contenido',
    'approvals.sub': 'Revisa y autoriza publicaciones de contenido y listas antes de emitirse en las pantallas físicas.',
    'approvals.pending_filter': 'Pendientes de Revisión',
    'approvals.approved_filter': 'Aprobados',
    'approvals.rejected_filter': 'Rechazados',
    'approvals.all_filter': 'Todas las Solicitudes',
    'approvals.approve_btn': 'Aprobar Contenido',
    'approvals.reject_btn': 'Rechazar Contenido',
    'approvals.decision_notes': 'Comentarios para el Autor / Nota de Revisión (Opcional)',
    'approvals.no_requests': 'No hay solicitudes de aprobación en esta categoría.',

    // Schedule Timeline
    'schedule.title': 'Matriz Visual de Cronograma de Contenidos (24 Horas)',
    'schedule.sub': 'Vista en tiempo real de contenidos activos, bloques horarios programados y horas de operación de pantallas.',
    'schedule.all_screens': 'Todas las Pantallas y Zonas',
    'schedule.inspect_screen': 'Filtrar Pantalla:',
    'schedule.mon': 'Lun',
    'schedule.tue': 'Mar',
    'schedule.wed': 'Mié',
    'schedule.thu': 'Jue',
    'schedule.fri': 'Vie',
    'schedule.sat': 'Sáb',
    'schedule.sun': 'Dom',

    // Settings
    'settings.title': 'Configuración',
    'settings.branding': 'Personalización de Marca',
    'settings.language': 'Idioma de la Interfaz CMS',
    'settings.language_desc': 'Selecciona tu idioma preferido para la interfaz del sistema.',
    'settings.alerts': 'Notificaciones de Pantallas Desconectadas',
    'settings.wifi_throttle': 'Límite de Descarga Wi-Fi',
    'settings.whitelist': 'Lista Blanca de Dominios Incrustados',
    'settings.save': 'Guardar Configuración',
    'settings.saved': '¡Configuración guardada exitosamente!',

    // Reports & Analytics
    'reports.title': 'Reportes',
    'reports.sub': 'Exporta registros detallados de cumplimiento, prueba de reproducción y telemetría.',
    'reports.export_csv': 'Exportar Formato CSV',
    'reports.export_pdf': 'Exportar Documento PDF',
    'reports.qr_tab': 'Analítica de Escaneos QR',
    'reports.qr_scans': 'Total de Escaneos',
    'analytics.title': 'Analítica',
    'audit.title': 'Registros de Auditoría',
    'audit.sub': 'Rastrea acciones administrativas, inicios de sesión y eventos del sistema.',
    'audit.timestamp': 'Hora / Fecha',
    'audit.user': 'Usuario',
    'audit.action': 'Acción',
    'audit.details': 'Detalles',

    // Users
    'users.title': 'Usuarios',
    'users.sub': 'Administra administradores y agentes de contenido con permisos personalizados.',
    'users.add_user': 'Agregar Nuevo Usuario',
    'users.username': 'Nombre de Usuario',
    'users.role': 'Rol',
    'users.created_at': 'Fecha de Creación',
    'users.actions': 'Acciones',
    'users.admin_role': 'Administrador',
    'users.agent_role': 'Agente de Contenido'
  }
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('SIGNAGE_ui_language') as SupportedLanguage;
      if (saved && (saved === 'en' || saved === 'es')) {
        setLanguageState(saved);
      }
    } catch (e) {}
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('SIGNAGE_ui_language', lang);
    } catch (e) {}
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
