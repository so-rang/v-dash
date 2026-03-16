# [PRD] V-Dash: Multi-Channel Team Collaboration & Agent System

## 1. 목적 (Purpose)

본 시스템은 다수의 채널을 운영하는 **콘텐츠 팀**을 위한 제작 관리 시스템이다. 각 채널의 고유한 페르소나를 유지하면서, 기획-촬영-업로드-분석으로 이어지는 워크플로우를 팀원들이 유기적으로 공유하고 AI 에이전트가 이를 자동화하여 제작 생산성을 극대화한다.

---

## 2. 시스템 계층 및 구조 (Structural Hierarchy)

### 2.1 Top Layer: 채널(Channel)

* **정의:** 모든 데이터의 최상위 분류 기준.
* **영향:** 채널 선택에 따라 AI의 페르소나, 업로드 대상 스튜디오, 성과 분석 기준, 팀원 권한이 완전히 분리됨.

### 2.2 Middle Layer: 단계(Stage)

* 기획(Plan) → 촬영/편집(Production) → 업로드(Upload)로 이어지는 공정.

### 2.3 Bottom Layer: 데이터(Data/Assets)

* 메타데이터, 영상 파일, 성과 지표.

---

## 3. 유저 시나리오: 팀 단위의 자동화 워크플로우

### [Scenario 01. 팀 브리핑 및 채널 컨디션 체크 (09:50 AM)]

1. **에이전트 동작:** 에이전트가 각 채널별 성과와 전체 팀 일정을 분석.
2. **구글 채팅 발송:** 팀 공용 스페이스로 브리핑 전송.
* *내용:* "현재 **[채널 A]**의 오늘 업로드 건은 촬영 완료 상태입니다. **[채널 B]**는 기획 단계에서 정체 중입니다. 어제 채널 A에 올린 영상의 초기 반응이 좋아 관련 숏폼 제작을 추천합니다."



### [Scenario 02. 채널 중심의 협업 기획 (11:00 AM)]

1. **관리자 액션:** 대시보드 상단에서 **[채널 B]** 선택. 캘린더 날짜 클릭 후 모달 오픈.
2. **역할 분담:** 관리자가 기획안 작성 후 '전구 아이콘'으로 레퍼런스 확보. 담당자로 '촬영자 김OO' 지정.
3. **데이터 상속:** 기획 정보가 촬영 단계로 상속되며, 해당 팀원의 구글 캘린더에 촬영 일정이 비비드 이전 단계(파스텔)로 즉시 등록됨.

### [Scenario 03. 분업화된 자율 업로드 (16:00 PM)]

1. **촬영/편집자 액션:** 편집 완료 영상을 드라이브의 `/V-Dash/[채널명]/Upload_Waiting` 폴더에 업로드.
2. **에이전트 감지 및 매칭:** 채널 폴더 경로와 파일명을 대조하여 해당 채널의 업로드 폼 매칭.
3. **구글 채팅 승인 루프:** 관리자에게 승인 요청 전송. 관리자가 채팅에서 **[최종 승인]** 클릭 시 채널 B로 즉시 전송 및 모든 팀원의 캘린더에서 해당 일정 **비비드(Vivid) 전환**.

---

## 4. 리포트 및 인터페이스 요구사항 (Part 1 & 2 상세)

### 4.1 상단 채널 필터 바 (Global Channel Selector)

* **위치:** 대시보드 최상단 고정.
* **기능:** 채널 선택 시 하단 캘린더 및 사이드바의 모든 데이터가 해당 채널 전용으로 스위칭됨.
* **표시 항목:** 채널 프로필 이미지, 채널명, 실시간 연결 상태.

### 4.2 캘린더 및 단계별 Bar (Team View)

* **색상 로직:**
* **Pastel (In-Progress):** 작업 진행 중. 담당자 아이콘이 Bar 좌측에 표시됨.
* **Vivid (Completed):** 업로드 완료 및 실제 라이브 상태.


* **상태 전이:** 촬영/편집 담당자가 체크 시 촬영 Bar 비비드화 -> 업로드 담당자에게 알림 발송.

### 4.3 기획/촬영/업로드 통합 모달 (The Core)

* **크기:** 가로 1/3 사이즈, 수직형 모달.
* **상단 헤더:** 현재 작업 중인 **[채널명]** 명시.
* **기획 탭:** AI 아이디어 전구(트렌드/과거 성과 복기).
* **촬영 탭:** 촬영 장소, 편집 소스 경로(URL), 담당자 지정 필드.
* **업로드 탭:** LLM 기반 설명 자동 생성(채널별 페르소나 주입), Method A 자동 매칭 스위치.

