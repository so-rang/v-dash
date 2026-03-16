/**
 * Drive Watch API Route
 * Google Drive 파일 감지 + Method A 매칭 트리거
 *
 * POST: 폴링 방식으로 새 파일 감지 및 매칭 시도
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { matchFileToStage } from '@/lib/agent/matcher';
import { isAllowedExtension } from '@/lib/utils/similarity';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { channelId, files } = body as {
            channelId: string;
            files: { name: string; id: string; mimeType: string }[];
        };

        const results = [];

        for (const file of files) {
            // 확장자 체크
            if (!isAllowedExtension(file.name)) {
                results.push({
                    file: file.name,
                    action: 'UNSUPPORTED_FORMAT',
                    message: '지원되지 않는 영상 포맷이 감지되었습니다',
                });

                // 채팅 알림은 실제로 sendErrorNotification 호출
                continue;
            }

            // DB에서 해당 채널의 UPLOAD_READY 상태 Stage 조회
            const candidates = await prisma.productionStage.findMany({
                where: {
                    channelId,
                    currentTab: 'UPLOAD',
                    vividStatus: false,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    title: true,
                    scheduledDate: true,
                    channelId: true,
                },
            });

            const matchResult = matchFileToStage(
                file.name,
                candidates.map((c: { id: string; title: string; scheduledDate: Date | null; channelId: string }) => ({
                    stageId: c.id,
                    title: c.title,
                    scheduledDate: c.scheduledDate?.toISOString() || null,
                    channelId: c.channelId,
                }))
            );

            if (matchResult.matched && matchResult.stageId) {
                // 매칭 성공 → Stage 업데이트 + 승인 카드 발송 준비
                await prisma.stageDetail.updateMany({
                    where: {
                        stage: { id: matchResult.stageId },
                    },
                    data: {
                        detectedFileName: file.name,
                        fileExtension: matchResult.fileExtension,
                        methodAActive: true,
                    },
                });

                results.push({
                    file: file.name,
                    action: 'MATCHED',
                    stageId: matchResult.stageId,
                    similarity: matchResult.similarity,
                    message: `매칭 성공 (유사도: ${Math.round(matchResult.similarity * 100)}%)`,
                });

                // 실제로는 sendApprovalCard 호출
            } else {
                results.push({
                    file: file.name,
                    action: matchResult.errorCode || 'NO_MATCH',
                    similarity: matchResult.similarity,
                    message: '매칭되는 기획이 없습니다',
                });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[DRIVE WATCH] Error:', error);
        return NextResponse.json(
            { error: 'Drive watch processing failed' },
            { status: 500 }
        );
    }
}
