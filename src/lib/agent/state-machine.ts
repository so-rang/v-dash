/**
 * 상태 머신 (State Machine)
 * YouTube/Drive/Calendar/Chat 간 API 오케스트레이션
 *
 * 상태 흐름:
 * DRAFT → PLANNING → PRODUCTION → UPLOAD_READY → UPLOADING → PUBLISHED
 */

export type StageState =
    | 'DRAFT'
    | 'PLANNING'
    | 'PRODUCTION'
    | 'UPLOAD_READY'
    | 'UPLOADING'
    | 'PUBLISHED';

export interface StateTransition {
    from: StageState;
    to: StageState;
    action: string;
    sideEffects: SideEffect[];
}

export type SideEffect =
    | { type: 'CALENDAR_CREATE'; payload: { title: string; date: string; colorId: string } }
    | { type: 'CALENDAR_UPDATE'; payload: { eventId: string; colorId: string } }
    | { type: 'CHAT_NOTIFY'; payload: { template: 'briefing' | 'approval' | 'error'; data: Record<string, string> } }
    | { type: 'YOUTUBE_UPLOAD'; payload: { fileId: string; title: string; description: string } }
    | { type: 'VIVID_TRANSITION'; payload: { stageId: string } }
    | { type: 'DRIVE_MOVE'; payload: { fileId: string; targetFolder: string } };

// 유효 전이 맵
const VALID_TRANSITIONS: Record<StageState, StageState[]> = {
    DRAFT: ['PLANNING'],
    PLANNING: ['PRODUCTION'],
    PRODUCTION: ['UPLOAD_READY'],
    UPLOAD_READY: ['UPLOADING'],
    UPLOADING: ['PUBLISHED', 'UPLOAD_READY'], // 실패 시 롤백
    PUBLISHED: [], // 최종 상태
};

/**
 * 상태 전이 가능 여부 검증
 */
export function canTransition(from: StageState, to: StageState): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 상태 전이 실행 + 사이드 이펙트 목록 반환
 */
export function executeTransition(
    from: StageState,
    to: StageState,
    context: {
        stageId: string;
        title: string;
        scheduledDate?: string;
        fileId?: string;
        description?: string;
    }
): StateTransition {
    if (!canTransition(from, to)) {
        throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    const sideEffects: SideEffect[] = [];

    switch (to) {
        case 'PLANNING':
            // 기획 시작 → 캘린더 등록 (파스텔)
            if (context.scheduledDate) {
                sideEffects.push({
                    type: 'CALENDAR_CREATE',
                    payload: {
                        title: context.title,
                        date: context.scheduledDate,
                        colorId: '9', // 파스텔 블루베리
                    },
                });
            }
            break;

        case 'PRODUCTION':
            // 촬영 전환 → 담당자 알림
            sideEffects.push({
                type: 'CHAT_NOTIFY',
                payload: {
                    template: 'briefing',
                    data: {
                        title: context.title,
                        stage: '촬영/편집',
                    },
                },
            });
            break;

        case 'UPLOAD_READY':
            // 업로드 대기 → 채팅 알림
            sideEffects.push({
                type: 'CHAT_NOTIFY',
                payload: {
                    template: 'briefing',
                    data: {
                        title: context.title,
                        stage: '업로드 대기',
                    },
                },
            });
            break;

        case 'UPLOADING':
            // 유튜브 업로드 시작
            if (context.fileId) {
                sideEffects.push({
                    type: 'YOUTUBE_UPLOAD',
                    payload: {
                        fileId: context.fileId,
                        title: context.title,
                        description: context.description || '',
                    },
                });
            }
            break;

        case 'PUBLISHED':
            // 공개 완료 → 전체 비비드 전환
            sideEffects.push({
                type: 'VIVID_TRANSITION',
                payload: { stageId: context.stageId },
            });
            sideEffects.push({
                type: 'CHAT_NOTIFY',
                payload: {
                    template: 'briefing',
                    data: {
                        title: context.title,
                        stage: '공개 완료 ✨',
                    },
                },
            });
            break;
    }

    return {
        from,
        to,
        action: `${from} → ${to}`,
        sideEffects,
    };
}

/**
 * 탭(Tab)에서 상태(State)로 매핑
 */
export function tabToState(
    tab: 'PLANNING' | 'PRODUCTION' | 'UPLOAD',
    vividStatus: boolean
): StageState {
    if (vividStatus) return 'PUBLISHED';

    switch (tab) {
        case 'PLANNING':
            return 'PLANNING';
        case 'PRODUCTION':
            return 'PRODUCTION';
        case 'UPLOAD':
            return 'UPLOAD_READY';
    }
}
