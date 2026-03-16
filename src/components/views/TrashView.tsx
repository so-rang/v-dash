'use client';

import { useEventStore } from '@/store/event-store';
import { Trash2, RotateCcw } from 'lucide-react';

export default function TrashView() {
    const deletedEvents = useEventStore(s => s.deletedEvents);
    const restoreEvent = useEventStore(s => s.restoreEvent);
    const permanentDelete = useEventStore(s => s.permanentDelete);

    return (
        <div className="settings-view">
            <div className="settings-view__header">
                <h1 className="settings-view__title">
                    <Trash2 size={24} />
                    휴지통
                </h1>
                <p className="settings-view__subtitle">삭제된 항목은 30일 후 자동으로 영구 삭제됩니다</p>
            </div>

            {deletedEvents.length === 0 ? (
                <div className="trash-empty">
                    <Trash2 size={48} />
                    <p>휴지통이 비어있습니다</p>
                </div>
            ) : (
                <div className="trash-list">
                    {deletedEvents.map(item => {
                        const deletedDate = item.deletedAt ? new Date(item.deletedAt).toISOString().split('T')[0] : '-';
                        const daysRemaining = item.deletedAt
                            ? Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
                            : 30;
                        return (
                            <div key={item.id} className="trash-item">
                                <div className="trash-item__info">
                                    <div className="trash-item__title">{item.title}</div>
                                    <div className="trash-item__meta">
                                        삭제일: {deletedDate} · 남은 기간: {daysRemaining}일
                                    </div>
                                </div>
                                <div className="trash-item__actions">
                                    <button className="trash-item__restore" onClick={() => restoreEvent(item.id)}>
                                        <RotateCcw size={14} /> 복구
                                    </button>
                                    <button className="trash-item__delete" onClick={() => permanentDelete(item.id)}>
                                        <Trash2 size={14} /> 삭제
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
