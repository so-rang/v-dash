'use client';

import { useChannelStore } from '@/store/channel-store';
import { ChevronDown } from 'lucide-react';

const AVATAR_COLORS: Record<string, string> = {
    'ch-001': '#818CF8',
    'ch-002': '#FBBF24',
    'ch-003': '#2DD4BF',
};

export default function ChannelSelector() {
    const { activeChannelId, channels, clearActiveChannel } = useChannelStore();
    const activeChannel = channels.find(ch => ch.id === activeChannelId);

    return (
        <header className="channel-bar">
            <div className="channel-bar__left">
                <span className="channel-bar__logo">V-Dash</span>
                {activeChannel && (
                    <button
                        className="channel-bar__selector"
                        onClick={clearActiveChannel}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: AVATAR_COLORS[activeChannel.id] || '#818CF8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0B0E14',
                                flexShrink: 0,
                            }}
                        >
                            {activeChannel.displayName.charAt(0)}
                        </div>
                        <span className="channel-bar__name">
                            {activeChannel.displayName}
                        </span>
                        <span className="channel-bar__status" />
                        <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date().toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                    })}
                </span>
            </div>
        </header>
    );
}
