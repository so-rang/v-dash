/**
 * Channels API Route
 * GET: 채널 목록 조회
 * POST: 새 채널 등록
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const channels = await prisma.channel.findMany({
            include: {
                members: {
                    include: { user: true },
                },
                _count: {
                    select: { productionStages: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(channels);
    } catch (error) {
        console.error('[API] Channel list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { youtubeChannelId, displayName, profileImageUrl, driveRootPath } = body;

        const channel = await prisma.channel.create({
            data: {
                youtubeChannelId,
                displayName,
                profileImageUrl,
                driveRootPath,
                personaConfig: {},
            },
        });

        return NextResponse.json(channel, { status: 201 });
    } catch (error) {
        console.error('[API] Channel create error:', error);
        return NextResponse.json(
            { error: 'Failed to create channel' },
            { status: 500 }
        );
    }
}
