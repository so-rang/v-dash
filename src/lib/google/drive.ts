/**
 * Google Drive API 래퍼
 * - 폴더 감시 (Changes API)
 * - 파일 이동 (거절 시 보류 폴더로)
 */

import { google } from 'googleapis';
import { getOAuth2Client } from './token';

const drive = google.drive('v3');

/**
 * 특정 폴더 내 파일 목록 조회
 */
export async function listFilesInFolder(folderId: string) {
    const auth = getOAuth2Client();
    const response = await drive.files.list({
        auth,
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, createdTime, size)',
        orderBy: 'createdTime desc',
    });
    return response.data.files || [];
}

/**
 * 변경사항 감시를 위한 start page token 가져오기
 */
export async function getStartPageToken(): Promise<string> {
    const auth = getOAuth2Client();
    const response = await drive.changes.getStartPageToken({ auth });
    return response.data.startPageToken || '';
}

/**
 * 변경사항 조회 (폴링 방식)
 */
export async function listChanges(pageToken: string) {
    const auth = getOAuth2Client();
    const response = await drive.changes.list({
        auth,
        pageToken,
        fields: 'newStartPageToken, changes(fileId, file(name, mimeType, parents, createdTime))',
        includeRemoved: false,
    });

    return {
        changes: response.data.changes || [],
        newPageToken: response.data.newStartPageToken || pageToken,
    };
}

/**
 * 파일을 다른 폴더로 이동 (거절 시 보류 폴더)
 */
export async function moveFile(
    fileId: string,
    currentParentId: string,
    newParentId: string
) {
    const auth = getOAuth2Client();
    await drive.files.update({
        auth,
        fileId,
        addParents: newParentId,
        removeParents: currentParentId,
    });
}

/**
 * 파일 다운로드 스트림 가져오기 (YouTube 업로드용)
 */
export async function getFileStream(fileId: string) {
    const auth = getOAuth2Client();
    const response = await drive.files.get(
        { auth, fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    return response.data;
}
