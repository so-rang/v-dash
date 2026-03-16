'use client';

import { Plus } from 'lucide-react';

interface TopBarProps {
    onCreateStage: (date: Date) => void;
}

export default function TopBar({ onCreateStage }: TopBarProps) {
    const today = new Date();

    const handleAddClick = () => {
        onCreateStage(today);
    };

    return (
        <header className="top-bar">
            <div className="top-bar__left">
                <span className="top-bar__date">
                    {today.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                    })}
                </span>
            </div>
            <div className="top-bar__right">
                <button className="top-bar__add-btn" onClick={handleAddClick}>
                    <Plus size={18} />
                    <span>새 콘텐츠</span>
                </button>
            </div>
        </header>
    );
}
