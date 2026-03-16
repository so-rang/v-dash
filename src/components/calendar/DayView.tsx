'use client';

import { useCallback } from 'react';
import { useEventStore, getEventColor } from '@/store/event-store';
import type { CalendarEvent } from '@/types/stage';
import { Plus } from 'lucide-react';

interface DayViewProps {
    currentDate: Date;
    onEventClick: (event: CalendarEvent) => void;
    onCreateEvent: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function DayView({ currentDate, onEventClick, onCreateEvent }: DayViewProps) {
    const allEvents = useEventStore(s => s.events);
    const dateKey = toDateKey(currentDate);
    const dayEvents = allEvents.filter(e => {
        const start = e.scheduledDate;
        const end = e.endDate || e.scheduledDate;
        return dateKey >= start && dateKey <= end;
    });

    const allDayEvents = dayEvents.filter(e => e.allDay);
    
    // 시간 지정 일정 중 오늘에 해당하는 부분 계산
    const timedEvents = dayEvents.filter(e => !e.allDay && e.startTime).map(ev => {
        const isStartDay = ev.scheduledDate === dateKey;
        const isEndDay = (ev.endDate || ev.scheduledDate) === dateKey;
        
        let displayStart = ev.startTime!;
        let displayEnd = ev.endTime || '';

        // 시작일이 아니면 00:00부터 시작
        if (!isStartDay) displayStart = '00:00';
        // 종료일이 아니면 24:00까지 (실제로 23:59로 처리하거나 렌더링 시 끝까지 채움)
        if (!isEndDay) displayEnd = '23:59';

        return { ...ev, displayStart, displayEnd };
    });
    const todayKey = toDateKey(new Date());
    const isToday = dateKey === todayKey;

    const dateLabel = `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 ${WEEKDAY_NAMES[currentDate.getDay()]}`;

    return (
        <div className="day-view">
            {/* 날짜 헤더 */}
            <div className="day-view__header">
                <div className={`day-view__date-badge ${isToday ? 'day-view__date-badge--today' : ''}`}>
                    {currentDate.getDate()}
                </div>
                <div className="day-view__date-label">{dateLabel}</div>
            </div>

            {/* 종일 이벤트 */}
            {allDayEvents.length > 0 && (
                <div className="day-view__allday">
                    <span className="day-view__allday-label">종일</span>
                    <div className="day-view__allday-events">
                        {allDayEvents.map(ev => (
                            <div
                                key={ev.id}
                                className="day-view__allday-chip"
                                style={{ background: getEventColor(ev.colorId) }}
                                onClick={() => onEventClick(ev)}
                            >
                                {ev.title}
                                {ev.location && <span className="day-view__allday-loc"> · 📍 {ev.location}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 시간 그리드 */}
            <div className="day-view__body">
                <div className="day-view__grid">
                    {HOURS.map(h => (
                        <div key={h} className="day-view__row" onClick={() => onCreateEvent(currentDate)}>
                            <div className="day-view__time-label">
                                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                            </div>
                            <div className={`day-view__slot ${isToday ? 'day-view__slot--today' : ''}`} />
                        </div>
                    ))}

                    {/* 이벤트 블록 */}
                    {timedEvents.map(ev => {
                        const startMin = timeToMinutes(ev.displayStart);
                        const endMin = ev.displayEnd ? timeToMinutes(ev.displayEnd) : startMin + 60;
                        const duration = Math.max(endMin - startMin, 30);
                        const top = (startMin / (24 * 60)) * 100;
                        const height = (duration / (24 * 60)) * 100;
                        const color = getEventColor(ev.colorId);

                        return (
                            <div
                                key={ev.id}
                                className={`day-view__event ${ev.completed ? 'day-view__event--done' : ''}`}
                                style={{
                                    top: `${top}%`,
                                    height: `${height}%`,
                                    background: color,
                                }}
                                onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                            >
                                <div className="day-view__event-time">{ev.displayStart} – {ev.displayEnd}</div>
                                <div className="day-view__event-title">{ev.title}</div>
                                {ev.location && <div className="day-view__event-loc">📍 {ev.location}</div>}
                                {ev.attendees.length > 0 && (
                                    <div className="day-view__event-attendees">
                                        👥 {ev.attendees.map(a => a.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