---

### [자동 생성 및 연동 원칙]

1. **채널 우선:** 모든 AI 생성 문장은 선택된 채널의 페르소나 설정을 최우선으로 따른다.
2. **데이터 동기화:** 캘린더 바 이동/수정 시 관련 팀원 전원의 구글 캘린더와 실시간 동기화된다.
3. **상태 감지:** 유튜브 API가 '공개 완료' 신호를 주면 시스템은 인간의 개입 없이 전체 공정을 '완성(Vivid)'으로 판정한다.

---

## 3. 기능 상세 명세 (Part 3. UI/UX Detail Spec)

### 3.1 채널 선택 강제 로직 (Mandatory Channel Selector)

#### 입력 데이터 및 상태

* `Active_Channel_ID`: 현재 세션에서 선택된 채널 고유값 (Initial: `null`)
* `Channel_List`: 구글 계정에 연동된 유튜브 채널 목록 데이터

#### 화면 제어 규칙

* **Case: `ID == null**`
* 대시보드 전체에 `z-index: 9999` 수준의 반투명 다크 오버레이 적용.
* 중앙에 "작업을 시작할 채널을 선택해주세요" 모달 노출.
* 채널 선택 전까지 모든 API 호출 및 페이지 진입 차단.


* **Case: `ID != null**`
* 오버레이 해제 및 해당 채널 전용 페르소나/데이터 즉시 로드.



---

### 3.2 1/3 블러 모달 및 탭 구조 (Focused Stage Modal)

#### 형식

* **크기:** 화면 우측 고정, 가로 너비 `33.3vw`, 세로 `100vh`.
* **디자인:** `backdrop-filter: blur(25px) brightness(0.6)` 적용.
* **탭 구성 (Fixed):** **[기획]** → **[촬영/편집]** → **[업로드]**.

---

### 3.3 아이디어 전구 UX (Idea Bulb Interaction)

#### 위치 및 레이아웃

* [기획] 탭 내 **'태그(Tags)' 입력 필드**와 동일한 가로 행(Row)에 위치.
* 태그 입력창 가장 우측(End-side)에 인라인 버튼 형태로 배치.

#### 출력 규칙

