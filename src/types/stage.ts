// 일정 색상 프리셋 (구글 캘린더 스타일)
export const EVENT_COLORS = [
    { id: 'tomato', hex: '#D50000', label: '토마토' },
    { id: 'flamingo', hex: '#E67C73', label: '플라밍고' },
    { id: 'tangerine', hex: '#F4511E', label: '귤' },
    { id: 'banana', hex: '#F6BF26', label: '바나나' },
    { id: 'sage', hex: '#33B679', label: '세이지' },
    { id: 'basil', hex: '#0B8043', label: '바질' },
    { id: 'peacock', hex: '#039BE5', label: '피콕' },
    { id: 'blueberry', hex: '#3F51B5', label: '블루베리' },
    { id: 'lavender', hex: '#7986CB', label: '라벤더' },
    { id: 'grape', hex: '#8E24AA', label: '포도' },
    { id: 'graphite', hex: '#616161', label: '그래파이트' },
] as const;

export type EventColorId = typeof EVENT_COLORS[number]['id'];

export type ViewMode = 'month' | 'week' | 'day';

export interface Attendee {
    name: string;
    email: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
}

export interface Attachment {
    name: string;
    url: string;
    type: string;  // MIME type
    size: number;   // bytes
}

export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    scheduledDate: string;          // YYYY-MM-DD (시작일)
    endDate: string | null;         // YYYY-MM-DD (종료일, null이면 단일 날짜)
    startTime: string | null;       // HH:mm (null이면 종일)
    endTime: string | null;         // HH:mm (null이면 종일)
    allDay: boolean;
    colorId: EventColorId;
    completed: boolean;
    deletedAt: string | null;
    createdAt: string;
    // 위치 (구글 지도 연동용)
    location: string;
    // 참석자 (구글 캘린더 연동용)
    attendees: Attendee[];
    // 일정 그룹
    groupId: string | null;
    groupName: string | null;
    // 첨부파일
    attachments: Attachment[];
    // 반복
    repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}
