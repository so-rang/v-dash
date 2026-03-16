export interface Channel {
    id: string;
    youtubeChannelId: string;
    displayName: string;
    profileImageUrl: string | null;
    personaConfig: PersonaConfig | null;
    driveRootPath: string | null;
    createdAt: string;
}

export interface PersonaConfig {
    tone: 'formal' | 'casual' | 'mixed';
    targetAudience: string;
    preferredWords: string[];
    informationDensity: number; // 1-5
    emotionTone: number; // 1-5
    footerText: string;
}

export interface ChannelMember {
    id: string;
    channelId: string;
    userId: string;
    role: 'ADMIN' | 'EDITOR' | 'MEMBER';
    joinedAt: string;
}
