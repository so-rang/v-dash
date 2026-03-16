'use client';

import { useEffect } from 'react';
import { useChannelStore } from '@/store/channel-store';
import { useEventStore, initDemoEvents, getEventColor } from '@/store/event-store';
import { PanelLeftClose, PanelLeft, BarChart3, Settings, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import type { Channel } from '@/types/channel';
import type { CalendarEvent } from '@/types/stage';
import AuthButton from '@/components/auth/AuthButton';

const DEMO_CHANNELS: Channel[] = [
    {
        id: 'ch-001',
        youtubeChannelId: 'UC_across_house',
        displayName: '어크로스 하우스',
        profileImageUrl: null,
        personaConfig: {
            tone: 'casual',
            targetAudience: 'IT 관심 20-30대',
            preferredWords: ['꿀팁', '실화', '대박'],
            informationDensity: 4,
            emotionTone: 3,
            footerText: '구독과 좋아요 부탁드립니다!',
        },
        driveRootPath: '/V-Dash/어크로스하우스/Upload_Waiting',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'ch-002',
        youtubeChannelId: 'UC_gpto',
        displayName: 'GPTO',
        profileImageUrl: null,
        personaConfig: {
            tone: 'formal',
            targetAudience: 'AI·자동화 관심 전문가',
            preferredWords: ['자동화', 'GPT', '프롬프트'],
            informationDensity: 5,
            emotionTone: 2,
            footerText: '더 많은 AI 활용법은 블로그에서 확인하세요.',
        },
        driveRootPath: '/V-Dash/GPTO/Upload_Waiting',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'ch-003',
        youtubeChannelId: 'UC_genrank',
        displayName: 'GenRank',
        profileImageUrl: null,
        personaConfig: {
            tone: 'mixed',
            targetAudience: '마케터·SEO 전문가',
            preferredWords: ['랭킹', '분석', '트렌드'],
            informationDensity: 4,
            emotionTone: 3,
            footerText: '인스타그램에서도 만나요 @genrank_official',
        },
        driveRootPath: '/V-Dash/GenRank/Upload_Waiting',
        createdAt: new Date().toISOString(),
    },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    activeNav: string;
    onNavChange: (nav: string) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

export default function Sidebar({ collapsed, onToggle, activeNav, onNavChange, onEventClick }: SidebarProps) {
    const { channels, setChannels } = useChannelStore();
    const allEvents = useEventStore(s => s.events);

    useEffect(() => {
        if (channels.length === 0) {
            setChannels(DEMO_CHANNELS);
        }
        initDemoEvents();
    }, [channels.length, setChannels]);

    // 다가오는 일정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingItems = allEvents
        .filter(e => {
            const d = new Date(e.scheduledDate);
            d.setHours(0, 0, 0, 0);
            return d >= today && !e.completed;
        })
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 5);

    const getDaysLeft = (dateStr: string) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                {!collapsed && <span className="sidebar__logo-text">V-Dash</span>}
                <button className="sidebar__toggle" onClick={onToggle} title={collapsed ? '사이드바 열기' : '사이드바 접기'}>
                    {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            {/* 다가오는 일정 */}
            {!collapsed && upcomingItems.length > 0 && (
                <div className="sidebar__dday">
                    <div className="sidebar__dday-title">📌 다가오는 일정</div>
                    {upcomingItems.map((event) => {
                        const daysLeft = getDaysLeft(event.scheduledDate);
                        return (
                            <div
                                key={event.id}
                                className="sidebar__dday-item sidebar__dday-item--clickable"
                                onClick={() => onEventClick?.(event)}
                            >
                                <span className="sidebar__dday-dot" style={{ background: getEventColor(event.colorId) }} />
                                <span className="sidebar__dday-text truncate">{event.title}</span>
                                <span className={`sidebar__dday-badge ${daysLeft === 0 ? 'sidebar__dday-badge--today' : ''}`}>
                                    {daysLeft === 0 ? 'D-DAY' : `D-${daysLeft}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <nav className="sidebar__nav">
                <button
                    className={`sidebar__nav-item ${activeNav === 'calendar' ? 'sidebar__nav-item--active' : ''}`}
                    onClick={() => onNavChange('calendar')}
                    title="캘린더"
                >
                    <CalendarIcon size={18} />
                    {!collapsed && <span>캘린더</span>}
                </button>
                <button
                    className={`sidebar__nav-item ${activeNav === 'analytics' ? 'sidebar__nav-item--active' : ''}`}
                    onClick={() => onNavChange('analytics')}
                    title="성과 분석"
                >
                    <BarChart3 size={18} />
                    {!collapsed && <span>성과 분석</span>}
                </button>
                <button
                    className={`sidebar__nav-item ${activeNav === 'settings' ? 'sidebar__nav-item--active' : ''}`}
                    onClick={() => onNavChange('settings')}
                    title="채널 설정"
                >
                    <Settings size={18} />
                    {!collapsed && <span>채널 설정</span>}
                </button>
            </nav>

            <div className="sidebar__bottom">
                <AuthButton collapsed={collapsed} />
                <button
                    className={`sidebar__nav-item ${activeNav === 'trash' ? 'sidebar__nav-item--active' : ''}`}
                    onClick={() => onNavChange('trash')}
                    title="휴지통"
                >
                    <Trash2 size={18} />
                    {!collapsed && <span>휴지통</span>}
                </button>
            </div>
        </aside>
    );
}
