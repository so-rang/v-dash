/**
 * 문자열 유사도 비교 (Dice Coefficient)
 * Method A 파일명 ↔ DB 제목 매칭에 사용
 */

function bigrams(str: string): Set<string> {
    const s = str.toLowerCase().replace(/\s+/g, '');
    const pairs = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
        pairs.add(s.substring(i, i + 2));
    }
    return pairs;
}

export function diceCoefficient(a: string, b: string): number {
    const aBigrams = bigrams(a);
    const bBigrams = bigrams(b);

    if (aBigrams.size === 0 && bBigrams.size === 0) return 1;
    if (aBigrams.size === 0 || bBigrams.size === 0) return 0;

    let intersectionCount = 0;
    for (const bigram of aBigrams) {
        if (bBigrams.has(bigram)) intersectionCount++;
    }

    return (2 * intersectionCount) / (aBigrams.size + bBigrams.size);
}

/**
 * 파일명에서 확장자를 제거하고 순수 텍스트 추출
 */
export function extractFileBaseName(fileName: string): string {
    return fileName.replace(/\.(mp4|mov)$/i, '').trim();
}

/**
 * 허용 확장자 체크
 */
export function isAllowedExtension(fileName: string): boolean {
    return /\.(mp4|mov)$/i.test(fileName);
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(fileName: string): '.mp4' | '.mov' | null {
    const match = fileName.match(/\.(mp4|mov)$/i);
    if (!match) return null;
    return `.${match[1].toLowerCase()}` as '.mp4' | '.mov';
}
