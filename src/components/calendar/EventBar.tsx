'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { CalendarEvent } from '@/types/stage';
import { useEventStore, getEventColor } from '@/store/event-store';
import { Pencil, Trash2, CheckCircle2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EventBarProps {
    event: CalendarEvent;
    onEdit: () => void;
    onDelete: () => void;
    dayIndex?: number;
}

export default function EventBar({ event, onEdit, onDelete, dayIndex = 0 }: EventBarProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const updateEvent = useEventStore(s => s.updateEvent);

    const color = getEventColor(event.colorId);
    const statusClass = event.completed ? 'stage-bar--channel stage-bar--done' : 'stage-bar--channel';

    const isLeftSide = dayIndex >= 4;

    const showTip = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setShowTooltip(true);
    }, []);
    const scheduledHide = useCallback(() => {
        hideTimer.current = setTimeout(() => setShowTooltip(false), 200);
    }, []);

    useEffect(() => {
        if (showTooltip && barRef.current) {
            const rect = barRef.current.getBoundingClientRect();
            if (isLeftSide) {
                setTooltipPos({ top: rect.top - 4, left: rect.left - 8 });
            } else {
                setTooltipPos({ top: rect.top - 4, left: rect.right + 8 });
            }
        }
    }, [showTooltip, isLeftSide]);

    const timeDisplay = event.allDay
        ? '종일'
        : event.startTime && event.endTime
            ? `${event.startTime} – ${event.endTime}`
            : event.startTime || '';

    const handleToggleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateEvent(event.id, { completed: !event.completed });
        setShowTooltip(false);
    };

    const handleInlineDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const tooltipElement = showTooltip
        ? createPortal(
            <div
                className={`stage-bar-tooltip ${isLeftSide ? 'stage-bar-tooltip--left' : ''}`}
                style={{
                    position: 'fixed',
                    top: tooltipPos.top,
                    left: isLeftSide ? 'auto' : tooltipPos.left,
                    right: isLeftSide ? `calc(100vw - ${tooltipPos.left}px)` : 'auto',
                }}
                onMouseEnter={showTip}
                onMouseLeave={scheduledHide}
            >
                {event.groupName && (
                    <div className="stage-bar-tooltip__group">🏷️ {event.groupName}</div>
                )}
                <div className="stage-bar-tooltip__title">{event.title}</div>
                <div className="stage-bar-tooltip__meta">
                    <span className="stage-bar-tooltip__date">🕐 {timeDisplay}</span>
                </div>
                {event.location && (
                    <div className="stage-bar-tooltip__loc">📍 {event.location}</div>
                )}
                {event.attendees.length > 0 && (
                    <div className="stage-bar-tooltip__attendees">
                        👥 {event.attendees.map(a => a.name).join(', ')}
                    </div>
                )}
                {event.description && (
                    <div className="stage-bar-tooltip__desc">{event.description}</div>
                )}
                <div className="stage-bar-tooltip__actions">
                    <button
                        className={`stage-bar-tooltip__check ${event.completed ? 'stage-bar-tooltip__check--done' : ''}`}
                        onClick={handleToggleComplete}
                    >
                        <CheckCircle2 size={12} />
                        {event.completed ? '완료됨' : '완료'}
                    </button>
                    <button className="stage-bar-tooltip__edit" onClick={(e) => { e.stopPropagation(); setShowTooltip(false); onEdit(); }}>
                        <Pencil size={12} /> 수정
                    </button>
                    <button className="stage-bar-tooltip__delete-btn" onClick={(e) => { e.stopPropagation(); setShowTooltip(false); onDelete(); }}>
                        <Trash2 size={12} /> 삭제
                    </button>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <div ref={barRef} className="stage-bar-wrap" onMouseEnter={showTip} onMouseLeave={scheduledHide} onClick={e => e.stopPropagation()}>
            <div
                className={`stage-bar ${statusClass}`}
                onClick={onEdit}
                style={{
                    cursor: 'pointer',
                    background: color,
                    boxShadow: event.completed ? 'none' : `0 0 var(--vivid-glow-radius, 6px) ${color}40`,
                }}
            >
                {/* 그룹 마커 */}
                {event.groupId && (
                    <span className="stage-bar__group-dot" style={{ background: '#fff', opacity: 0.6 }} />
                )}
                <span className="truncate" style={{ fontSize: 11, flex: 1 }}>
                    {!event.allDay && event.startTime && (
                        <span style={{ marginRight: 4, opacity: 0.85, fontSize: 10 }}>{event.startTime}</span>
                    )}
                    {event.title}
                </span>
                {/* 인라인 삭제 버튼 — 호버 시 표시 */}
                <button className="stage-bar__delete" onClick={handleInlineDelete} title="삭제">
                    <X size={10} />
                </button>
            </div>

            {tooltipElement}
        </div>
    );
}
