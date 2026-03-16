import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/google/token";
import type { CalendarEvent, Attendee } from "@/types/stage";

const GOOGLE_COLOR_TO_FRONTEND: Record<string, string> = {
    '1': 'lavender',
    '2': 'sage',
    '3': 'grape',
    '4': 'flamingo',
    '5': 'banana',
    '6': 'tangerine',
    '7': 'peacock',
    '8': 'graphite',
    '9': 'blueberry',
    '10': 'basil',
    '11': 'tomato',
};

const FRONTEND_COLOR_TO_GOOGLE: Record<string, string> = Object.entries(GOOGLE_COLOR_TO_FRONTEND).reduce((acc, [k, v]) => {
    acc[v] = k;
    return acc;
}, {} as Record<string, string>);

function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseTime(timeStr: string | null): { hours: number, minutes: number } {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const [h, m] = timeStr.split(':').map(Number);
    return { hours: h || 0, minutes: m || 0 };
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const oauth2Client = await getAuthenticatedClient(session.user.id);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const timeMin = new Date();
        timeMin.setFullYear(timeMin.getFullYear() - 1);
        const timeMax = new Date();
        timeMax.setFullYear(timeMax.getFullYear() + 2);

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            maxResults: 2500,
            singleEvents: true,
            orderBy: "startTime",
        });

        const items = response.data.items || [];
        const events: CalendarEvent[] = items.map(item => {
            let scheduledDate = "";
            let startTime: string | null = null;
            let endDate: string | null = null;
            let endTime: string | null = null;
            let allDay = false;

            if (item.start?.date) {
                allDay = true;
                scheduledDate = item.start.date;
                if (item.end?.date) {
                    const d = new Date(item.end.date);
                    d.setDate(d.getDate() - 1); // Google treats endDate for all-day as exclusive
                    const calculatedEndDate = formatDate(d);
                    if (calculatedEndDate !== scheduledDate) {
                        endDate = calculatedEndDate;
                    }
                }
            } else if (item.start?.dateTime) {
                const sDate = new Date(item.start.dateTime);
                scheduledDate = formatDate(sDate);
                startTime = sDate.toTimeString().substring(0, 5);

                const eDate = item.end?.dateTime ? new Date(item.end.dateTime) : null;
                if (eDate) {
                    const eDateStr = formatDate(eDate);
                    if (eDateStr !== scheduledDate) {
                        endDate = eDateStr;
                    }
                    endTime = eDate.toTimeString().substring(0, 5);
                }
            }

            const attendees: Attendee[] = (item.attendees || []).map(a => ({
                name: a.displayName || a.email || "Unknown",
                email: a.email || "",
                status: (a.responseStatus === 'accepted' || a.responseStatus === 'declined' || a.responseStatus === 'tentative')
                    ? a.responseStatus
                    : 'pending'
            }));

            return {
                id: item.id || Math.random().toString(),
                title: item.summary || "(제목 없음)",
                description: item.description || "",
                scheduledDate,
                endDate,
                startTime,
                endTime,
                allDay,
                colorId: (item.colorId && GOOGLE_COLOR_TO_FRONTEND[item.colorId])
                    ? GOOGLE_COLOR_TO_FRONTEND[item.colorId] as any
                    : 'peacock',
                completed: false,
                deletedAt: null,
                createdAt: item.created || new Date().toISOString(),
                location: item.location || "",
                attendees,
                groupId: null,
                groupName: null,
                attachments: [],
                repeatType: 'none',
            };
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const data = await req.json();
        const event: CalendarEvent = data.event;
        if (!event) return NextResponse.json({ error: "No event data" }, { status: 400 });

        const oauth2Client = await getAuthenticatedClient(session.user.id);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const gEvent: any = {
            summary: event.title,
            description: event.description,
            location: event.location,
            colorId: FRONTEND_COLOR_TO_GOOGLE[event.colorId] || '7',
        };

        if (event.allDay) {
            gEvent.start = { date: event.scheduledDate };
            if (event.endDate) {
                const endD = new Date(event.endDate);
                endD.setDate(endD.getDate() + 1);
                gEvent.end = { date: formatDate(endD) };
            } else {
                const endD = new Date(event.scheduledDate);
                endD.setDate(endD.getDate() + 1);
                gEvent.end = { date: formatDate(endD) };
            }
        } else {
            const startD = new Date(event.scheduledDate);
            const { hours: sh, minutes: sm } = parseTime(event.startTime);
            startD.setHours(sh, sm, 0, 0);
            gEvent.start = { dateTime: startD.toISOString(), timeZone: 'Asia/Seoul' };

            const endDString = event.endDate || event.scheduledDate;
            const endD = new Date(endDString);
            const { hours: eh, minutes: em } = parseTime(event.endTime || "23:59");
            endD.setHours(eh, em, 0, 0);
            
            // If the start and end time are the exact same, Google API might complain. Ensure end is after start.
            if (endD.getTime() <= startD.getTime()) {
                 endD.setTime(startD.getTime() + 60 * 60 * 1000); // add 1 hour
            }
            gEvent.end = { dateTime: endD.toISOString(), timeZone: 'Asia/Seoul' };
        }

        const res = await calendar.events.insert({
            calendarId: "primary",
            requestBody: gEvent,
        });

        return NextResponse.json({ success: true, googleEventId: res.data.id });
    } catch (error) {
        console.error("Error creating calendar event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const data = await req.json();
        const event: CalendarEvent = data.event;
        if (!event || !event.id) return NextResponse.json({ error: "No event data or id" }, { status: 400 });

        const oauth2Client = await getAuthenticatedClient(session.user.id);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const gEvent: any = {
            summary: event.title,
            description: event.description,
            location: event.location,
            colorId: FRONTEND_COLOR_TO_GOOGLE[event.colorId] || '7',
        };

        if (event.allDay) {
            gEvent.start = { date: event.scheduledDate };
            if (event.endDate) {
                const endD = new Date(event.endDate);
                endD.setDate(endD.getDate() + 1);
                gEvent.end = { date: formatDate(endD) };
            } else {
                const endD = new Date(event.scheduledDate);
                endD.setDate(endD.getDate() + 1);
                gEvent.end = { date: formatDate(endD) };
            }
        } else {
            const startD = new Date(event.scheduledDate);
            const { hours: sh, minutes: sm } = parseTime(event.startTime);
            startD.setHours(sh, sm, 0, 0);
            gEvent.start = { dateTime: startD.toISOString(), timeZone: 'Asia/Seoul' };

            const endDString = event.endDate || event.scheduledDate;
            const endD = new Date(endDString);
            const { hours: eh, minutes: em } = parseTime(event.endTime || "23:59");
            endD.setHours(eh, em, 0, 0);

            if (endD.getTime() <= startD.getTime()) {
                 endD.setTime(startD.getTime() + 60 * 60 * 1000); // add 1 hour
            }
            gEvent.end = { dateTime: endD.toISOString(), timeZone: 'Asia/Seoul' };
        }

        await calendar.events.patch({
            calendarId: "primary",
            eventId: event.id,
            requestBody: gEvent,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating calendar event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "No event id" }, { status: 400 });

        const oauth2Client = await getAuthenticatedClient(session.user.id);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        await calendar.events.delete({
            calendarId: "primary",
            eventId: id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
