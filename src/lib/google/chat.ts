/**
 * Google Chat API 래퍼
 * - 인터랙티브 카드 메시지 발송
 * - 승인/거절 버튼 포함
 */

import { google } from 'googleapis';
import { createOAuth2Client } from './token';

const chat = google.chat('v1');

/**
 * Template A: 09:50 정기 브리핑 카드 발송
 */
export async function sendBriefingCard(
    spaceId: string,
    data: {
        channelName: string;
        todayUploads: { title: string; stage: string }[];
        yesterdayPerformance?: { title: string; views: number };
        trendKeywords?: string[];
    }
) {
    const auth = createOAuth2Client();

    const sections = [];

    // D-Day 섹션
    if (data.todayUploads.length > 0) {
        sections.push({
            header: '📅 오늘 업로드 예정',
            widgets: data.todayUploads.map(u => ({
                decoratedText: {
                    text: u.title,
                    bottomLabel: u.stage,
                    startIcon: { knownIcon: 'VIDEO_CAMERA' },
                },
            })),
        });
    }

    // 어제 성과 섹션
    if (data.yesterdayPerformance) {
        sections.push({
            header: '📊 어제 성과',
            widgets: [
                {
                    decoratedText: {
                        text: data.yesterdayPerformance.title,
                        bottomLabel: `24시간 조회수: ${data.yesterdayPerformance.views.toLocaleString()}`,
                        startIcon: { knownIcon: 'STAR' },
                    },
                },
            ],
        });
    }

    // 트렌드 키워드
    if (data.trendKeywords && data.trendKeywords.length > 0) {
        sections.push({
            header: '🔥 트렌드 키워드',
            widgets: [
                {
                    textParagraph: {
                        text: data.trendKeywords.join(' · '),
                    },
                },
            ],
        });
    }

    const message = {
        cardsV2: [
            {
                cardId: 'briefing-card',
                card: {
                    header: {
                        title: `📅 ${data.channelName} 오늘의 제작 현황`,
                        subtitle: new Date().toLocaleDateString('ko-KR'),
                    },
                    sections,
                },
            },
        ],
    };

    const response = await chat.spaces.messages.create({
        auth,
        parent: spaceId,
        requestBody: message,
    });

    return response.data;
}

/**
 * Template B: Method A 업로드 승인 카드 발송
 */
export async function sendApprovalCard(
    spaceId: string,
    data: {
        fileName: string;
        fileExtension: string;
        matchedTitle: string;
        stageId: string;
        similarity: number;
    }
) {
    const auth = createOAuth2Client();

    const message = {
        cardsV2: [
            {
                cardId: `approval-${data.stageId}`,
                card: {
                    header: {
                        title: '🚀 영상 업로드 승인 요청',
                        subtitle: `매칭 유사도: ${Math.round(data.similarity * 100)}%`,
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        text: data.fileName,
                                        bottomLabel: `확장자: ${data.fileExtension}`,
                                        startIcon: { knownIcon: 'VIDEO_CAMERA' },
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: data.matchedTitle,
                                        bottomLabel: '매칭된 기획',
                                        startIcon: { knownIcon: 'DESCRIPTION' },
                                    },
                                },
                            ],
                        },
                        {
                            widgets: [
                                {
                                    buttonList: {
                                        buttons: [
                                            {
                                                text: '승인 및 유튜브 업로드',
                                                onClick: {
                                                    action: {
                                                        actionMethodName: 'approve_upload',
                                                        parameters: [
                                                            { key: 'stageId', value: data.stageId },
                                                            { key: 'fileName', value: data.fileName },
                                                        ],
                                                    },
                                                },
                                                color: {
                                                    red: 0.14,
                                                    green: 0.83,
                                                    blue: 0.75,
                                                    alpha: 1,
                                                },
                                            },
                                            {
                                                text: '대시보드에서 수정',
                                                onClick: {
                                                    action: {
                                                        actionMethodName: 'open_dashboard',
                                                        parameters: [
                                                            { key: 'stageId', value: data.stageId },
                                                        ],
                                                    },
                                                },
                                            },
                                            {
                                                text: '거절',
                                                onClick: {
                                                    action: {
                                                        actionMethodName: 'reject_upload',
                                                        parameters: [
                                                            { key: 'stageId', value: data.stageId },
                                                            { key: 'fileName', value: data.fileName },
                                                        ],
                                                    },
                                                },
                                                color: {
                                                    red: 0.94,
                                                    green: 0.27,
                                                    blue: 0.27,
                                                    alpha: 1,
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    };

    const response = await chat.spaces.messages.create({
        auth,
        parent: spaceId,
        requestBody: message,
    });

    return response.data;
}

/**
 * 에러 알림 발송 (지원되지 않는 포맷 등)
 */
export async function sendErrorNotification(
    spaceId: string,
    message: string
) {
    const auth = createOAuth2Client();

    const response = await chat.spaces.messages.create({
        auth,
        parent: spaceId,
        requestBody: {
            text: `⚠️ ${message}`,
        },
    });

    return response.data;
}
