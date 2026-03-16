'use client';

import { useState } from 'react';
import { useChannelStore } from '@/store/channel-store';
import { BarChart3, TrendingUp, MessageSquare, Eye } from 'lucide-react';

const CHANNEL_COLORS: Record<string, string> = {
    'ch-001': '#818CF8',
    'ch-002': '#FBBF24',
    'ch-003': '#2DD4BF',
};

// 데모 성과 데이터
const DEMO_ANALYTICS: Record<string, {
    name: string;
    views: string;
    growth: string;
    topVideo: string;
    topViews: string;
    sentiment: { positive: number; neutral: number; negative: number };
    recentPerformance: { title: string; views: string; likes: string; comments: number }[];
}> = {
    'ch-001': {
        name: '테크 리뷰 채널',
        views: '125.4K',
        growth: '+12.3%',
        topVideo: 'M4 맥북 프로 리뷰',
        topViews: '45.2K',
        sentiment: { positive: 78, neutral: 15, negative: 7 },
        recentPerformance: [
            { title: '아이폰 17 프로 언박싱', views: '32.1K', likes: '2.1K', comments: 312 },
            { title: 'M4 맥북 프로 리뷰', views: '45.2K', likes: '3.5K', comments: 478 },
            { title: '갤럭시 S26 비교', views: '28.7K', likes: '1.8K', comments: 245 },
        ],
    },
    'ch-002': {
        name: '쿠킹 스튜디오',
        views: '89.7K',
        growth: '+8.1%',
        topVideo: '15분 파스타 레시피',
        topViews: '38.5K',
        sentiment: { positive: 85, neutral: 12, negative: 3 },
        recentPerformance: [
            { title: '15분 파스타 레시피', views: '38.5K', likes: '4.2K', comments: 521 },
            { title: '집에서 만드는 크루아상', views: '22.3K', likes: '2.8K', comments: 189 },
        ],
    },
    'ch-003': {
        name: '여행 브이로그',
        views: '67.2K',
        growth: '+15.7%',
        topVideo: '제주 3박 4일 코스',
        topViews: '31.8K',
        sentiment: { positive: 91, neutral: 7, negative: 2 },
        recentPerformance: [
            { title: '제주 3박 4일 코스', views: '31.8K', likes: '3.9K', comments: 347 },
            { title: '도쿄 숨은 맛집 투어', views: '19.2K', likes: '2.1K', comments: 156 },
        ],
    },
};

export default function AnalyticsView() {
    const { channels } = useChannelStore();
    const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
        new Set(channels.map(ch => ch.id))
    );

    const toggleChannel = (id: string) => {
        setSelectedChannels(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allSelected = channels.length > 0 && channels.every(ch => selectedChannels.has(ch.id));

    const toggleAll = () => {
        if (allSelected) {
            setSelectedChannels(new Set());
        } else {
            setSelectedChannels(new Set(channels.map(ch => ch.id)));
        }
    };

    const channelsToShow = channels.filter(ch => selectedChannels.has(ch.id));

    return (
        <div className="analytics-view">
            <div className="analytics-view__header">
                <h1 className="analytics-view__title">
                    <BarChart3 size={24} />
                    성과 분석
                </h1>
                <p className="analytics-view__subtitle">채널별 성과 지표 및 댓글 감정 분석</p>
            </div>

            {/* 채널 필터 (캘린더와 동일 스타일) */}
            <div className="calendar__channel-filter">
                <button
                    className={`calendar__filter-chip ${allSelected ? 'calendar__filter-chip--filled' : 'calendar__filter-chip--off'}`}
                    onClick={toggleAll}
                >
                    전체
                </button>
                {channels.map(channel => {
                    const isChecked = selectedChannels.has(channel.id);
                    const color = CHANNEL_COLORS[channel.id] || '#818CF8';
                    return (
                        <button
                            key={channel.id}
                            className={`calendar__filter-chip ${isChecked ? 'calendar__filter-chip--filled' : 'calendar__filter-chip--off'}`}
                            onClick={() => toggleChannel(channel.id)}
                            style={isChecked ? {
                                background: `${color}22`,
                                borderColor: color,
                                color: color,
                            } : undefined}
                        >
                            <span
                                className="calendar__filter-dot"
                                style={{ background: isChecked ? color : 'var(--text-muted)' }}
                            />
                            {channel.displayName}
                        </button>
                    );
                })}
            </div>

            {channelsToShow.length === 0 ? (
                <div className="analytics-view__empty">
                    채널을 선택하세요.
                </div>
            ) : (
                <div className="analytics-view__grid">
                    {channelsToShow.map(channel => {
                        const data = DEMO_ANALYTICS[channel.id];
                        if (!data) return null;

                        return (
                            <div key={channel.id} className="analytics-card">
                                <div className="analytics-card__header">
                                    <h3>{data.name}</h3>
                                    <span className="analytics-card__growth">
                                        <TrendingUp size={14} /> {data.growth}
                                    </span>
                                </div>

                                {/* 요약 지표 */}
                                <div className="analytics-card__stats">
                                    <div className="analytics-stat">
                                        <Eye size={14} />
                                        <div>
                                            <div className="analytics-stat__value">{data.views}</div>
                                            <div className="analytics-stat__label">총 조회수</div>
                                        </div>
                                    </div>
                                    <div className="analytics-stat">
                                        <TrendingUp size={14} />
                                        <div>
                                            <div className="analytics-stat__value">{data.topViews}</div>
                                            <div className="analytics-stat__label">최고 조회수</div>
                                        </div>
                                    </div>
                                    <div className="analytics-stat">
                                        <MessageSquare size={14} />
                                        <div>
                                            <div className="analytics-stat__value">
                                                😊 {data.sentiment.positive}%
                                            </div>
                                            <div className="analytics-stat__label">긍정 감정</div>
                                        </div>
                                    </div>
                                </div>

                                {/* 최근 영상 성과 */}
                                <div className="analytics-card__table">
                                    <div className="analytics-table__header">
                                        <span>영상</span>
                                        <span>조회수</span>
                                        <span>좋아요</span>
                                        <span>댓글</span>
                                    </div>
                                    {data.recentPerformance.map((video, idx) => (
                                        <div key={idx} className="analytics-table__row">
                                            <span className="truncate">{video.title}</span>
                                            <span>{video.views}</span>
                                            <span>{video.likes}</span>
                                            <span>{video.comments}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* 감정 분석 바 */}
                                <div className="analytics-card__sentiment">
                                    <div className="analytics-sentiment__label">댓글 감정 분석</div>
                                    <div className="analytics-sentiment__bar">
                                        <div
                                            className="analytics-sentiment__positive"
                                            style={{ width: `${data.sentiment.positive}%` }}
                                        />
                                        <div
                                            className="analytics-sentiment__neutral"
                                            style={{ width: `${data.sentiment.neutral}%` }}
                                        />
                                        <div
                                            className="analytics-sentiment__negative"
                                            style={{ width: `${data.sentiment.negative}%` }}
                                        />
                                    </div>
                                    <div className="analytics-sentiment__legend">
                                        <span>😊 긍정 {data.sentiment.positive}%</span>
                                        <span>😐 중립 {data.sentiment.neutral}%</span>
                                        <span>😟 부정 {data.sentiment.negative}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
