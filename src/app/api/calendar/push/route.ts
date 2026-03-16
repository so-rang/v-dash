import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: "google",
            },
        });

        if (!account || !account.access_token) {
            return NextResponse.json({ error: "Google account not connected or access token missing" }, { status: 403 });
        }

        const { title, description, startTime, endTime } = await req.json();

        if (!title || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const event = {
            summary: title,
            description: description || "",
            start: {
                dateTime: new Date(startTime).toISOString(),
            },
            end: {
                dateTime: new Date(endTime).toISOString(),
            },
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });

        return NextResponse.json({ success: true, event: response.data });
    } catch (error) {
        console.error("Error creating calendar event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
