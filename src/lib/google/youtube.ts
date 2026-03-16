/**
 * YouTube Data API 래퍼
 * - 채널 목록 조회
 * - 영상 공개 상태 체크 (Vivid 전환 감지)
 * - 영상 업로드
 */

import { google } from 'googleapis';
import { createOAuth2Client } from './token';

const youtube = google.youtube('v3');

/**
 * 사용자의 YouTube 채널 목록 조회
 */
export async function listMyChannels() {
    const auth = createOAuth2Client();
    const response = await youtube.channels.list({
        auth,
        part: ['snippet', 'statistics'],
        mine: true,
        maxResults: 50,
    });
    return response.data.items || [];
}

/**
 * 영상 공개 상태 확인 (Vivid 전환 판단)
 * privacyStatus === 'public' && thumbnails 존재 시 Vivid
 */
export async function checkVideoPublicStatus(videoId: string): Promise<{
    isPublic: boolean;
    hasThumbnails: boolean;
    shouldVivid: boolean;
}> {
    const auth = createOAuth2Client();
    const response = await youtube.videos.list({
        auth,
        part: ['status', 'snippet'],
        id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
        return { isPublic: false, hasThumbnails: false, shouldVivid: false };
    }

    const isPublic = video.status?.privacyStatus === 'public';
    const hasThumbnails = Boolean(video.snippet?.thumbnails?.default?.url);
    const shouldVivid = isPublic && hasThumbnails;

    return { isPublic, hasThumbnails, shouldVivid };
}

/**
 * 채널의 최근 영상 50개 조회 (페르소나 학습용)
 */
export async function listRecentVideos(channelId: string) {
    const auth = createOAuth2Client();
    const response = await youtube.search.list({
        auth,
        part: ['snippet'],
        channelId,
        maxResults: 50,
        order: 'date',
        type: ['video'],
    });
    return response.data.items || [];
}

/**
 * 영상 댓글 조회 (감정 분석용)
 */
export async function listVideoComments(videoId: string, maxResults = 100) {
    const auth = createOAuth2Client();
    const response = await youtube.commentThreads.list({
        auth,
        part: ['snippet'],
        videoId,
        maxResults,
        order: 'relevance',
    });
    return (
        response.data.items?.map(
            item => item.snippet?.topLevelComment?.snippet?.textOriginal || ''
        ) || []
    );
}
