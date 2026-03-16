/**
 * Method A 자율 업로드 매칭 엔진
 *
 * 1. Google Drive에서 감지된 파일명과 DB 내 제목을 유사도 비교
 * 2. 유사도 ≥ 90% 시 매칭 성공
 * 3. 동일 파일명 중복 시 scheduled_date 근접순 우선
 */

import {
    diceCoefficient,
    extractFileBaseName,
    isAllowedExtension,
    getFileExtension,
} from '@/lib/utils/similarity';

export interface MatchCandidate {
    stageId: string;
    title: string;
    scheduledDate: string | null;
    channelId: string;
}

export interface MatchResult {
    matched: boolean;
    stageId: string | null;
    similarity: number;
    fileName: string;
    fileExtension: '.mp4' | '.mov' | null;
    errorCode?: 'UNSUPPORTED_FORMAT' | 'NO_MATCH' | 'DUPLICATE';
}

/**
 * 파일명을 DB 내 UPLOAD_READY 상태의 Stage 제목들과 비교하여 매칭
 */
export function matchFileToStage(
    fileName: string,
    candidates: MatchCandidate[],
    threshold = 0.9
): MatchResult {
    // 1. 확장자 체크
    if (!isAllowedExtension(fileName)) {
        return {
            matched: false,
            stageId: null,
            similarity: 0,
            fileName,
            fileExtension: null,
            errorCode: 'UNSUPPORTED_FORMAT',
        };
    }

    const baseName = extractFileBaseName(fileName);
    const fileExt = getFileExtension(fileName);

    // 2. 모든 후보와 유사도 비교
    const scored = candidates.map(candidate => ({
        ...candidate,
        similarity: diceCoefficient(baseName, candidate.title),
    }));

    // 3. 유사도 내림차순 정렬, 동일 유사도 시 scheduled_date 근접순
    const now = Date.now();
    scored.sort((a, b) => {
        if (b.similarity !== a.similarity) return b.similarity - a.similarity;
        // scheduled_date가 현재 시점에 가까운 항목 우선
        const aDist = a.scheduledDate
            ? Math.abs(new Date(a.scheduledDate).getTime() - now)
            : Infinity;
        const bDist = b.scheduledDate
            ? Math.abs(new Date(b.scheduledDate).getTime() - now)
            : Infinity;
        return aDist - bDist;
    });

    const best = scored[0];

    if (!best || best.similarity < threshold) {
        return {
            matched: false,
            stageId: null,
            similarity: best?.similarity || 0,
            fileName,
            fileExtension: fileExt,
            errorCode: 'NO_MATCH',
        };
    }

    return {
        matched: true,
        stageId: best.stageId,
        similarity: best.similarity,
        fileName,
        fileExtension: fileExt,
    };
}
