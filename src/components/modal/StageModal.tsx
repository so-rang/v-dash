'use client';


import { useState, useMemo, useCallback, useRef } from 'react';
import type { CalendarEvent, EventColorId, Attendee, Attachment } from '@/types/stage';
import { EVENT_COLORS } from '@/types/stage';
import { useEventStore, getEventColor } from '@/store/event-store';
import { X, Check, Trash2, Clock, AlignLeft, MapPin, Users, Tag, Plus, Paperclip, ChevronDown, ChevronUp, FileText, Repeat, CalendarPlus } from 'lucide-react';

interface EventModalProps {
    event: CalendarEvent | null;
    onClose: () => void;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const REPEAT_OPTIONS: { value: CalendarEvent['repeatType']; label: string }[] = [
    { value: 'none', label: '반복 안함' },
    { value: 'daily', label: '매일' },
    { value: 'weekly', label: '매주' },
    { value: 'monthly', label: '매월' },
    { value: 'yearly', label: '매년' },
];

export default function EventModal({ event, onClose }: EventModalProps) {
    const updateEvent = useEventStore(s => s.updateEvent);
    const addEvent = useEventStore(s => s.addEvent);
    const deleteEvent = useEventStore(s => s.deleteEvent);
    const events = useEventStore(s => s.events);
    const eventExists = events.some(e => e.id === event?.id);

    const groups = useMemo(() => {
        const groupMap = new Map<string, string>();
        for (const e of events) {
            if (e.groupId && e.groupName) {
                groupMap.set(e.groupId, e.groupName);
            }
        }
        return Array.from(groupMap.entries()).map(([id, name]) => ({ id, name }));
    }, [events]);

    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [scheduledDate, setScheduledDate] = useState(event?.scheduledDate || '');
    const [endDate, setEndDate] = useState(event?.endDate || '');
    const [showEndDate, setShowEndDate] = useState(!!event?.endDate);
    const [allDay, setAllDay] = useState(event?.allDay ?? true);
    const [startTime, setStartTime] = useState(event?.startTime || '09:00');
    const [endTime, setEndTime] = useState(event?.endTime || '10:00');
    const [colorId, setColorId] = useState<EventColorId>(event?.colorId || 'peacock');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [location, setLocation] = useState(event?.location || '');
    const [attendees, setAttendees] = useState<Attendee[]>(event?.attendees || []);
    const [attendeeInput, setAttendeeInput] = useState('');
    const [groupId, setGroupId] = useState(event?.groupId || '');
    const [groupName, setGroupName] = useState(event?.groupName || '');
    const [showGroupPicker, setShowGroupPicker] = useState(false);
    const [newGroupMode, setNewGroupMode] = useState(false);
    const [repeatType, setRepeatType] = useState<CalendarEvent['repeatType']>(event?.repeatType || 'none');
    const [showRepeatPicker, setShowRepeatPicker] = useState(false);

    // 첨부파일 관련
    const [attachments, setAttachments] = useState<Attachment[]>(event?.attachments || []);
    const [showAttachments, setShowAttachments] = useState((event?.attachments?.length ?? 0) > 0);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!event) return null;

    const handleStartDateChange = (val: string) => {
        setScheduledDate(val);
        if (endDate && val > endDate) {
            setEndDate(val);
        }
    };

    const handleEndDateChange = (val: string) => {
        if (val && val < scheduledDate) {
            setEndDate(scheduledDate);
        } else {
            setEndDate(val);
        }
    };

    const handleToggleEndDate = () => {
        if (showEndDate) {
            setShowEndDate(false);
            setEndDate('');
        } else {
            setShowEndDate(true);
            // 기본적으로 시작일과 같은 날짜로 설정
            if (!endDate) setEndDate(scheduledDate);
        }
    };

    const handleSave = () => {
        const updates: Partial<CalendarEvent> = {
            title: title || '(제목 없음)',
            description,
            scheduledDate,
            endDate: showEndDate && endDate ? endDate : null,
            allDay,
            startTime: allDay ? null : startTime,
            endTime: allDay ? null : endTime,
            colorId,
            location,
            attendees,
            groupId: groupId || null,
            groupName: groupName || null,
            attachments,
            repeatType,
        };

        if (eventExists) {
            updateEvent(event.id, updates);
        } else {
            addEvent({ ...event, ...updates });
        }
        onClose();
    };

    const handleDelete = () => {
        if (eventExists) {
            deleteEvent(event.id);
        }
        onClose();
    };

