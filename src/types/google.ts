// ─── YouTube API 응답 타입 ───
export interface YouTubeChannel {
    id: string;
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            default: { url: string };
            medium: { url: string };
            high: { url: string };
        };
    };
}

export interface YouTubeVideoStatus {
    id: string;
    status: {
        uploadStatus: string;
        privacyStatus: 'public' | 'unlisted' | 'private';
        publishAt?: string;
    };
    snippet: {
        title: string;
        thumbnails: Record<string, { url: string; width: number; height: number }>;
    };
}

// ─── Google Drive API 응답 타입 ───
export interface DriveFileChange {
    fileId: string;
    name: string;
    mimeType: string;
    parents: string[];
    createdTime: string;
}

// ─── Google Chat API 타입 ───
export interface ChatCardAction {
    actionMethodName: string;
    parameters: { key: string; value: string }[];
}

export interface ChatInteractiveEvent {
    type: 'CARD_CLICKED';
    action: ChatCardAction;
    user: {
        displayName: string;
        email: string;
    };
    space: {
        name: string;
    };
    message: {
        name: string;
    };
}

// ─── Google Calendar 타입 ───
export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    colorId?: string;
}
