import { create } from 'zustand';
import type { CalendarEvent, EventColorId } from '@/types/stage';
import { EVENT_COLORS } from '@/types/stage';

interface EventState {
    events: CalendarEvent[];
    deletedEvents: CalendarEvent[];
    setEvents: (events: CalendarEvent[]) => void;
    addEvent: (event: CalendarEvent) => void;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
    deleteEvent: (id: string) => void;
    restoreEvent: (id: string) => void;
    permanentDelete: (id: string) => void;
    getEventsForDate: (date: Date) => CalendarEvent[];
    searchEvents: (query: string) => CalendarEvent[];
    getGroups: () => { id: string; name: string }[];
}

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDemoEvents(): CalendarEvent[] {
    const today = new Date();
    const events: CalendarEvent[] = [];

    const demoData: {
        title: string; colorId: EventColorId; dayOffset: number; allDay: boolean;
        startTime?: string; endTime?: string; desc?: string; location?: string;
        attendees?: { name: string; email: string }[];
        groupId?: string; groupName?: string;
    }[] = [
            { title: '팀 회의', colorId: 'peacock', dayOffset: -2, allDay: false, startTime: '10:00', endTime: '11:00', desc: '주간 회의', location: '회의실 A', attendees: [{ name: '김소연', email: 'soyeon@company.com' }, { name: '이준혁', email: 'jun@company.com' }], groupId: 'grp-weekly', groupName: '주간 회의' },
            { title: '점심 약속', colorId: 'banana', dayOffset: -1, allDay: false, startTime: '12:00', endTime: '13:30', desc: '강남역', location: '강남역 2번 출구' },
            { title: '프로젝트 마감', colorId: 'tomato', dayOffset: 0, allDay: true, desc: '리포트 제출', groupId: 'grp-project', groupName: '프로젝트 X' },
            { title: '디자인 리뷰', colorId: 'lavender', dayOffset: 0, allDay: false, startTime: '14:00', endTime: '15:00', location: '디자인 스튜디오', attendees: [{ name: '박민수', email: 'minsu@company.com' }], groupId: 'grp-project', groupName: '프로젝트 X' },
            { title: '운동', colorId: 'sage', dayOffset: 1, allDay: false, startTime: '07:00', endTime: '08:00', desc: '필라테스', location: '필라테스 스튜디오' },
            { title: '생일 파티', colorId: 'flamingo', dayOffset: 2, allDay: false, startTime: '19:00', endTime: '22:00', location: '이태원 레스토랑', attendees: [{ name: '최수정', email: 'sj@mail.com' }] },
            { title: '휴가', colorId: 'basil', dayOffset: 3, allDay: true },
            { title: '치과 예약', colorId: 'grape', dayOffset: 4, allDay: false, startTime: '16:00', endTime: '17:00', location: '서울치과' },
            { title: '스터디', colorId: 'blueberry', dayOffset: 5, allDay: false, startTime: '20:00', endTime: '22:00', desc: '알고리즘 스터디', location: '카페 코딩', attendees: [{ name: '정다영', email: 'dy@mail.com' }, { name: '한재은', email: 'je@mail.com' }] },
            { title: '영화 관람', colorId: 'tangerine', dayOffset: -3, allDay: false, startTime: '18:00', endTime: '20:30', location: 'CGV 강남' },
            { title: '글쓰기', colorId: 'graphite', dayOffset: 6, allDay: false, startTime: '09:00', endTime: '10:30' },
            { title: '동창 모임', colorId: 'flamingo', dayOffset: 7, allDay: false, startTime: '18:00', endTime: '21:00', desc: '종각역', location: '종각 한식당' },
            { title: '코드 리뷰', colorId: 'peacock', dayOffset: -4, allDay: false, startTime: '11:00', endTime: '12:00', groupId: 'grp-project', groupName: '프로젝트 X' },
            { title: '기획 미팅', colorId: 'banana', dayOffset: 1, allDay: false, startTime: '15:00', endTime: '16:00', location: '회의실 B', attendees: [{ name: '김소연', email: 'soyeon@company.com' }], groupId: 'grp-project', groupName: '프로젝트 X' },
            { title: '팀 회의', colorId: 'peacock', dayOffset: 5, allDay: false, startTime: '10:00', endTime: '11:00', desc: '주간 회의', location: '회의실 A', groupId: 'grp-weekly', groupName: '주간 회의' },
        ];

    demoData.forEach((item, idx) => {
        const date = new Date(today);
        date.setDate(today.getDate() + item.dayOffset);
        const dateStr = toDateKey(date);

        // endDate: 종일 + 3일 이상 offset 차이나는 이벤트에 다일 범위 설정
        let endDateStr: string | null = null;
        if (item.allDay && item.dayOffset >= 3) {
            const endD = new Date(today);
            endD.setDate(today.getDate() + item.dayOffset + 2);
            endDateStr = toDateKey(endD);
        }

        events.push({
            id: `event-${idx}`,
            title: item.title,
            description: item.desc || '',
            scheduledDate: dateStr,
            endDate: endDateStr,
            startTime: item.startTime || null,
            endTime: item.endTime || null,
            allDay: item.allDay,
            colorId: item.colorId,
            completed: false,
            deletedAt: null,
            createdAt: new Date().toISOString(),
            location: item.location || '',
            attendees: (item.attendees || []).map(a => ({ ...a, status: 'accepted' as const })),
            groupId: item.groupId || null,
            groupName: item.groupName || null,
            attachments: [],
            repeatType: 'none',
        });
    });

    return events;
}

