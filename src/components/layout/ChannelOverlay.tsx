'use client';

import { useChannelStore } from '@/store/channel-store';
import type { Channel } from '@/types/channel';

// 데모용 채널 데이터 (실제로는 API에서 로드)
const DEMO_CHANNELS: Channel[] = [
    {
        id: 'ch-001',
        youtubeChannelId: 'UC_demo_channel_A',
        displayName: '테크 리뷰 채널',
        profileImageUrl: null,
        personaConfig: {
            tone: 'casual',
            targetAudience: 'IT 관심 20-30대',
            preferredWords: ['꿀팁', '실화', '대박'],
            informationDensity: 4,
            emotionTone: 3,
            footerText: '구독과 좋아요 부탁드립니다!',
        },
        driveRootPath: '/V-Dash/테크리뷰/Upload_Waiting',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'ch-002',
        youtubeChannelId: 'UC_demo_channel_B',
        displayName: '쿠킹 스튜디오',
        profileImageUrl: null,
        personaConfig: {
            tone: 'formal',
            targetAudience: '요리 입문자 전 연령대',
            preferredWords: ['레시피', '간단', '맛있는'],
            informationDensity: 3,
            emotionTone: 4,
            footerText: '더 많은 레시피는 블로그에서 확인하세요.',
        },
        driveRootPath: '/V-Dash/쿠킹스튜디오/Upload_Waiting',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'ch-003',
        youtubeChannelId: 'UC_demo_channel_C',
        displayName: '여행 브이로그',
        profileImageUrl: null,
        personaConfig: {
            tone: 'casual',
            targetAudience: '여행 좋아하는 MZ세대',
            preferredWords: ['힐링', '감성', '추천'],
            informationDensity: 2,
            emotionTone: 5,
            footerText: '인스타그램에서도 만나요 @travel_vlog',
        },
        driveRootPath: '/V-Dash/여행브이로그/Upload_Waiting',
        createdAt: new Date().toISOString(),
    },
];

// 채널 아바타 색상 매핑
const AVATAR_COLORS = ['#818CF8', '#FBBF24', '#2DD4BF', '#F472B6', '#A78BFA'];

export default function ChannelOverlay() {
    const { activeChannelId, setActiveChannel, setChannels, channels } = useChannelStore();

    // 데모 채널 로드
    if (channels.length === 0) {
        // 초기 렌더 시 데모 데이터 세팅
        setTimeout(() => setChannels(DEMO_CHANNELS), 0);
    }

    // 채널이 이미 선택되어 있으면 오버레이 숨김
    if (activeChannelId) return null;

    const handleSelect = (channelId: string) => {
        setActiveChannel(channelId);
    };

    return (
        <div className="channel-overlay">
            <div className="channel-overlay__modal">
                <h2 className="channel-overlay__title">
                    작업을 시작할 채널을 선택해주세요
                </h2>
                <div className="channel-overlay__list">
                    {(channels.length > 0 ? channels : DEMO_CHANNELS).map((channel, idx) => (
                        <button
                            key={channel.id}
                            className="channel-overlay__item"
                            onClick={() => handleSelect(channel.id)}
                        >
                            <div
                                className="channel-overlay__item-avatar"
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: '#0B0E14',
                                    flexShrink: 0,
                                }}
                            >
                                {channel.displayName.charAt(0)}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div className="channel-overlay__item-name">
                                    {channel.displayName}
                                </div>
                                <div className="channel-overlay__item-id">
                                    {channel.youtubeChannelId}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
