import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function GET() {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user's account with the Google provider to extract the access token
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: "google",
            },
        });

        if (!account || !account.access_token) {
            return NextResponse.json({ error: "Google account not connected or access token missing" }, { status: 403 });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Fetch next 10 events
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        return NextResponse.json({ events: response.data.items });
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
