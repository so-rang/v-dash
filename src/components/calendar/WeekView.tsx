'use client';

import { useCallback } from 'react';
import { useEventStore, getEventColor } from '@/store/event-store';
import type { CalendarEvent } from '@/types/stage';
import { Plus } from 'lucide-react';

interface WeekViewProps {
    currentDate: Date;
    onEventClick: (event: CalendarEvent) => void;
    onCreateEvent: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDates(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

export default function WeekView({ currentDate, onEventClick, onCreateEvent }: WeekViewProps) {
    const allEvents = useEventStore(s => s.events);
    const deleteEvent = useEventStore(s => s.deleteEvent);
    const weekDates = getWeekDates(currentDate);
    const todayKey = toDateKey(new Date());

    const getEventsForDate = useCallback(
        (date: Date) => {
            const key = toDateKey(date);
            return allEvents.filter(e => e.scheduledDate === key);
        },
        [allEvents]
    );

    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="week-view">
            {/* 종일 이벤트 영역 */}
            <div className="week-view__allday-row">
                <div className="week-view__time-gutter week-view__time-gutter--allday">종일</div>
                {weekDates.map((date, i) => {
                    const dayEvents = getEventsForDate(date).filter(e => e.allDay);
                    return (
                        <div key={i} className={`week-view__allday-cell ${toDateKey(date) === todayKey ? 'week-view__allday-cell--today' : ''}`} onClick={() => onCreateEvent(date)}>
                            {dayEvents.map(ev => (
                                <div
                                    key={ev.id}
                                    className="week-view__allday-chip"
                                    style={{ background: getEventColor(ev.colorId) }}
                                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                                >
                                    {ev.title}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* 시간 그리드 */}
            <div className="week-view__body">
                <div className="week-view__grid">
                    {/* 시간 라벨 */}
                    {HOURS.map(h => (
                        <div key={h} className="week-view__time-gutter" style={{ gridRow: h + 1 }}>
                            {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                        </div>
                    ))}

                    {/* 7일 칼럼 */}
                    {weekDates.map((date, colIdx) => {
                        const dayEvents = getEventsForDate(date).filter(e => !e.allDay && e.startTime);
                        const isToday = toDateKey(date) === todayKey;

                        return HOURS.map(h => (
                            <div
                                key={`${colIdx}-${h}`}
                                className={`week-view__cell ${isToday ? 'week-view__cell--today' : ''}`}
                                style={{ gridColumn: colIdx + 2, gridRow: h + 1 }}
                                onClick={() => onCreateEvent(date)}
                            />
                        )).concat(
                            dayEvents.map(ev => {
                                const startMin = timeToMinutes(ev.startTime!);
                                const endMin = ev.endTime ? timeToMinutes(ev.endTime) : startMin + 60;
                                const topPct = (startMin / 60);
                                const heightPct = Math.max((endMin - startMin) / 60, 0.5);
                                const color = getEventColor(ev.colorId);

                                return (
                                    <div
                                        key={ev.id}
                                        className={`week-view__event ${ev.completed ? 'week-view__event--done' : ''}`}
                                        style={{
                                            gridColumn: colIdx + 2,
                                            gridRow: `${Math.floor(topPct) + 1} / span ${Math.max(Math.ceil(heightPct), 1)}`,
                                            background: color,
                                            marginTop: `${(startMin % 60) / 60 * 100}%`,
                                            zIndex: 2,
                                        }}
                                        onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                                    >
                                        <span className="week-view__event-time">{ev.startTime}</span>
                                        <span className="week-view__event-title">{ev.title}</span>
                                        {ev.location && <span className="week-view__event-loc">📍 {ev.location}</span>}
                                    </div>
                                );
                            })
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
