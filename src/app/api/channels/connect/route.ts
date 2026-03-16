/**
 * YouTube 채널 연결 API
 * - 채널 핸들/URL로 채널 정보 조회
 * - OAuth 인증 후 실제 YouTube Data API 호출
 * - 데모 모드에서는 핸들만 저장
 */

import { NextRequest, NextResponse } from 'next/server';

// YouTube 핸들에서 채널 ID 추출 시도
function extractHandle(input: string): string {
    // @handle 형태
    if (input.startsWith('@')) return input;

    // URL 형태
    try {
        const url = new URL(input);
        const pathname = url.pathname;
        // /@handle
        if (pathname.startsWith('/@')) {
            return pathname.slice(1); // @handle
        }
        // /channel/UC...
        if (pathname.startsWith('/channel/')) {
            return pathname.replace('/channel/', '');
        }
        // /c/customName
        if (pathname.startsWith('/c/')) {
            return '@' + pathname.replace('/c/', '');
        }
    } catch {
        // URL이 아닌 경우 그대로 반환
    }

    return input;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { channelInput, channelId } = body;

        if (!channelInput || !channelId) {
            return NextResponse.json(
                { error: '채널 입력값과 채널 ID가 필요합니다' },
                { status: 400 }
            );
        }

        const handle = extractHandle(channelInput);

        // TODO: Google OAuth 인증 후 실제 YouTube Data API 호출
        // const youtube = google.youtube('v3');
        // const response = await youtube.channels.list({
        //     auth,
        //     part: ['snippet', 'statistics'],
        //     forHandle: handle.replace('@', ''),
        // });

        // 데모 모드: 핸들만 저장
        return NextResponse.json({
            success: true,
            channel: {
                handle,
                displayName: handle.replace('@', ''),
                note: 'OAuth 인증 후 실제 YouTube Data API로 연동됩니다.',
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `채널 연결 실패: ${message}` },
            { status: 500 }
        );
    }
}
