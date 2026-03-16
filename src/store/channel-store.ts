import { create } from 'zustand';
import type { Channel } from '@/types/channel';

interface ChannelState {
    // 여러 채널을 체크박스로 필터링
    checkedChannelIds: Set<string>;
    channels: Channel[];
    isLoading: boolean;

    // 하위 호환: activeChannelId (모달 생성 시 사용)
    activeChannelId: string | null;

    setChannels: (channels: Channel[]) => void;
    toggleChannel: (channelId: string) => void;
    checkAllChannels: () => void;
    uncheckAllChannels: () => void;
    setActiveChannel: (channelId: string) => void;
    clearActiveChannel: () => void;
    getActiveChannel: () => Channel | undefined;
    getCheckedChannels: () => Channel[];
}

export const useChannelStore = create<ChannelState>((set, get) => ({
    checkedChannelIds: new Set<string>(),
    channels: [],
    isLoading: true,
    activeChannelId: null,

    setChannels: (channels: Channel[]) => {
        // 모든 채널을 기본 체크
        const allIds = new Set(channels.map(ch => ch.id));
        set({ channels, isLoading: false, checkedChannelIds: allIds });

        // 첫 번째 채널을 활성 채널로 기본 설정
        if (channels.length > 0) {
            set({ activeChannelId: channels[0].id });
        }
    },

    toggleChannel: (channelId: string) => {
        const { checkedChannelIds } = get();
        const newSet = new Set(checkedChannelIds);
        if (newSet.has(channelId)) {
            newSet.delete(channelId);
        } else {
            newSet.add(channelId);
        }
        set({ checkedChannelIds: newSet });
    },

    checkAllChannels: () => {
        const { channels } = get();
        set({ checkedChannelIds: new Set(channels.map(ch => ch.id)) });
    },

    uncheckAllChannels: () => {
        set({ checkedChannelIds: new Set<string>() });
    },

    setActiveChannel: (channelId: string) => {
        set({ activeChannelId: channelId });
    },

    clearActiveChannel: () => {
        set({ activeChannelId: null });
    },

    getActiveChannel: () => {
        const { channels, activeChannelId } = get();
        return channels.find(ch => ch.id === activeChannelId);
    },

    getCheckedChannels: () => {
        const { channels, checkedChannelIds } = get();
        return channels.filter(ch => checkedChannelIds.has(ch.id));
    },
}));
