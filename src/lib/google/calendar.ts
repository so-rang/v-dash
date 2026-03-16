/**
 * Google Calendar API 래퍼
 * - 일정 생성/수정/삭제
 * - Pastel → Vivid 색상 전환
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from './token';

const calendar = google.calendar('v3');

// Google Calendar 색상 ID 매핑
const COLOR_MAP = {
    PASTEL_PLAN: '9',       // 블루베리 (파스텔 기획)
    PASTEL_PRODUCTION: '5', // 바나나 (파스텔 촬영)
    PASTEL_UPLOAD: '2',     // 세이지 (파스텔 업로드)
    VIVID: '11',            // 토마토 (비비드 공통 - 가장 눈에 띄는 색)
};

/**
 * 카렌더에 제작 일정 생성 (파스텔 상태)
 */
export async function createProductionEvent(
    userId: string,
    calendarId: string,
    data: {
        title: string;
        date: string;
        stage: 'PLANNING' | 'PRODUCTION' | 'UPLOAD';
        description?: string;
    }
) {
    const auth = await getAuthenticatedClient(userId);

    const colorKey = `PASTEL_${data.stage === 'PLANNING' ? 'PLAN' : data.stage}` as keyof typeof COLOR_MAP;

    const event = {
        summary: `[${data.stage}] ${data.title}`,
        description: data.description || `V-Dash 제작 일정 / 단계: ${data.stage}`,
        start: {
            dateTime: new Date(data.date).toISOString(),
            timeZone: 'Asia/Seoul',
        },
        end: {
            dateTime: new Date(new Date(data.date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
            timeZone: 'Asia/Seoul',
        },
        colorId: COLOR_MAP[colorKey],
    };

    const response = await calendar.events.insert({
        auth,
        calendarId,
        requestBody: event,
    });

    return response.data;
}

/**
 * 캘린더 이벤트를 비비드(Vivid)로 전환
 */
export async function setEventVivid(userId: string, calendarId: string, eventId: string) {
    const auth = await getAuthenticatedClient(userId);

    const response = await calendar.events.patch({
        auth,
        calendarId,
        eventId,
        requestBody: {
            colorId: COLOR_MAP.VIVID,
        },
    });

    return response.data;
}

/**
 * 캘린더 이벤트 날짜 이동
 */
export async function moveEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    newDate: string
) {
    const auth = await getAuthenticatedClient(userId);

    const response = await calendar.events.patch({
        auth,
        calendarId,
        eventId,
        requestBody: {
            start: {
                dateTime: new Date(newDate).toISOString(),
                timeZone: 'Asia/Seoul',
            },
            end: {
                dateTime: new Date(
                    new Date(newDate).getTime() + 2 * 60 * 60 * 1000
                ).toISOString(),
                timeZone: 'Asia/Seoul',
            },
        },
    });

    return response.data;
}

/**
 * 캘린더 이벤트 삭제
 */
export async function deleteEvent(userId: string, calendarId: string, eventId: string) {
    const auth = await getAuthenticatedClient(userId);
    
    await calendar.events.delete({
        auth,
        calendarId,
        eventId,
    });
    
    return true;
}
