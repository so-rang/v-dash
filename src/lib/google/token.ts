/**
 * Google API 토큰 자동 갱신 유틸리티
 * PRD 7조: 유튜브 API 액세스 토큰 만료 5분 전 자동 갱신(Refresh)
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Credentials } from 'google-auth-library';

let cachedOAuth2Client: OAuth2Client | null = null;

export function getOAuth2Client() {
    if (cachedOAuth2Client) return cachedOAuth2Client;

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    // 토큰 만료 5분 전 자동 갱신 리스너
    oauth2Client.on('tokens', (tokens: Credentials) => {
        if (tokens.refresh_token) {
            // refresh_token은 첫 인증 시에만 발급됨, 안전하게 저장
            console.log('[TOKEN] Refresh token received');
        }
        if (tokens.access_token) {
            console.log('[TOKEN] Access token refreshed');
        }
    });

    cachedOAuth2Client = oauth2Client;
    return oauth2Client;
}

/**
 * 토큰 설정 (NextAuth 세션에서 가져온 토큰으로 설정)
 */
export function setCredentials(tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
}) {
    const client = getOAuth2Client();
    client.setCredentials(tokens);
    return client;
}

/**
 * 토큰 갱신 필요 여부 체크 (만료 5분 전)
 */
export function needsRefresh(expiryDate: number): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > expiryDate - fiveMinutes;
}

