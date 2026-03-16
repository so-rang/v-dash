/**
 * Production Stages API Route
 * GET: 채널별 Stage 목록 조회 (channel_id 필터 필수)
 * POST: 새 Stage 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const channelId = request.nextUrl.searchParams.get('channelId');

    if (!channelId) {
        return NextResponse.json(
            { error: 'channelId is required' },
            { status: 400 }
        );
    }

    try {
        const stages = await prisma.productionStage.findMany({
            where: {
                channelId,
                deletedAt: null, // Soft Delete 적용
            },
            include: {
                details: true,
                owner: {
                    select: { id: true, displayName: true, avatarUrl: true },
                },
            },
            orderBy: { scheduledDate: 'asc' },
        });

        return NextResponse.json(stages);
    } catch (error) {
        console.error('[API] Stages list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stages' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { channelId, title, scheduledDate, ownerId } = body;

        if (!channelId || !title) {
            return NextResponse.json(
                { error: 'channelId and title are required' },
                { status: 400 }
            );
        }

        // Stage + StageDetail 트랜잭션으로 동시 생성
        const stage = await prisma.productionStage.create({
            data: {
                channelId,
                title,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                ownerId,
                details: {
                    create: {
                        tags: [],
                        methodAActive: false,
                    },
                },
            },
            include: { details: true },
        });

        return NextResponse.json(stage, { status: 201 });
    } catch (error) {
        console.error('[API] Stage create error:', error);
        return NextResponse.json(
            { error: 'Failed to create stage' },
            { status: 500 }
        );
    }
}
