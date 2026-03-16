'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useEventStore, getEventColor, initDemoEvents } from '@/store/event-store';
import type { CalendarEvent, ViewMode } from '@/types/stage';
import EventBar from './EventBar';
import WeekView from './WeekView';
import DayView from './DayView';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';

// 초기화
if (typeof window !== 'undefined') {
    initDemoEvents();
}

// 한국 공휴일 (2026)
const KOREAN_HOLIDAYS: Record<string, string> = {
    '2026-01-01': '신정',
    '2026-01-28': '설날 연휴',
    '2026-01-29': '설날',
    '2026-01-30': '설날 연휴',
    '2026-03-01': '삼일절',
    '2026-05-05': '어린이날',
    '2026-05-24': '부처님오신날',
    '2026-06-06': '현충일',
    '2026-08-15': '광복절',
    '2026-09-24': '추석 연휴',
    '2026-09-25': '추석',
    '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절',
    '2026-10-09': '한글날',
    '2026-12-25': '크리스마스',
};

function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MAX_VISIBLE_BARS = 3;

interface CalendarGridProps {
    onEventClick: (event: CalendarEvent) => void;
    onCreateEvent: (date: Date) => void;
}

export default function CalendarGrid({ onEventClick, onCreateEvent }: CalendarGridProps) {
    const allEvents = useEventStore(s => s.events);
    const deleteEvent = useEventStore(s => s.deleteEvent);
    const searchEvents = useEventStore(s => s.searchEvents);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [overflowPopover, setOverflowPopover] = useState<{ dateKey: string; events: CalendarEvent[] } | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const calendarRef = useRef<HTMLDivElement>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 월간 뷰 계산
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const lastDay = new Date(year, month + 1, 0);
    const lastDayOfWeek = lastDay.getDay();
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek));

    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const weekCount = Math.ceil(totalDays / 7);

    const days: Date[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < weekCount * 7; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const todayDate = new Date();
    const isToday = (d: Date) =>
        d.getDate() === todayDate.getDate() &&
        d.getMonth() === todayDate.getMonth() &&
        d.getFullYear() === todayDate.getFullYear();



    const navigate = (delta: number) => {
        const d = new Date(currentDate);
        if (viewMode === 'month') {
            d.setMonth(d.getMonth() + delta);
        } else if (viewMode === 'week') {
            d.setDate(d.getDate() + delta * 7);
        } else {
            d.setDate(d.getDate() + delta);
        }
        setCurrentDate(d);
    };

    const wheelAccum = useRef(0);
    const handleWheel = useCallback((e: React.WheelEvent) => {
        wheelAccum.current += e.deltaY;
        if (Math.abs(wheelAccum.current) > 300) {
            navigate(wheelAccum.current > 0 ? 1 : -1);
            wheelAccum.current = 0;
        }
    }, [currentDate, viewMode]);

    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    // 레인(lane) 계산: 여러 날 일정의 시각적 연속성을 위해
    const eventsWithLanes = useMemo(() => {
        // 표시되는 날짜 범위 내의 모든 일정 필터링
        const rangeStart = days[0];
        const rangeEnd = days[days.length - 1];
        if (!rangeStart || !rangeEnd) return [];

        const rangeStartKey = toDateKey(rangeStart);
        const rangeEndKey = toDateKey(rangeEnd);

        const filtered = allEvents.filter(e => {
            const start = e.scheduledDate;
            const end = e.endDate || e.scheduledDate;
            return (start <= rangeEndKey && end >= rangeStartKey);
        });

        // 정렬: 기간이 긴 순서 > 시작일 빠른 순서 > 제목 순
        const getDuration = (e: CalendarEvent) => {
            if (!e.endDate) return 1;
            const d1 = new Date(e.scheduledDate);
            const d2 = new Date(e.endDate);
            return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        };

        const sorted = [...filtered].sort((a, b) => {
            const durA = getDuration(a);
            const durB = getDuration(b);
            if (durB !== durA) return durB - durA;
            return a.scheduledDate.localeCompare(b.scheduledDate);
        });

        const lanes: (CalendarEvent & { lane: number })[] = [];
        const laneOccupancy: Record<number, string[]> = {}; // laneIndex: dateKeys[]

        sorted.forEach(event => {
            let laneIndex = 0;
            const eventDates: string[] = [];
            const start = new Date(event.scheduledDate);
            const end = new Date(event.endDate || event.scheduledDate);
            const curr = new Date(start);
            while (curr <= end) {
                eventDates.push(toDateKey(curr));
                curr.setDate(curr.getDate() + 1);
            }

            while (true) {
                const occupiedDates = laneOccupancy[laneIndex] || [];
                const isConflict = eventDates.some(d => occupiedDates.includes(d));
                if (!isConflict) {
                    laneOccupancy[laneIndex] = [...occupiedDates, ...eventDates];
                    lanes.push({ ...event, lane: laneIndex });
                    break;
                }
                laneIndex++;
                if (laneIndex > 20) break; // Safety break
            }
        });

        return lanes;
    }, [allEvents, days]);

    const getEventsForDate = useCallback(
        (date: Date) => {
            const dateStr = toDateKey(date);
            return eventsWithLanes
                .filter(e => {
                    const start = e.scheduledDate;
                    const end = e.endDate || e.scheduledDate;
                    return dateStr >= start && dateStr <= end;
                })
                .sort((a, b) => a.lane - b.lane);
        },
        [eventsWithLanes]
    );

    const handleOverflowClick = (e: React.MouseEvent, dateKey: string, overflowEvents: CalendarEvent[]) => {
        e.stopPropagation();
        setOverflowPopover(prev =>
            prev?.dateKey === dateKey ? null : { dateKey, events: overflowEvents }
        );
    };

    // 검색 결과
    const searchResults = searchQuery.trim() ? searchEvents(searchQuery) : [];

    // 헤더 타이틀
    const getHeaderTitle = () => {
        if (viewMode === 'month') return `${year}년 ${month + 1}월`;
        if (viewMode === 'week') {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekStart.getMonth() === weekEnd.getMonth()) {
                return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 – ${weekEnd.getDate()}일`;
            }
            return `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 – ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
        }
        return `${year}년 ${month + 1}월 ${currentDate.getDate()}일`;
    };

    // 주간 뷰 요일 헤더
    const getWeekDates = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - d.getDay());
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            dates.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return dates;
    };

    return (
        <div className="calendar" ref={calendarRef} onWheel={handleWheel}>
            {/* 고정 헤더 */}
            <div className="calendar__sticky-header">
                <div className="calendar__header">
                    <div className="calendar__header-left">
                        <h1 className="calendar__title">{getHeaderTitle()}</h1>
                        <div className="calendar__nav">
                            <button className="calendar__nav-btn" onClick={() => navigate(-1)}>
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                className="btn btn--secondary"
                                style={{ fontSize: 13, padding: '6px 14px' }}
                                onClick={() => setCurrentDate(new Date())}
                            >
                                오늘
                            </button>
                            <button className="calendar__nav-btn" onClick={() => navigate(1)}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="calendar__header-center">
                        {/* 뷰 전환 버튼 */}
                        <div className="view-toggle">
                            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                                <button
                                    key={mode}
                                    className={`view-toggle__btn ${viewMode === mode ? 'view-toggle__btn--active' : ''}`}
                                    onClick={() => setViewMode(mode)}
                                >
                                    {mode === 'month' ? '월' : mode === 'week' ? '주' : '일'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="calendar__header-right">
                        {/* 검색 */}
                        <div className="calendar__search-wrap">
                            <button
                                className={`calendar__search-btn ${searchOpen ? 'calendar__search-btn--active' : ''}`}
                                onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
                            >
                                <Search size={16} />
                            </button>
                            {searchOpen && (
                                <div className="calendar__search-dropdown">
                                    <div className="calendar__search-input-wrap">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            className="calendar__search-input"
                                            placeholder="일정 검색..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <button className="calendar__search-clear" onClick={() => setSearchQuery('')}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="calendar__search-results">
                                            {searchResults.slice(0, 8).map(ev => (
                                                <div
                                                    key={ev.id}
                                                    className="calendar__search-result"
                                                    onClick={() => {
                                                        onEventClick(ev);
                                                        setCurrentDate(new Date(ev.scheduledDate + 'T00:00:00'));
                                                        setSearchOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <span className="calendar__search-dot" style={{ background: getEventColor(ev.colorId) }} />
                                                    <div className="calendar__search-result-info">
                                                        <span className="calendar__search-result-title">{ev.title}</span>
                                                        <span className="calendar__search-result-date">
                                                            {ev.scheduledDate} {(ev.allDay || ev.startTime === '00:00') ? '종일' : ev.startTime}
                                                            {ev.location && ` · 📍 ${ev.location}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchQuery && searchResults.length === 0 && (
                                        <div className="calendar__search-empty">검색 결과가 없습니다</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="calendar__add-btn" onClick={() => onCreateEvent(new Date())}>
                            <Plus size={16} />
                            <span>새 일정</span>
                        </button>
                    </div>
                </div>

                {/* 요일 헤더 — 월간/주간 */}
                {viewMode !== 'day' && (
                    <div className={`calendar__weekday-row ${viewMode === 'week' ? 'calendar__weekday-row--week' : ''}`}>
                        {viewMode === 'week' && <div className="calendar__weekday calendar__weekday--gutter" />}
                        {viewMode === 'week'
                            ? getWeekDates().map((d, i) => (
                                <div key={i} className={`calendar__weekday calendar__weekday--dated ${isToday(d) ? 'calendar__weekday--today' : ''}`}>
                                    <span>{weekdays[i]}</span>
                                    <span className={`calendar__weekday-num ${isToday(d) ? 'calendar__weekday-num--today' : ''}`}>{d.getDate()}</span>
                                </div>
                            ))
                            : weekdays.map(day => (
                                <div key={day} className="calendar__weekday">{day}</div>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* 뷰 본문 */}
            {viewMode === 'month' && (
                <div className="calendar__grid-scroll" onClick={() => setOverflowPopover(null)}>
                    <div className="calendar__grid">
                        {days.map((date, idx) => {
                            const dayEvents = getEventsForDate(date);
                            const isOtherMonth = date.getMonth() !== month;
                            const holiday = KOREAN_HOLIDAYS[toDateKey(date)];
                            const isSunday = date.getDay() === 0;
                            const dayIndex = date.getDay();
                            const dateKey = toDateKey(date);
                            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_BARS);
                            const overflowCount = dayEvents.length - MAX_VISIBLE_BARS;
                            const hasEvents = dayEvents.length > 0;

                            const cellClasses = [
                                'calendar__cell',
                                isToday(date) ? 'calendar__cell--today' : '',
                                isOtherMonth ? 'calendar__cell--other-month' : '',
                                holiday ? 'calendar__cell--holiday' : '',
                            ].filter(Boolean).join(' ');

                            return (
                                <div key={idx} className={cellClasses}>
                                    <div className={`calendar__date ${holiday || isSunday ? 'calendar__date--holiday' : ''}`}>
                                        {date.getDate()}
                                        {holiday && <span className="calendar__holiday-name">{holiday}</span>}
                                    </div>
                                    <div className="calendar__bars">
                                        {Array.from({ length: Math.max(MAX_VISIBLE_BARS, dayEvents.length > 0 ? Math.max(...dayEvents.map(e => (e as any).lane)) + 1 : 0) }).map((_, laneIdx) => {
                                            const event = dayEvents.find(e => (e as any).lane === laneIdx);
                                            if (!event) return <div key={laneIdx} style={{ height: 24, marginBottom: 2 }} />;
                                            
                                            // 3번째 줄까지는 보여주고 그 뒤는 overflow로 넘김
                                            if (laneIdx >= MAX_VISIBLE_BARS) return null;

                                            const isStart = event.scheduledDate === dateKey;
                                            const isEnd = (event.endDate || event.scheduledDate) === dateKey;
                                            const isSun = date.getDay() === 0;

                                            return (
                                                <EventBar
                                                    key={event.id}
                                                    event={event}
                                                    onEdit={() => onEventClick(event)}
                                                    onDelete={() => deleteEvent(event.id)}
                                                    dayIndex={dayIndex}
                                                    isStart={isStart}
                                                    isEnd={isEnd}
                                                    isWeekStart={isSun}
                                                />
                                            );
                                        })}
                                        {overflowCount > 0 && (
                                            <div className="calendar__overflow-wrap" style={{ position: 'relative' }}>
                                                <button
                                                    className="calendar__overflow-btn"
                                                    onClick={(e) => handleOverflowClick(e, dateKey, dayEvents)}
                                                >
                                                    +{overflowCount} 더보기
                                                </button>
                                                {overflowPopover?.dateKey === dateKey && (
                                                    <div className="calendar__overflow-popover" onClick={e => e.stopPropagation()}>
                                                        <div className="calendar__overflow-popover-title">
                                                            {date.getMonth() + 1}/{date.getDate()} 일정
                                                        </div>
                                                        {overflowPopover.events.map(event => (
                                                            <div
                                                                key={event.id}
                                                                className="calendar__overflow-item"
                                                                onClick={() => { onEventClick(event); setOverflowPopover(null); }}
                                                            >
                                                                <span className="calendar__overflow-dot" style={{ background: getEventColor(event.colorId) }} />
                                                                <span className="truncate">{event.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* + 버튼: 빈 날짜는 가운데, 일정 있는 날은 바 아래 */}
                                    {!isOtherMonth && (
                                        <div
                                            className={`calendar__add-event ${hasEvents ? 'calendar__add-event--below' : 'calendar__add-event--center'}`}
                                            onClick={(e) => { e.stopPropagation(); onCreateEvent(date); }}
                                        >
                                            <Plus size={14} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {viewMode === 'week' && (
                <WeekView currentDate={currentDate} onEventClick={onEventClick} onCreateEvent={onCreateEvent} />
            )}

            {viewMode === 'day' && (
                <DayView currentDate={currentDate} onEventClick={onEventClick} onCreateEvent={onCreateEvent} />
            )}
        </div>
    );
}
