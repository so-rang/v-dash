/**
 * Google Chat Webhook Handler
 * 인터랙티브 카드 메시지의 버튼 클릭 이벤트를 수신하여 처리
 *
 * Actions:
 * - approve_upload: 유튜브 업로드 트리거
 * - reject_upload: 파일을 보류 폴더로 이동
 * - open_dashboard: 대시보드 딥링크 반환
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ChatInteractiveEvent } from '@/types/google';

export async function POST(request: Request) {
    try {
        const event: ChatInteractiveEvent = await request.json();

        if (event.type !== 'CARD_CLICKED') {
            return NextResponse.json({ text: '지원되지 않는 이벤트 타입입니다.' });
        }

        const { actionMethodName, parameters } = event.action;
        const paramMap = Object.fromEntries(
            parameters.map(p => [p.key, p.value])
        );

        switch (actionMethodName) {
            case 'approve_upload': {
                const { stageId } = paramMap;

                // 1. Stage 상태를 UPLOADING으로 변경
                await prisma.productionStage.update({
                    where: { id: stageId },
                    data: { currentTab: 'UPLOAD' },
                });

                // 2. YouTube 업로드 트리거 (비동기)
                // 실제 구현에서는 여기서 youtube upload API를 호출
                // await triggerYouTubeUpload(stageId);

                return NextResponse.json({
                    actionResponse: {
                        type: 'UPDATE_MESSAGE',
                    },
                    cardsV2: [
                        {
                            cardId: 'approved',
                            card: {
                                header: {
                                    title: '✅ 업로드 승인 완료',
                                    subtitle: `승인자: ${event.user.displayName}`,
                                },
                                sections: [
                                    {
                                        widgets: [
                                            {
                                                textParagraph: {
                                                    text: `파일 <b>${paramMap.fileName}</b>의 유튜브 업로드가 시작되었습니다.`,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                });
            }

            case 'reject_upload': {
                const { stageId, fileName } = paramMap;

                // Stage의 Method A 비활성화
                const stage = await prisma.productionStage.findUnique({
                    where: { id: stageId },
                    include: { details: true },
                });

                if (stage?.details) {
                    await prisma.stageDetail.update({
                        where: { id: stage.details.id },
                        data: {
                            methodAActive: false,
                            detectedFileName: null,
                        },
                    });
                }

                // 파일을 보류 폴더로 이동
                // await moveFile(fileId, currentParent, holdFolderId);

                return NextResponse.json({
                    actionResponse: {
                        type: 'UPDATE_MESSAGE',
                    },
                    cardsV2: [
                        {
                            cardId: 'rejected',
                            card: {
                                header: {
                                    title: '❌ 업로드 거절',
                                    subtitle: `거절자: ${event.user.displayName}`,
                                },
                                sections: [
                                    {
                                        widgets: [
                                            {
                                                textParagraph: {
                                                    text: `파일 <b>${fileName}</b>이(가) 보류 폴더로 이동되었습니다.`,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                });
            }

            case 'open_dashboard': {
                const { stageId } = paramMap;
                const dashboardUrl = `${process.env.NEXTAUTH_URL}/?stageId=${stageId}`;

                return NextResponse.json({
                    actionResponse: {
                        type: 'NEW_MESSAGE',
                    },
                    text: `📋 대시보드에서 확인하세요: ${dashboardUrl}`,
                });
            }

            default:
                return NextResponse.json({ text: '알 수 없는 액션입니다.' });
        }
    } catch (error) {
        console.error('[CHAT WEBHOOK] Error:', error);
        return NextResponse.json(
            { text: '처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
