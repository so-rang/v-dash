/**
 * 채널별 페르소나 학습 및 적용 로직
 *
 * - 유튜브 채널의 최근 50개 영상 데이터 기반
 * - 어투, 선호 단어, 정보 밀도, 감정 톤 분석
 * - Persona_Config JSON 생성
 */

import type { PersonaConfig } from '@/types/channel';

export interface PersonaAnalysisInput {
    videoTitles: string[];
    videoDescriptions: string[];
    topComments: string[];
}

/**
 * 페르소나 분석용 LLM 프롬프트 생성
 */
export function buildPersonaPrompt(input: PersonaAnalysisInput): string {
    return `당신은 유튜브 채널 분석 전문가입니다. 아래 데이터를 분석하여 채널의 페르소나를 JSON으로 출력하세요.

## 분석 대상 데이터

### 최근 영상 제목 (${input.videoTitles.length}개)
${input.videoTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

### 영상 설명 샘플 (상위 ${Math.min(input.videoDescriptions.length, 5)}개)
${input.videoDescriptions.slice(0, 5).map((d, i) => `${i + 1}. ${d.substring(0, 200)}`).join('\n')}

### 베스트 댓글 (상위 ${Math.min(input.topComments.length, 20)}개)
${input.topComments.slice(0, 20).map((c, i) => `${i + 1}. ${c}`).join('\n')}

## 출력 형식 (JSON)
{
  "tone": "formal" | "casual" | "mixed",  // 어투 분석
  "targetAudience": "string",             // 추정 타겟 시청자
  "preferredWords": ["string", ...],      // 자주 사용하는 단어 Top 10
  "informationDensity": 1-5,              // 1=가벼움, 5=매우 밀도높음
  "emotionTone": 1-5,                     // 1=차분, 5=매우 감정적
  "footerText": "string"                  // 고정 설명문 패턴
}

JSON만 출력하세요.`;
}

/**
 * 페르소나 기반 콘텐츠 생성 프롬프트
 */
export function buildContentPrompt(
    persona: PersonaConfig,
    concept: string,
    intent: string
): string {
    return `당신은 유튜브 콘텐츠 작성자입니다. 아래 채널 페르소나에 맞춰 제목 3안과 설명문을 작성하세요.

## 채널 페르소나
- 어투: ${persona.tone === 'formal' ? '문어체' : persona.tone === 'casual' ? '구어체' : '혼합'}
- 타겟: ${persona.targetAudience}
- 선호 단어: ${persona.preferredWords.join(', ')}
- 정보 밀도: ${persona.informationDensity}/5
- 감정 톤: ${persona.emotionTone}/5

## 기획 소재
${concept}

## 제작 의도
${intent}

## 출력 형식
### 제목 안 (3개)
1. [제목1]
2. [제목2]
3. [제목3]

### 설명문
[영상 설명문 작성]

---
${persona.footerText}`;
}

/**
 * 기본 페르소나 생성 (분석 전 초기값)
 */
export function createDefaultPersona(): PersonaConfig {
    return {
        tone: 'casual',
        targetAudience: '전 연령대',
        preferredWords: [],
        informationDensity: 3,
        emotionTone: 3,
        footerText: '',
    };
}
