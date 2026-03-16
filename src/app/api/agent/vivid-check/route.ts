/**
 * Vivid Check API Route
 * YouTube API로 영상 공개 상태를 폴링하여 Vivid 전환 실행
 *
 * POST: 특정 Stage의 YouTube 영상 공개 여부 체크
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { stageId } = body as { stageId: string };

        const stage = await prisma.productionStage.findUnique({
            where: { id: stageId },
            include: { channel: true },
        });

        if (!stage || !stage.youtubeVideoId) {
            return NextResponse.json(
                { error: 'Stage not found or no YouTube video linked' },
                { status: 404 }
            );
        }

        // YouTube API로 공개 상태 체크
        // 실제로는 checkVideoPublicStatus(stage.youtubeVideoId) 호출
        // 여기서는 로직 구조만 구현

        const isPublic = true; // 시뮬레이션
        const hasThumbnails = true;
        const shouldVivid = isPublic && hasThumbnails;

        if (shouldVivid && !stage.vividStatus) {
            // Vivid 전환: 모든 관련 Stage의 vivid_status 업데이트
            await prisma.productionStage.update({
                where: { id: stageId },
                data: { vividStatus: true },
            });

            return NextResponse.json({
                action: 'VIVID_TRANSITION',
                stageId,
                message: '비비드 전환 완료! 🎉',
                vividStatus: true,
            });
        }

        return NextResponse.json({
            action: 'NO_CHANGE',
            stageId,
            isPublic,
            hasThumbnails,
            vividStatus: stage.vividStatus,
        });
    } catch (error) {
        console.error('[VIVID CHECK] Error:', error);
        return NextResponse.json(
            { error: 'Vivid check failed' },
            { status: 500 }
        );
    }
}
