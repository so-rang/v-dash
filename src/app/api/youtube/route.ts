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

        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        // Fetch the authenticated user's YouTube channel(s)
        const response = await youtube.channels.list({
            part: ["snippet", "statistics"],
            mine: true,
        });

        return NextResponse.json({ success: true, channels: response.data.items || [] });
    } catch (error) {
        console.error("Error fetching youtube channels:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