export const useEventStore = create<EventState>((set, get) => ({
    events: [],
    deletedEvents: [],

    setEvents: (events) => set({ events }),

    addEvent: (event) => set(state => ({
        events: [...state.events, event],
    })),

    updateEvent: (id, updates) => set(state => ({
        events: state.events.map(e =>
            e.id === id ? { ...e, ...updates } : e
        ),
    })),

    deleteEvent: (id) => set(state => {
        const event = state.events.find(e => e.id === id);
        if (!event) return state;
        return {
            events: state.events.filter(e => e.id !== id),
            deletedEvents: [...state.deletedEvents, {
                ...event,
                deletedAt: new Date().toISOString(),
            }],
        };
    }),

    restoreEvent: (id) => set(state => {
        const event = state.deletedEvents.find(e => e.id === id);
        if (!event) return state;
        return {
            deletedEvents: state.deletedEvents.filter(e => e.id !== id),
            events: [...state.events, { ...event, deletedAt: null }],
        };
    }),

    permanentDelete: (id) => set(state => ({
        deletedEvents: state.deletedEvents.filter(e => e.id !== id),
    })),

    getEventsForDate: (date) => {
        const { events } = get();
        const dateStr = toDateKey(date);
        return events.filter(e => {
            if (e.endDate) {
                // 범위 이벤트: scheduledDate <= date <= endDate
                return dateStr >= e.scheduledDate && dateStr <= e.endDate;
            }
            return e.scheduledDate === dateStr;
        });
    },

    searchEvents: (query) => {
        const { events } = get();
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return events.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q) ||
            e.attendees.some(a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) ||
            (e.groupName && e.groupName.toLowerCase().includes(q))
        );
    },

    getGroups: () => {
        const { events } = get();
        const groupMap = new Map<string, string>();
        for (const e of events) {
            if (e.groupId && e.groupName) {
                groupMap.set(e.groupId, e.groupName);
            }
        }
        return Array.from(groupMap.entries()).map(([id, name]) => ({ id, name }));
    },
}));

// 초기화 함수
export function initDemoEvents() {
    const existing = useEventStore.getState().events;
    if (existing.length > 0) return;
    useEventStore.getState().setEvents(generateDemoEvents());
}

// 색상 헬퍼
export function getEventColor(colorId: EventColorId): string {
    const color = EVENT_COLORS.find(c => c.id === colorId);
    return color?.hex || '#039BE5';
}
