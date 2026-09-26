import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Verify webhook secret
    const authHeader = req.headers.get('x-webhook-secret') || req.headers.get('authorization');
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (!expectedSecret || (authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { flightNumber, status, gate } = data;

    if (!flightNumber || !status || !gate) {
      return NextResponse.json({ error: "Missing required fields: flightNumber, status, gate" }, { status: 400 });
    }

    // Find the screen matching the gate name (e.g. "Gate A1")
    const screen = await prisma.screen.findFirst({
      where: {
        name: {
          contains: gate
        }
      }
    });

    if (!screen) {
      return NextResponse.json({ error: "No screen found for gate " + gate }, { status: 404 });
    }

    // Depending on the status, we trigger an override
    if (status === "BOARDING") {
      const payload = {
        title: `FLIGHT ${flightNumber}`,
        subtitle: "NOW BOARDING",
        textColor: "#ffffff",
        bgColor: "#16a34a" // Green
      };

      await prisma.screen.update({
        where: { id: screen.id },
        data: {
          overrideType: "html",
          overridePayload: JSON.stringify(payload)
        }
      });
      await logAudit('FLIGHT_WEBHOOK', `Flight ${flightNumber} BOARDING at ${gate}`, null);
      return NextResponse.json({ success: true, message: "Screen overridden to BOARDING" });
    } else if (status === "DELAYED") {
      const payload = {
        title: `FLIGHT ${flightNumber}`,
        subtitle: "DELAYED",
        textColor: "#ffffff",
        bgColor: "#dc2626" // Red
      };

      await prisma.screen.update({
        where: { id: screen.id },
        data: {
          overrideType: "html",
          overridePayload: JSON.stringify(payload)
        }
      });
      await logAudit('FLIGHT_WEBHOOK', `Flight ${flightNumber} DELAYED at ${gate}`, null);
      return NextResponse.json({ success: true, message: "Screen overridden to DELAYED" });
    } else if (status === "DEPARTED") {
      // Clear the override to return to normal playlist
      await prisma.screen.update({
        where: { id: screen.id },
        data: {
          overrideType: null,
          overridePayload: null
        }
      });
      await logAudit('FLIGHT_WEBHOOK', `Flight ${flightNumber} DEPARTED at ${gate}`, null);
      return NextResponse.json({ success: true, message: "Screen returned to playlist" });
    }

    return NextResponse.json({ success: true, message: "Webhook received but no action taken." });
  } catch (error) {
    console.error("Webhook Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