* **아이콘:** `Lucide: Lightbulb` (Yellow #FDE047).
* **클릭 액션:** 모달 우측으로 400px 너비의 **'아이디어 허브'** 슬라이딩 레이어 노출.
* **데이터 구성:**
* 최신 트렌드: 현재 입력된 제목 기반 구글 검색/유튜브 인기 키워드 리스트.
* 과거 성과 소재: 벡터 유사도가 높은 과거 영상 분석창 새 창 링크.



---

## 4. 에이전트 판단 및 데이터 로직 (Part 4. Intelligence Logic)

### 4.1 자율 업로드 매칭 엔진 (Method A)

#### 입력 데이터

* 감지 폴더: `/V-Dash/[Selected_Channel_Name]/Upload_Waiting/`
* 허용 확장자: **`.mp4`**, **`.mov`**
* 비교 대상: `production_stages` 테이블의 `stage_status = 'UPLOAD_READY'` 항목

#### 생성 로직 (Matching)

1. 드라이브 내 신규 파일 생성 이벤트 수신.
2. 파일명에서 확장자 제거 후 순수 텍스트와 DB 내 제목 유사도 비교.
3. 유사도 ≥ 90% 시 매칭 성공 판정.

#### 출력 (Google Chat)

* 구글 채팅방에 **인터랙티브 승인 카드** 발송.
* `[승인 및 유튜브 업로드]` / `[대시보드에서 수정]` 버튼 포함.

---

### 4.2 비비드(Vivid) 전환 자동화 규칙

#### 판단 데이터

* `youtube.videos.list(status, snippet)` 데이터

#### 판정 로직

* `privacyStatus == 'public'` **AND** `thumbnails` 생성 완료 확인 시.

#### 상태 업데이트 규칙 (Vivid 전환)

* 해당 영상 아이디와 연결된 **[기획], [촬영/편집], [업로드]** 바(Bar)의 `vivid_status`를 모두 `true`로 일괄 변경.
* UI: 채도 100% 적용 및 네온 글로우(`box-shadow`) 효과 즉시 렌더링.

---

### 4.3 채널별 페르소나 학습 및 적용

#### 학습 데이터

* 해당 유튜브 채널의 최근 50개 영상 제목, 본문 설명, 베스트 댓글 100개.

#### 분석 로직 (LLM Agent)

* 어투(문어/구어), 선호 단어, 정보 밀도, 감정 톤을 5단계 수치로 계량화.
* 결과값을 채널별 `Persona_Config` (JSON)로 저장.

#### 출력 문장 템플릿 (업로드 초안)

* `[기획 소재]를 바탕으로 [채널 페르소나] 톤을 적용하여 제목 3안과 설명문을 작성합니다.`
* 생성된 문장 하단에는 채널별 **고정 설명(Footer)**을 자동 병합하여 출력.

---

## 5. 자동 생성 원칙 (Critical Rules)

1. **채널 종속성:** 모든 데이터 수집과 문장 생성은 선택된 채널의 ID를 기준으로 샌드박스화(Sandbox)된다.
2. **파일명 무결성:** Method A 작동 시 `.mp4`와 `.mov` 외의 확장자는 무시하며 담당자에게 '지원되지 않는 포맷' 채팅을 발송한다.
3. **상태 동기화:** 캘린더에서 일정 바를 드래그하여 이동 시, 연결된 3개 탭(기획/촬영/업로드)의 모든 마감 시한이 동일한 간격으로 자동 연동된다.



## 5. 상세 데이터베이스 설계 (Part 5. Detailed DB Schema)

### 5.1 엔티티 정의 (Table Specifications)

#### **Table: `Channels` (최상위 조직)**

* `id`: UUID (Primary Key)
* `youtube_channel_id`: String (Unique) - 유튜브 API 연동 ID
* `display_name`: String - 대시보드 표시용 채널명
* `profile_image_url`: Text - 채널 프로필 이미지
* `persona_config`: JSONB - AI 에이전트용 페르소나 데이터 (톤, 타겟, 스타일 등)
* `drive_root_path`: Text - 해당 채널 전용 구글 드라이브 업로드 경로
* `created_at`: Timestamp

#### **Table: `Production_Stages` (콘텐츠 제작 단위)**

* `id`: UUID (Primary Key)
* `channel_id`: UUID (Foreign Key -> Channels.id)
* `title`: String - 기획 제목 (모든 탭 공유)
* `vivid_status`: Boolean - `true`: Vivid(완료), `false`: Pastel(진행 중)
* `current_tab`: Enum - `PLANNING`, `PRODUCTION`, `UPLOAD`
* `owner_id`: UUID (Foreign Key -> Users.id) - 담당 팀원
* `scheduled_date`: Timestamp - 업로드 예정일
* `created_at`: Timestamp

#### **Table: `Stage_Details` (탭별 상세 데이터)**

* `stage_id`: UUID (Foreign Key -> Production_Stages.id)
* **[기획 데이터]**: `concept_text`, `intent_text`, `tags` (Array), `ai_suggestions` (JSON)
* **[촬영 데이터]**: `location`, `asset_path`, `production_note`
* **[업로드 데이터]**: `final_title`, `final_description`, `method_a_active` (Boolean)
* **[파일 정보]**: `detected_file_name`, `file_extension` (`.mp4` | `.mov`), `file_size`

---

### 5.2 데이터 상태 전이 로직 (State Transition)

* **상속 규칙:** `Production_Stages.title`이 수정되면 `Stage_Details` 내의 기획/촬영/업로드 관련 모든 제목 필드에 즉시 동기화(Sync)된다.
* **Vivid 트리거:** - `Method A` 승인 후 유튜브 API에서 `Public` 상태 감지.
* 감지 시 해당 `stage_id`를 참조하는 모든 UI 컴포넌트의 `vivid_status`를 `true`로 업데이트.



---

## 6. 디자인 시스템 상세 명세 (Part 6. Design System & Interaction)

### 6.1 컬러 시스템 (Color Tokens)

#### **Core UI**

* `Background`: `#0B0E14` (Deep Space Dark)
* `Surface`: `#161B22` (Card & Modal Base)
* `Border`: `rgba(255, 255, 255, 0.08)`
* `Point (Agent)`: `#FDE047` (Electric Yellow)

#### **Status Logic (Vivid vs Pastel)**

| 구분 | 컬러 (Hex) | 효과 (CSS) |
| --- | --- | --- |
| **Pastel (Planning)** | `#818CF8` | `opacity: 0.4; filter: saturate(0.5);` |
| **Pastel (Production)** | `#FBBF24` | `opacity: 0.4; filter: saturate(0.5);` |
| **Pastel (Upload)** | `#2DD4BF` | `opacity: 0.4; filter: saturate(0.5);` |
| **Vivid (Common)** | `Specific Tone` | `opacity: 1.0; box-shadow: 0 0 12px var(--color);` |

---

### 6.2 컴포넌트별 상세 스펙

#### **1/3 Focused Modal**

* **Size:** `width: 33.33vw; height: 100vh;`
* **Animation:** `Slide-in` from `right: -100%` to `right: 0` (Duration: `400ms`, Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`)
* **Background Blur:** `backdrop-filter: blur(25px) brightness(0.6)`

#### **태그 입력창 & 아이디어 전구 (Inline Layout)**

* **Flex Container:** `display: flex; align-items: center; gap: 8px;`
* **Tag Input:** `flex-grow: 1;`
* **Lightbulb Button:**
* `width: 40px; height: 40px;`
* `background: rgba(250, 204, 21, 0.1); border-radius: 8px;`
* 아이콘: `Lucide Lightbulb` (Size: 20px)



---

### 6.3 애니메이션 및 인터랙션 로직

1. **채널 오버레이 (Lock Interaction):**
* `Active_Channel_ID`가 없을 시 화면 전체에 `blur(10px)` 처리된 다크 오버레이 표시.
* 선택 모달은 `Scale-up (0.95 -> 1.0)` 애니메이션과 함께 등장.


2. **Vivid 전환 애니메이션:**
* `vivid_status`가 `true`로 변경되는 순간, 일정 Bar 위로 전자기파가 지나가는 듯한 **'Scan-line' 효과**가 1회 노출된 후 채도와 글로우(Glow)가 상승함.


3. **아이디어 허브 슬라이딩:**
* 전구 클릭 시 모달 옆으로 레이어가 붙어 나오는 것이 아니라, 모달 자체의 너비가 `33.3vw`에서 `400px`만큼 **확장되는 느낌**으로 부드럽게 펼쳐짐.



---

## 7. 자동화 및 기술 전제 (Critical Technical Rules)

1. **파일 매칭 우선순위:** 동일 파일명이 존재할 경우, `scheduled_date`가 현재 시점과 가장 가까운 항목에 우선 매칭한다.
2. **포맷 예외 처리:** `.mp4`, `.mov` 외 파일이 드라이브에 업로드되면 즉시 구글 채팅으로 "지원되지 않는 영상 포맷이 감지되었습니다"라고 알림을 보낸다.
3. **토큰 갱신:** 유튜브 API 액세스 토큰 만료 5분 전 자동 갱신(Refresh) 로직을 포함하여 비비드 전환 감지가 끊기지 않도록 한다.

---
## 1. 목적 (Purpose)

본 시스템은 다수의 채널을 운영하는 **콘텐츠 팀**을 위한 제작 관리 시스템이다. 각 채널의 고유한 페르소나를 유지하면서, 기획-촬영-업로드-분석으로 이어지는 워크플로우를 팀원들이 유기적으로 공유하고 AI 에이전트가 이를 자동화하여 제작 생산성을 극대화한다.

---

## 2. 시스템 계층 및 구조 (Structural Hierarchy)

### 2.1 Top Layer: 채널(Channel)

* **정의:** 모든 데이터의 최상위 분류 기준.
* **영향:** 채널 선택에 따라 AI의 페르소나, 업로드 대상 스튜디오, 성과 분석 기준, 팀원 권한이 완전히 분리됨.

### 2.2 Middle Layer: 단계(Stage)

* 기획(Plan) → 촬영/편집(Production) → 업로드(Upload)로 이어지는 공정.

### 2.3 Bottom Layer: 데이터(Data/Assets)

* 메타데이터, 영상 파일, 성과 지표.

---

## 3. 유저 시나리오: 팀 단위의 자동화 워크플로우

### [Scenario 01. 팀 브리핑 및 채널 컨디션 체크 (09:50 AM)]

1. **에이전트 동작:** 에이전트가 각 채널별 성과와 전체 팀 일정을 분석.
2. **구글 채팅 발송:** 팀 공용 스페이스로 브리핑 전송.

* *내용:* "현재 **[채널 A]**의 오늘 업로드 건은 촬영 완료 상태입니다. **[채널 B]**는 기획 단계에서 정체 중입니다. 어제 채널 A에 올린 영상의 초기 반응이 좋아 관련 숏폼 제작을 추천합니다."

### [Scenario 02. 채널 중심의 협업 기획 (11:00 AM)]

1. **관리자 액션:** 대시보드 상단에서 **[채널 B]** 선택. 캘린더 날짜 클릭 후 모달 오픈.
2. **역할 분담:** 관리자가 기획안 작성 후 '전구 아이콘'으로 레퍼런스 확보. 담당자로 '촬영자 김OO' 지정.
3. **데이터 상속:** 기획 정보가 촬영 단계로 상속되며, 해당 팀원의 구글 캘린더에 촬영 일정이 비비드 이전 단계(파스텔)로 즉시 등록됨.

### [Scenario 03. 분업화된 자율 업로드 (16:00 PM)]

1. **촬영/편집자 액션:** 편집 완료 영상을 드라이브의 `/V-Dash/[채널명]/Upload_Waiting` 폴더에 업로드.
2. **에이전트 감지 및 매칭:** 채널 폴더 경로와 파일명을 대조하여 해당 채널의 업로드 폼 매칭.
3. **구글 채팅 승인 루프:** 관리자에게 승인 요청 전송. 관리자가 채팅에서 **[최종 승인]** 클릭 시 채널 B로 즉시 전송 및 모든 팀원의 캘린더에서 해당 일정 **비비드(Vivid) 전환**.

---

## 4. 리포트 및 인터페이스 요구사항 (Part 1 & 2 상세)

### 4.1 상단 채널 필터 바 (Global Channel Selector)

* **위치:** 대시보드 최상단 고정.
* **기능:** 채널 선택 시 하단 캘린더 및 사이드바의 모든 데이터가 해당 채널 전용으로 스위칭됨.
* **표시 항목:** 채널 프로필 이미지, 채널명, 실시간 연결 상태.

### 4.2 캘린더 및 단계별 Bar (Team View)

* **색상 로직:**
* **Pastel (In-Progress):** 작업 진행 중. 담당자 아이콘이 Bar 좌측에 표시됨.
* **Vivid (Completed):** 업로드 완료 및 실제 라이브 상태.


* **상태 전이:** 촬영/편집 담당자가 체크 시 촬영 Bar 비비드화 -> 업로드 담당자에게 알림 발송.

### 4.3 기획/촬영/업로드 통합 모달 (The Core)

* **크기:** 가로 1/3 사이즈, 수직형 모달.
* **상단 헤더:** 현재 작업 중인 **[채널명]** 명시.
* **기획 탭:** AI 아이디어 전구(트렌드/과거 성과 복기).
* **촬영 탭:** 촬영 장소, 편집 소스 경로(URL), 담당자 지정 필드.
* **업로드 탭:** LLM 기반 설명 자동 생성(채널별 페르소나 주입), Method A 자동 매칭 스위치.

---

## 5. 기능 상세 명세 (Part 3. UI/UX Detail Spec)

### 5.1 채널 선택 강제 로직 (Mandatory Channel Selector)

#### 입력 데이터 및 상태

* `Active_Channel_ID`: 현재 세션에서 선택된 채널 고유값 (Initial: `null`)
* `Channel_List`: 구글 계정에 연동된 유튜브 채널 목록 데이터

#### 화면 제어 규칙

* **Case: `ID == null**`
* 대시보드 전체에 `z-index: 9999` 수준의 반투명 다크 오버레이 적용.
* 중앙에 "작업을 시작할 채널을 선택해주세요" 모달 노출.
* 채널 선택 전까지 모든 API 호출 및 페이지 진입 차단.


* **Case: `ID != null**`
* 오버레이 해제 및 해당 채널 전용 페르소나/데이터 즉시 로드.



### 5.2 1/3 블러 모달 및 탭 구조 (Focused Stage Modal)

#### 형식

* **크기:** 화면 우측 고정, 가로 너비 `33.3vw`, 세로 `100vh`.
* **디자인:** `backdrop-filter: blur(25px) brightness(0.6)` 적용.
* **탭 구성 (Fixed):** **[기획]** → **[촬영/편집]** → **[업로드]**.

### 5.3 아이디어 전구 UX (Idea Bulb Interaction)

#### 위치 및 레이아웃

* [기획] 탭 내 **'태그(Tags)' 입력 필드**와 동일한 가로 행(Row)에 위치.
* 태그 입력창 가장 우측(End-side)에 인라인 버튼 형태로 배치.

#### 출력 규칙

* **아이콘:** `Lucide: Lightbulb` (Yellow #FDE047).
* **클릭 액션:** 모달 우측으로 400px 너비의 **'아이디어 허브'** 슬라이딩 레이어 노출.
* **데이터 구성:**
* 최신 트렌드: 현재 입력된 제목 기반 구글 검색/유튜브 인기 키워드 리스트.
* 과거 성과 소재: 벡터 유사도가 높은 과거 영상 분석창 새 창 링크.



---

## 6. 에이전트 판단 및 데이터 로직 (Part 4. Intelligence Logic)

### 6.1 자율 업로드 매칭 엔진 (Method A)

#### 입력 데이터

* 감지 폴더: `/V-Dash/[Selected_Channel_Name]/Upload_Waiting/`
* 허용 확장자: **`.mp4`**, **`.mov`**
* 비교 대상: `production_stages` 테이블의 `stage_status = 'UPLOAD_READY'` 항목

#### 생성 로직 (Matching)

1. 드라이브 내 신규 파일 생성 이벤트 수신.
2. 파일명에서 확장자 제거 후 순수 텍스트와 DB 내 제목 유사도 비교.
3. 유사도 ≥ 90% 시 매칭 성공 판정.

#### 출력 (Google Chat)

* 구글 채팅방에 **인터랙티브 승인 카드** 발송.
* `[승인 및 유튜브 업로드]` / `[대시보드에서 수정]` 버튼 포함.

### 6.2 비비드(Vivid) 전환 자동화 규칙

#### 판단 데이터

* `youtube.videos.list(status, snippet)` 데이터

#### 판정 로직

* `privacyStatus == 'public'` **AND** `thumbnails` 생성 완료 확인 시.

#### 상태 업데이트 규칙 (Vivid 전환)

* 해당 영상 아이디와 연결된 **[기획], [촬영/편집], [업로드]** 바(Bar)의 `vivid_status`를 모두 `true`로 일괄 변경.
* UI: 채도 100% 적용 및 네온 글로우(`box-shadow`) 효과 즉시 렌더링.

### 6.3 채널별 페르소나 학습 및 적용

#### 학습 데이터

* 해당 유튜브 채널의 최근 50개 영상 제목, 본문 설명, 베스트 댓글 100개.

#### 분석 로직 (LLM Agent)

* 어투(문어/구어), 선호 단어, 정보 밀도, 감정 톤을 5단계 수치로 계량화.
* 결과값을 채널별 `Persona_Config` (JSON)로 저장.

#### 출력 문장 템플릿 (업로드 초안)

* `[기획 소재]를 바탕으로 [채널 페르소나] 톤을 적용하여 제목 3안과 설명문을 작성합니다.`
* 생성된 문장 하단에는 채널별 **고정 설명(Footer)**을 자동 병합하여 출력.

---

## 7. 상세 데이터베이스 설계 (Part 5. Detailed DB Schema)

### 7.1 엔티티 정의 (Table Specifications)

#### **Table: `Channels` (최상위 조직)**

* `id`: UUID (Primary Key)
* `youtube_channel_id`: String (Unique) - 유튜브 API 연동 ID
* `display_name`: String - 대시보드 표시용 채널명
* `profile_image_url`: Text - 채널 프로필 이미지
* `persona_config`: JSONB - AI 에이전트용 페르소나 데이터 (톤, 타겟, 스타일 등)
* `drive_root_path`: Text - 해당 채널 전용 구글 드라이브 업로드 경로
* `created_at`: Timestamp

#### **Table: `Production_Stages` (콘텐츠 제작 단위)**

* `id`: UUID (Primary Key)
* `channel_id`: UUID (Foreign Key -> Channels.id)
* `title`: String - 기획 제목 (모든 탭 공유)
* `vivid_status`: Boolean - `true`: Vivid(완료), `false`: Pastel(진행 중)
* `current_tab`: Enum - `PLANNING`, `PRODUCTION`, `UPLOAD`
* `owner_id`: UUID (Foreign Key -> Users.id) - 담당 팀원
* `scheduled_date`: Timestamp - 업로드 예정일
* `created_at`: Timestamp

#### **Table: `Stage_Details` (탭별 상세 데이터)**

* `stage_id`: UUID (Foreign Key -> Production_Stages.id)
* **[기획 데이터]**: `concept_text`, `intent_text`, `tags` (Array), `ai_suggestions` (JSON)
* **[촬영 데이터]**: `location`, `asset_path`, `production_note`
* **[업로드 데이터]**: `final_title`, `final_description`, `method_a_active` (Boolean)
* **[파일 정보]**: `detected_file_name`, `file_extension` (`.mp4` | `.mov`), `file_size`

### 7.2 데이터 상태 전이 로직 (State Transition)

* **상속 규칙:** `Production_Stages.title`이 수정되면 `Stage_Details` 내의 기획/촬영/업로드 관련 모든 제목 필드에 즉시 동기화(Sync)된다.
* **Vivid 트리거:**
* `Method A` 승인 후 유튜브 API에서 `Public` 상태 감지.
* 감지 시 해당 `stage_id`를 참조하는 모든 UI 컴포넌트의 `vivid_status`를 `true`로 업데이트.



---

## 8. 디자인 시스템 상세 명세 (Part 6. Design System & Interaction)

### 8.1 컬러 시스템 (Color Tokens)

#### **Core UI**

* `Background`: `#0B0E14` (Deep Space Dark)
* `Surface`: `#161B22` (Card & Modal Base)
* `Border`: `rgba(255, 255, 255, 0.08)`
* `Point (Agent)`: `#FDE047` (Electric Yellow)

#### **Status Logic (Vivid vs Pastel)**

| 구분 | 컬러 (Hex) | 효과 (CSS) |
| --- | --- | --- |
| **Pastel (Planning)** | `#818CF8` | `opacity: 0.4; filter: saturate(0.5);` |
| **Pastel (Production)** | `#FBBF24` | `opacity: 0.4; filter: saturate(0.5);` |
| **Pastel (Upload)** | `#2DD4BF` | `opacity: 0.4; filter: saturate(0.5);` |
| **Vivid (Common)** | `Specific Tone` | `opacity: 1.0; box-shadow: 0 0 12px var(--color);` |

### 8.2 컴포넌트별 상세 스펙

#### **1/3 Focused Modal**

* **Size:** `width: 33.33vw; height: 100vh;`
* **Animation:** `Slide-in` from `right: -100%` to `right: 0` (Duration: `400ms`, Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`)
* **Background Blur:** `backdrop-filter: blur(25px) brightness(0.6)`

#### **태그 입력창 & 아이디어 전구 (Inline Layout)**

* **Flex Container:** `display: flex; align-items: center; gap: 8px;`
* **Tag Input:** `flex-grow: 1;`
* **Lightbulb Button:**
* `width: 40px; height: 40px;`
* `background: rgba(250, 204, 21, 0.1); border-radius: 8px;`
* 아이콘: `Lucide Lightbulb` (Size: 20px)



### 8.3 애니메이션 및 인터랙션 로직

1. **채널 오버레이 (Lock Interaction):**
* `Active_Channel_ID`가 없을 시 화면 전체에 `blur(10px)` 처리된 다크 오버레이 표시.
* 선택 모달은 `Scale-up (0.95 -> 1.0)` 애니메이션과 함께 등장.


2. **Vivid 전환 애니메이션:**
* `vivid_status`가 `true`로 변경되는 순간, 일정 Bar 위로 전자기파가 지나가는 듯한 **'Scan-line' 효과**가 1회 노출된 후 채도와 글로우(Glow)가 상승함.


3. **아이디어 허브 슬라이딩:**
* 전구 클릭 시 모달 옆으로 레이어가 붙어 나오는 것이 아니라, 모달 자체의 너비가 `33.3vw`에서 `400px`만큼 **확장되는 느낌**으로 부드럽게 펼쳐짐.



---

## 9. 자동화 및 기술 전제 (Critical Technical Rules)

1. **파일 매칭 우선순위:** 동일 파일명이 존재할 경우, `scheduled_date`가 현재 시점과 가장 가까운 항목에 우선 매칭한다.
2. **포맷 예외 처리:** `.mp4`, `.mov` 외 파일이 드라이브에 업로드되면 즉시 구글 채팅으로 "지원되지 않는 영상 포맷이 감지되었습니다"라고 알림을 보낸다.
3. **토큰 갱신:** 유튜브 API 액세스 토큰 만료 5분 전 자동 갱신(Refresh) 로직을 포함하여 비비드 전환 감지가 끊기지 않도록 한다.

맞습니다. 앞선 10부작 계획 중 아직 다루지 않은 **[Part 7. 성과 분석 차트 로직]**, **[Part 8. 구글 채팅 메시지 템플릿 명세]**, 그리고 **[Part 9. 시스템 보안 및 성능 제약]**이 남았습니다.

Antigravity 에이전트가 데이터 시각화와 외부 메시징 규격까지 완벽히 구현할 수 있도록 이어서 작성합니다.

---

## 10. 성과 분석 및 인사이트 로직 (Part 7. Advanced Analytics)

### 10.1 숏폼-롱폼 전환 깔때기 (Conversion Funnel)

#### 데이터 수집 (YouTube Analytics API)

* `trafficSourceDetail`: 'Related videos' 및 'Shorts feed' 유입 경로 데이터 필터링.
* `linked_video_id`: 숏폼 기획 시 연결된 롱폼의 ID.

#### 분석 로직

* **전환수(Conversion):** 숏폼 시청 중 하단 링크를 클릭하여 롱폼으로 이동한 순수 클릭 수.
* **기여도 점수:** `(전환수 / 숏폼 총 조회수) * 100`으로 산출.
* **출력:** 대시보드 내 숏폼-롱폼 연결 그래프 및 전환율 백분율 표시.

### 10.2 댓글 감정 분석 및 피드백 (Sentiment Analysis)

#### 분석 데이터

* 업로드 후 48시간 이내의 상위 100개 댓글 텍스트.

#### 판정 로직 (LLM Agent)

* 기획 단계의 `intent_text`(제작 의도)와 실제 댓글의 감정 톤을 대조.
* **일치도:** 의도했던 키워드(예: '감동', '정보성')가 댓글에 등장하는 비율 계산.
* **결과값:** "시청자들은 기획 의도보다 [특정 요소]에 더 강하게 반응하고 있습니다"라는 요약 문장 생성.

---

## 11. 구글 채팅 메시지 컴포넌트 명세 (Part 8. Message Templates)

### 11.1 [Template A] 09:50 정기 브리핑

#### 구성 요소

* **Header:** "📅 [채널명] 오늘의 제작 현황" (Text + Icon)
* **Section 1 (D-Day):** 오늘 업로드 예정인 `title` 리스트와 현재 단계 표시.
* **Section 2 (Performance):** 어제 비비드(Vivid) 전환된 영상의 24시간 조회수 및 감정 분석 요약.
* **Section 3 (Guide):** 기상 API 연동(촬영지 날씨) 및 트렌드 키워드 제안.

### 11.2 [Template B] Method A 업로드 승인 카드

#### 구성 요소

* **Title:** "🚀 영상 업로드 승인 요청"
* **Body:** - 파일명: `detected_file_name`
* 확장자: `.mp4` / `.mov`
* 매칭된 기획: `title`


* **Buttons:**
* `[승인 및 유튜브 업로드]`: 클릭 시 즉시 전송 API 호출.
* `[대시보드에서 수정]`: 대시보드 상세 모달로 딥링크(Deep-link) 연결.
* `[거절]`: 파일 무시 및 드라이브 내 '보류' 폴더로 이동.



---

## 12. 시스템 보안 및 성능 제약 (Part 9. Security & Performance)

### 12.1 권한 및 데이터 보호

* **Multi-Tenant 구조:** 채널 간 데이터 간섭을 원천 차단하기 위해 모든 쿼리에 `channel_id` 필터를 필수로 포함한다.
* **API Quota 관리:** 유튜브 API 할당량 소진을 방지하기 위해 실시간 폴링 외에 중요 상태(Vivid 전환 등)는 지수 백오프(Exponential Backoff) 방식을 적용한다.

### 12.2 예외 상황 대응 (Error Handling)

* **파일명 중복:** 동일 채널 내 동일 파일명 감지 시, 구글 채팅으로 "중복된 파일명이 있습니다. 매칭할 기획을 선택해주세요"라는 인터랙티브 리스트를 발송한다.
* **네트워크 단절:** 유튜브 전송 중 단절 시, `resumable upload` 기능을 활용하여 마지막 중단 지점부터 재시도(최대 3회)한다.

### 12.3 데이터 복구 (Recycle Bin)

* **Soft Delete:** 사용자가 일정을 삭제할 경우 DB에서 즉시 삭제하지 않고 `deleted_at` 컬럼에 타임스탬프를 기록한다.
* **복구 기간:** 삭제 후 30일 동안은 대시보드 하단 '휴지통' 메뉴에서 복구 가능하다.

---

## 13. 최종 자동화 아키텍처 가이드 (For Antigravity)

1. **상태 동기화:** Antigravity는 UI 상태 관리 라이브러리를 통해 한 화면에서 채널을 바꾸면 모든 차트와 캘린더가 300ms 이내에 갱신되도록 최적화해야 한다.
2. **에이전트 자율성:** 에이전트는 사용자가 묻기 전에 **'파일 업로드 완료'**, **'성과 급증'**, **'일정 지연'** 상황에서 구글 채팅으로 먼저 말을 걸어야 한다.
3. **환경 변수:** 모든 API 키(Google, YouTube, OpenAI)는 `.env`로 관리하며 실무 환경과 개발 환경을 분리한다.