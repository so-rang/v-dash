import { create } from 'zustand';
import type { CalendarEvent, EventColorId } from '@/types/stage';
import { EVENT_COLORS } from '@/types/stage';

interface EventState {
    events: CalendarEvent[];
    deletedEvents: CalendarEvent[];
    isLoading: boolean;
    setEvents: (events: CalendarEvent[]) => void;
    fetchEvents: () => Promise<void>;
    addEvent: (event: CalendarEvent) => Promise<void>;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    restoreEvent: (id: string) => void;
    permanentDelete: (id: string) => void;
    getEventsForDate: (date: Date) => CalendarEvent[];
    searchEvents: (query: string) => CalendarEvent[];
    getGroups: () => { id: string; name: string }[];
}

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useEventStore = create<EventState>((set, get) => ({
    events: [],
    deletedEvents: [],
    isLoading: false,

    setEvents: (events) => set({ events }),

    fetchEvents: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/calendar');
            if (res.ok) {
                const data = await res.json();
                if (data.events) {
                    set({ events: data.events });
                }
            }
            // 401/403은 로그인 안 된 상태이므로 무시
        } catch (error) {
            console.warn('[Calendar] API 연결 실패, 오프라인 모드로 동작합니다.', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addEvent: async (event) => {
        // Optimistic Update
        set(state => ({
            events: [...state.events, event],
        }));

        try {
            const res = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.googleEventId) {
                    set(state => ({
                        events: state.events.map(e => e.id === event.id ? { ...e, id: data.googleEventId } : e)
                    }));
                }
            }
            // 401/403은 로그인 안 된 상태이므로 무시 (로컬에서만 동작)
        } catch (error) {
            console.warn('[Calendar] 이벤트 동기화 실패:', error);
        }
    },

    updateEvent: async (id, updates) => {
        // Optimistic Update
        set(state => ({
            events: state.events.map(e =>
                e.id === id ? { ...e, ...updates } : e
            ),
        }));

        const updatedEvent = get().events.find(e => e.id === id);
        if (updatedEvent) {
            try {
                const res = await fetch('/api/calendar', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: updatedEvent }),
                });
                if (!res.ok && res.status !== 401 && res.status !== 403) {
                    console.warn('[Calendar] 이벤트 수정 동기화 실패');
                }
            } catch (error) {
                console.warn('[Calendar] 이벤트 수정 동기화 실패:', error);
            }
        }
    },

    deleteEvent: async (id) => {
        const state = get();
        const event = state.events.find(e => e.id === id);
        if (!event) return;

        // Optimistic Update
        set({
            events: state.events.filter(e => e.id !== id),
            deletedEvents: [...state.deletedEvents, {
                ...event,
                deletedAt: new Date().toISOString(),
            }],
        });

        try {
            const res = await fetch(`/api/calendar?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 401 && res.status !== 403) {
                console.warn('[Calendar] 이벤트 삭제 동기화 실패');
            }
        } catch (error) {
            console.warn('[Calendar] 이벤트 삭제 동기화 실패:', error);
        }
    },

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

// 초기화 함수 - 데모 이벤트 대신 실제 API에서 가져옵니다.
export function initDemoEvents() {
    const { events, fetchEvents } = useEventStore.getState();
    if (events.length === 0) {
        fetchEvents();
    }
}

// 색상 헬퍼
export function getEventColor(colorId: EventColorId): string {
    const color = EVENT_COLORS.find(c => c.id === colorId);
    return color?.hex || '#039BE5';
}
