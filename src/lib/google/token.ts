/**
 * Google API 토큰 자동 갱신 유틸리티
 * PRD 7조: 유튜브 API 액세스 토큰 만료 5분 전 자동 갱신(Refresh)
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Credentials } from 'google-auth-library';
import { prisma } from '@/lib/prisma';

/**
 * 새로운 OAuth2 클라이언트 인스턴스를 생성합니다.
 * (주의: 서버 환경에서 여러 사용자가 동시에 요청할 때 credentials가 덮어씌워지지 않도록 매번 새 인스턴스를 생성해야 합니다.)
 */
export function createOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );
}

/**
 * 로그인된 사용자의 ID를 기반으로 인증된 OAuth2Client를 반환합니다.
 */
export async function getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const account = await prisma.account.findFirst({
        where: {
            userId,
            provider: 'google',
        },
    });

    if (!account || !account.access_token) {
        throw new Error('Google account not connected or access token missing');
    }

    const oauth2Client = createOAuth2Client();
    
    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // 토큰 만료 시 자동 갱신 리스너
    oauth2Client.on('tokens', async (tokens: Credentials) => {
        if (tokens.access_token) {
            console.log(`[TOKEN] Access token refreshed for user ${userId}`);
            
            // Prisma DB 업데이트
            const updateData: any = {
                access_token: tokens.access_token,
            };
            if (tokens.expiry_date) {
                updateData.expires_at = Math.floor(tokens.expiry_date / 1000);
            }
            if (tokens.refresh_token) {
                updateData.refresh_token = tokens.refresh_token;
                console.log(`[TOKEN] Refresh token received for user ${userId}`);
            }

            await prisma.account.update({
                where: {
                    provider_providerAccountId: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                },
                data: updateData,
            });
        }
    });

    return oauth2Client;
}

/**
 * 토큰 갱신 필요 여부 체크 (만료 5분 전)
 */
export function needsRefresh(expiryDate: number): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > expiryDate - fiveMinutes;
}