    const handleAddAttendee = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && attendeeInput.trim()) {
            e.preventDefault();
            const input = attendeeInput.trim();
            const isEmail = input.includes('@');
            const newAttendee: Attendee = {
                name: isEmail ? input.split('@')[0] : input,
                email: isEmail ? input : `${input}@`,
                status: 'pending',
            };
            if (!attendees.some(a => a.email === newAttendee.email || a.name === newAttendee.name)) {
                setAttendees([...attendees, newAttendee]);
            }
            setAttendeeInput('');
        }
    };

    const removeAttendee = (idx: number) => {
        setAttendees(attendees.filter((_, i) => i !== idx));
    };

    const selectGroup = (gId: string, gName: string) => {
        setGroupId(gId);
        setGroupName(gName);
        setShowGroupPicker(false);
        setNewGroupMode(false);
    };

    const createNewGroup = () => {
        if (groupName.trim()) {
            setGroupId(`grp-${Date.now()}`);
            setShowGroupPicker(false);
            setNewGroupMode(false);
        }
    };

    // 첨부파일 핸들러
    const processFiles = useCallback((files: FileList | File[]) => {
        const newAttachments: Attachment[] = [];
        for (const file of Array.from(files)) {
            const url = URL.createObjectURL(file);
            newAttachments.push({
                name: file.name,
                url,
                type: file.type,
                size: file.size,
            });
        }
        setAttachments(prev => [...prev, ...newAttachments]);
        if (!showAttachments) setShowAttachments(true);
    }, [showAttachments]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, [processFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    }, [processFiles]);

    const removeAttachment = (idx: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const isImageFile = (type: string) => type.startsWith('image/');

    const selectedColor = getEventColor(colorId);

    return (
        <>
            <div className="event-modal-backdrop" onClick={onClose} />
            <div className="event-modal">
                {/* 헤더 — 색상 선택을 여기에 포함 */}
                <div className="event-modal__header">
                    <div className="event-modal__color-indicator-wrap" style={{ position: 'relative' }}>
                        <button
                            className="event-modal__color-indicator-btn"
                            style={{ background: selectedColor }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            title="색상 변경"
                        />
                        {showColorPicker && (
                            <div className="event-modal__color-dropdown">
                                {EVENT_COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        className={`event-modal__color-swatch ${colorId === c.id ? 'event-modal__color-swatch--active' : ''}`}
                                        style={{ background: c.hex }}
                                        onClick={() => { setColorId(c.id); setShowColorPicker(false); }}
                                        title={c.label}
                                    >
                                        {colorId === c.id && <Check size={12} color="#fff" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        type="text"
                        className="event-modal__title-input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="제목 추가"
                        autoFocus
                    />
                    <button className="event-modal__close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="event-modal__body">
                    {/* 날짜 & 시간 */}
                    <div className="event-modal__row">
                        <div className="event-modal__row-icon"><Clock size={18} /></div>
                        <div className="event-modal__row-content">
                            <div className="event-modal__date-range-row">
                                <input type="date" className="event-modal__date-input" value={scheduledDate} onChange={e => handleStartDateChange(e.target.value)} />
                                {showEndDate && (
                                    <>
                                        <span className="event-modal__date-sep">~</span>
                                        <input type="date" className="event-modal__date-input" value={endDate} onChange={e => handleEndDateChange(e.target.value)} min={scheduledDate} />
                                        <button className="event-modal__enddate-remove" onClick={handleToggleEndDate} title="종료일 제거">
                                            <X size={12} />
                                        </button>
                                    </>
                                )}
                                {!showEndDate && (
                                    <button className="event-modal__enddate-add" onClick={handleToggleEndDate} title="종료일 추가">
                                        <CalendarPlus size={14} />
                                        <span>종료일</span>
                                    </button>
                                )}
                                <label className="event-modal__allday-toggle">
                                    <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
                                    <span>종일</span>
                                </label>
                            </div>
                            {!allDay && (
                                <div className="event-modal__time-row">
                                    <input type="time" className="event-modal__time-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                    <span className="event-modal__time-sep">–</span>
                                    <input type="time" className="event-modal__time-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                </div>
                            )}
                            {/* 반복 */}
                            <div className="event-modal__repeat-row">
                                <button className="event-modal__repeat-btn" onClick={() => setShowRepeatPicker(!showRepeatPicker)}>
                                    <Repeat size={14} />
                                    <span>{REPEAT_OPTIONS.find(r => r.value === repeatType)?.label}</span>
                                    <ChevronDown size={12} />
                                </button>
                                {showRepeatPicker && (
                                    <div className="event-modal__repeat-picker">
                                        {REPEAT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                className={`event-modal__repeat-option ${repeatType === opt.value ? 'event-modal__repeat-option--active' : ''}`}
                                                onClick={() => { setRepeatType(opt.value); setShowRepeatPicker(false); }}
                                            >
                                                {repeatType === opt.value && <Check size={12} />}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 위치 */}
                    <div className="event-modal__row">
                        <div className="event-modal__row-icon"><MapPin size={18} /></div>
                        <div className="event-modal__row-content">
                            <input
                                type="text"
                                className="event-modal__text-input"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="위치 추가"
                            />
                        </div>
                    </div>

                    {/* 참석자 */}
                    <div className="event-modal__row">
                        <div className="event-modal__row-icon"><Users size={18} /></div>
                        <div className="event-modal__row-content">
                            <div className="event-modal__attendees-wrap">
                                {attendees.map((a, i) => (
                                    <span key={i} className="event-modal__attendee-chip">
                                        {a.name}
                                        <button className="event-modal__attendee-remove" onClick={() => removeAttendee(i)}>
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className="event-modal__attendee-input"
                                    value={attendeeInput}
                                    onChange={e => setAttendeeInput(e.target.value)}
                                    onKeyDown={handleAddAttendee}
                                    placeholder={attendees.length === 0 ? '참석자 추가 (이름 또는 이메일)' : '추가...'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 메모 */}
                    <div className="event-modal__row">
                        <div className="event-modal__row-icon"><AlignLeft size={18} /></div>
                        <div className="event-modal__row-content">
                            <textarea
                                className="event-modal__desc-input"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="메모 추가"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* 첨부파일 */}
                    <div className="event-modal__row">
                        <div className="event-modal__row-icon"><Paperclip size={18} /></div>
                        <div className="event-modal__row-content">
                            <button className="event-modal__attach-toggle" onClick={() => setShowAttachments(!showAttachments)}>
                                <span>첨부파일 {attachments.length > 0 && <span className="event-modal__attach-count">{attachments.length}</span>}</span>
                                {showAttachments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showAttachments && (
                                <div className="event-modal__attach-panel">
                                    <div
                                        className={`event-modal__drop-zone ${isDragging ? 'event-modal__drop-zone--active' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Plus size={16} />
                                        <span>{isDragging ? '여기에 놓으세요' : '파일을 드래그하거나 클릭하여 추가'}</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            className="event-modal__file-input-hidden"
                                            onChange={handleFileInput}
                                        />
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="event-modal__attach-list">
                                            {attachments.map((att, idx) => (
                                                <div key={idx} className="event-modal__attach-item">
                                                    {isImageFile(att.type) ? (
                                                        <div
                                                            className="event-modal__attach-thumb"
                                                            onClick={() => setLightboxUrl(att.url)}
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={att.url} alt={att.name} />
                                                        </div>
                                                    ) : (
                                                        <div className="event-modal__attach-icon">
                                                            <FileText size={20} />
                                                        </div>
                                                    )}
                                                    <div className="event-modal__attach-info">
                                                        <span className="event-modal__attach-name">{att.name}</span>
                                                        <span className="event-modal__attach-size">{formatFileSize(att.size)}</span>
                                                    </div>
                                                    <button className="event-modal__attach-remove" onClick={() => removeAttachment(idx)}>
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 카테고리 */}
                    <div className="event-modal__row">
                        <div className="event-modal__row-icon"><Tag size={18} /></div>
                        <div className="event-modal__row-content">
                            <button className="event-modal__group-btn" onClick={() => setShowGroupPicker(!showGroupPicker)}>
                                {groupName ? (
                                    <><span className="event-modal__group-tag">🏷️ {groupName}</span></>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>카테고리 연결</span>
                                )}
                            </button>
                            {showGroupPicker && (
                                <div className="event-modal__group-picker">
                                    {groups.map(g => (
                                        <button
                                            key={g.id}
                                            className={`event-modal__group-option ${groupId === g.id ? 'event-modal__group-option--active' : ''}`}
                                            onClick={() => selectGroup(g.id, g.name)}
                                        >
                                            🏷️ {g.name}
                                        </button>
                                    ))}
                                    {groupId && (
                                        <button className="event-modal__group-option event-modal__group-option--remove" onClick={() => { setGroupId(''); setGroupName(''); setShowGroupPicker(false); }}>
                                            그룹 해제
                                        </button>
                                    )}
                                    {!newGroupMode ? (
                                        <button className="event-modal__group-option event-modal__group-option--new" onClick={() => setNewGroupMode(true)}>
                                            <Plus size={12} /> 새 그룹 만들기
                                        </button>
                                    ) : (
                                        <div className="event-modal__group-new">
                                            <input
                                                type="text"
                                                className="event-modal__group-new-input"
                                                value={groupName}
                                                onChange={e => setGroupName(e.target.value)}
                                                placeholder="그룹 이름"
                                                autoFocus
                                                onKeyDown={e => { if (e.key === 'Enter') createNewGroup(); }}
                                            />
                                            <button className="event-modal__group-new-btn" onClick={createNewGroup}>생성</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="event-modal__footer">
                    {eventExists && (
                        <button className="btn btn--danger event-modal__delete-btn" onClick={handleDelete}>
                            <Trash2 size={14} /> 삭제
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button className="btn btn--secondary" onClick={onClose}>취소</button>
                    <button className="btn btn--primary" onClick={handleSave}>저장</button>
                </div>
            </div>

            {/* 라이트박스 */}
            {lightboxUrl && (
                <>
                    <div className="event-modal__lightbox-backdrop" onClick={() => setLightboxUrl(null)} />
                    <div className="event-modal__lightbox" onClick={() => setLightboxUrl(null)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={lightboxUrl} alt="첨부파일 미리보기" />
                        <button className="event-modal__lightbox-close" onClick={() => setLightboxUrl(null)}>
                            <X size={24} />
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
