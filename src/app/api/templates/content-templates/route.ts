import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const STARTER_TEMPLATES = [
  {
    id: 'sys-tpl-welcome-tropic',
    name: 'Tropic Welcome Banner',
    category: 'welcome',
    description: 'Elegant airport and terminal welcome display with live clock and weather.',
    thumbnail: '🏝️',
    isSystem: true,
    canvasData: JSON.stringify({
      background: { color: '#020617', fontFamily: 'Inter, sans-serif' },
      elements: [
        {
          id: 'el-header-bg',
          type: 'shape',
          x: 0,
          y: 0,
          width: 100,
          height: 14,
          zIndex: 1,
          payload: { shapeType: 'rectangle', fill: 'linear-gradient(90deg, #1e3a8a, #0284c7)', borderRadius: 0 }
        },
        {
          id: 'el-welcome-text',
          type: 'text',
          x: 5,
          y: 2,
          width: 60,
          height: 10,
          zIndex: 2,
          payload: { text: 'WELCOME TO TROPIC AIR', fontSize: 36, color: '#ffffff', fontWeight: 'bold' }
        },
        {
          id: 'el-clock',
          type: 'clock',
          x: 75,
          y: 2,
          width: 20,
          height: 10,
          zIndex: 2,
          payload: { format: 'hh:mm:ss A', color: '#38bdf8', fontSize: 24 }
        },
        {
          id: 'el-main-card',
          type: 'shape',
          x: 5,
          y: 18,
          width: 60,
          height: 70,
          zIndex: 1,
          payload: { shapeType: 'rounded', fill: 'rgba(15, 23, 42, 0.75)', borderRadius: 16, borderColor: '#334155', borderWidth: 2 }
        },
        {
          id: 'el-headline',
          type: 'text',
          x: 8,
          y: 22,
          width: 54,
          height: 15,
          zIndex: 2,
          payload: { text: 'Explore Belize with Us', fontSize: 42, color: '#f8fafc', fontWeight: 'bold' }
        },
        {
          id: 'el-body-desc',
          type: 'text',
          x: 8,
          y: 40,
          width: 54,
          height: 35,
          zIndex: 2,
          payload: { text: 'Daily scenic flights to San Pedro, Placencia, Caye Caulker and more. Inquire with any gate agent for same-day charters and island transfers.', fontSize: 24, color: '#94a3b8' }
        },
        {
          id: 'el-weather-widget',
          type: 'weather',
          x: 68,
          y: 18,
          width: 27,
          height: 45,
          zIndex: 2,
          payload: { location: 'San Pedro, Belize', theme: 'modern_glass_dark', unit: 'f' }
        },
        {
          id: 'el-qr-widget',
          type: 'qrcode',
          x: 68,
          y: 66,
          width: 27,
          height: 22,
          zIndex: 2,
          payload: { destinationUrl: 'https://www.tropicair.com', label: 'Scan to View Schedules', foregroundColor: '#ffffff', backgroundColor: '#0f172a' }
        },
        {
          id: 'el-bottom-ticker',
          type: 'ticker',
          x: 0,
          y: 92,
          width: 100,
          height: 8,
          zIndex: 3,
          payload: { text: '✈️ FLIGHT NOTICE: Please have boarding passes and photo IDs ready at the gate. Baggage drop closes 20 minutes before departure.', speed: 30, color: '#fbbf24', backgroundColor: '#0f172a' }
        }
      ]
    })
  },
  {
    id: 'sys-tpl-flight-board',
    name: 'Live Airport Departures Board',
    category: 'flight-board',
    description: 'Clean split-screen departures board with status colors and gate listings.',
    thumbnail: '🛫',
    isSystem: true,
    canvasData: JSON.stringify({
      background: { color: '#090d16', fontFamily: 'Inter, sans-serif' },
      elements: [
        {
          id: 'el-title-bar',
          type: 'shape',
          x: 0,
          y: 0,
          width: 100,
          height: 12,
          zIndex: 1,
          payload: { shapeType: 'rectangle', fill: '#1e293b' }
        },
        {
          id: 'el-title-text',
          type: 'text',
          x: 4,
          y: 2,
          width: 50,
          height: 8,
          zIndex: 2,
          payload: { text: 'DEPARTURES / SALIDAS', fontSize: 32, color: '#38bdf8', fontWeight: 'bold' }
        },
        {
          id: 'el-title-clock',
          type: 'clock',
          x: 75,
          y: 2,
          width: 21,
          height: 8,
          zIndex: 2,
          payload: { format: 'HH:mm:ss', color: '#f8fafc', fontSize: 26 }
        },
        {
          id: 'el-fids-table',
          type: 'table',
          x: 4,
          y: 16,
          width: 92,
          height: 72,
          zIndex: 2,
          payload: {
            csvData: 'Flight,Destination,Time,Gate,Status\nPM 102,San Pedro,14:15,Gate 1,On Time\nPM 204,Placencia,14:30,Gate 2,Boarding\nPM 050,Caye Caulker,15:00,Gate 1,On Time\nPM 310,Dangriga,15:20,Gate 3,Delayed\nPM 118,San Pedro,16:00,Gate 2,On Time',
            fontSize: 22,
            headerColor: '#38bdf8',
            rowColor: '#f8fafc'
          }
        },
        {
          id: 'el-fids-ticker',
          type: 'ticker',
          x: 0,
          y: 91,
          width: 100,
          height: 9,
          zIndex: 3,
          payload: { text: '⚠️ Gate assignments subject to change. Please listen for gate agent announcements.', speed: 35, color: '#f8fafc', backgroundColor: '#0284c7' }
        }
      ]
    })
  },
  {
    id: 'sys-tpl-cafe-menu',
    name: 'Island Cafe & Bar Menu Board',
    category: 'menu',
    description: 'High-contrast food & beverage menu layout with prices and promotions.',
    thumbnail: '☕',
    isSystem: true,
    canvasData: JSON.stringify({
      background: { color: '#18181b', fontFamily: 'Outfit, sans-serif' },
      elements: [
        {
          id: 'el-menu-header',
          type: 'text',
          x: 5,
          y: 4,
          width: 90,
          height: 12,
          zIndex: 2,
          payload: { text: 'ISLAND BITES & COFFEE', fontSize: 44, color: '#f59e0b', fontWeight: 'bold', textAlign: 'center' }
        },
        {
          id: 'el-col-left',
          type: 'shape',
          x: 5,
          y: 18,
          width: 42,
          height: 72,
          zIndex: 1,
          payload: { shapeType: 'rounded', fill: '#27272a', borderRadius: 12 }
        },
        {
          id: 'el-sec1-title',
          type: 'text',
          x: 8,
          y: 22,
          width: 36,
          height: 8,
          zIndex: 2,
          payload: { text: 'HOT & COLD DRINKS', fontSize: 26, color: '#fbbf24', fontWeight: 'bold' }
        },
        {
          id: 'el-sec1-items',
          type: 'text',
          x: 8,
          y: 32,
          width: 36,
          height: 52,
          zIndex: 2,
          payload: { text: 'Iced Coconut Latte ........... $6.50\nFresh Island Smoothie ........ $7.00\nCold Brew Coffee ............. $5.00\nTropical Juice Blend ......... $4.50\nBelikin Beer (Draft) ......... $5.00', fontSize: 20, color: '#f4f4f5' }
        },
        {
          id: 'el-col-right',
          type: 'shape',
          x: 53,
          y: 18,
          width: 42,
          height: 72,
          zIndex: 1,
          payload: { shapeType: 'rounded', fill: '#27272a', borderRadius: 12 }
        },
        {
          id: 'el-sec2-title',
          type: 'text',
          x: 56,
          y: 22,
          width: 36,
          height: 8,
          zIndex: 2,
          payload: { text: 'SNACKS & BAKERY', fontSize: 26, color: '#fbbf24', fontWeight: 'bold' }
        },
        {
          id: 'el-sec2-items',
          type: 'text',
          x: 56,
          y: 32,
          width: 36,
          height: 52,
          zIndex: 2,
          payload: { text: 'Johnny Cake & Ham ............ $6.00\nWarm Banana Bread ............ $4.00\nFresh Fruit Cup .............. $5.50\nChicken Empanadas (2) ........ $6.50\nArtisan Cookies .............. $3.50', fontSize: 20, color: '#f4f4f5' }
        }
      ]
    })
  },
  {
    id: 'sys-tpl-event-countdown',
    name: 'Special Event Countdown',
    category: 'event',
    description: 'High-energy countdown template for upcoming events, launches, or holiday promos.',
    thumbnail: '⏳',
    isSystem: true,
    canvasData: JSON.stringify({
      background: { color: '#030712', fontFamily: 'Inter, sans-serif' },
      elements: [
        {
          id: 'el-event-title',
          type: 'text',
          x: 10,
          y: 10,
          width: 80,
          height: 16,
          zIndex: 2,
          payload: { text: 'ISLAND SUMMER FESTIVAL 2026', fontSize: 46, color: '#38bdf8', fontWeight: 'bold', textAlign: 'center' }
        },
        {
          id: 'el-countdown-box',
          type: 'countdown',
          x: 20,
          y: 32,
          width: 60,
          height: 35,
          zIndex: 2,
          payload: { targetDate: '2026-09-01T12:00:00', label: 'EVENT STARTS IN', color: '#facc15', fontSize: 52, textAlign: 'center' }
        },
        {
          id: 'el-event-footer',
          type: 'text',
          x: 15,
          y: 72,
          width: 70,
          height: 15,
          zIndex: 2,
          payload: { text: 'Tickets Available Online • Live Music • Local Cuisine • All Ages Welcome', fontSize: 24, color: '#94a3b8', textAlign: 'center' }
        }
      ]
    })
  }
];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Fetch user-created templates from DB
    const dbTemplates = await prisma.contentTemplate.findMany({
      where: {
        OR: [
          { isSystem: true },
          { organizationId: orgId }
        ],
        ...(category && category !== 'all' ? { category } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    // Combine starter templates with DB templates (avoid duplicates by id)
    const dbIds = new Set(dbTemplates.map((t: any) => t.id));
    const startersFiltered = STARTER_TEMPLATES.filter(st => {
      if (dbIds.has(st.id)) return false;
      if (category && category !== 'all' && st.category !== category) return false;
      return true;
    });

    return NextResponse.json([...startersFiltered, ...dbTemplates]);
  } catch (error) {
    console.error('Failed to fetch content templates:', error);
    return NextResponse.json(STARTER_TEMPLATES);
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const body = await request.json();
    const { name, category, description, thumbnail, canvasData } = body;

    if (!name || !canvasData) {
      return NextResponse.json({ error: 'Name and canvasData are required' }, { status: 400 });
    }

    const template = await prisma.contentTemplate.create({
      data: {
        name,
        category: category || 'custom',
        description,
        thumbnail: thumbnail || '🎨',
        canvasData: typeof canvasData === 'string' ? canvasData : JSON.stringify(canvasData),
        isSystem: false,
        organizationId: orgId
      }
    });

    await logAudit('CREATE_TEMPLATE', `Saved creative template "${name}"`, session);

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Failed to save content template:', error);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}
