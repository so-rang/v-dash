/**
 * 배포가 실패하면 GitHub 이슈로 알린다 — so-rang 의 Vercel 연결 저장소들이 같은 파일을 그대로 나눠 쓴다.
 * 원본과 테스트는 so-rang/loere-clinic(`scripts/deploy-failure-alert.test.mjs`)에 있다. 고칠 때는 원본을 고치고 각 저장소에 다시 복사한다.
 *
 * `.github/workflows/deploy-failure-alert.yml` 이 actions/github-script 로 `run()` 을 부른다. 두 가지 이벤트를 받는다.
 *
 *   - status       — Vercel GitHub 연동이 커밋마다 남기는 `Vercel` 상태(pending → success · failure · error).
 *                    GitHub "배포(deployment)" 기록은 프로젝트에 따라 없기도 하지만 이 상태는 연결된 저장소 어디에나 있다.
 *   - workflow_run — 배포 뒤 도는 워크플로(예: loere-clinic 「Warm image cache」)가 끝났을 때. 저장소마다 YAML 에서 고른다.
 *
 * 실패하면 `deploy-failure` 라벨을 붙인 이슈를 열고 저장소 주인에게 배정한다 — GitHub 메일과 GitHub 모바일 앱 알림으로 온다.
 * 같은 곳이 또 실패하면 새 이슈 대신 열린 이슈에 댓글을 단다. 같은 곳이 다음에 성공하면 댓글을 남기고 닫는다.
 * "같은 곳"은 본문 맨 위 숨은 표식(`<!-- deploy-failure-alert: … -->`)으로 가린다 — Vercel 프로젝트마다 Production 하나,
 * Preview 는 브랜치마다, 워크플로는 이름마다 이슈 하나다.
 *
 * Production 과 Preview 는 커밋이 기본 브랜치에 들어 있는지로 가른다(status 이벤트에는 환경 이름이 없다).
 * 외부 패키지를 쓰지 않는다 — github-script 가 넘겨 주는 `github`(Octokit) · `context` · `core` 만 쓴다.
 */

export const LABEL = "deploy-failure";
export const LABEL_COLOR = "d73a4a";

const FAILED_STATES = new Set(["failure", "error"]);
const FAILED_WORKFLOW_CONCLUSIONS = new Set(["failure", "timed_out", "startup_failure"]);
const MARKER_PATTERN = /<!-- deploy-failure-alert: (.+?) -->/;
const INSPECTOR_PATTERN = /^https:\/\/vercel\.com\/([^/]+)\/([^/]+)\/([A-Za-z0-9]+)\/?$/;

export function marker(key) {
  return `<!-- deploy-failure-alert: ${key} -->`;
}

export function keyFromBody(body) {
  return MARKER_PATTERN.exec(body ?? "")?.[1] ?? null;
}

/** Vercel 상태의 target_url(`https://vercel.com/<팀>/<프로젝트>/<배포 ID>`)에서 팀 · 프로젝트 · 배포 ID 를 꺼낸다. */
export function parseVercelInspectorUrl(url) {
  const match = INSPECTOR_PATTERN.exec(url ?? "");
  if (!match) return null;
  return { team: match[1], project: match[2], deploymentId: `dpl_${match[3]}` };
}

/** 커밋이 들어 있는 브랜치 중 하나를 고른다. 기본 브랜치에 들어 있으면 Production 이다. */
export function pickBranch(names, defaultBranch) {
  if (names.length === 0) return { branch: null, production: false };
  if (names.includes(defaultBranch)) return { branch: defaultBranch, production: true };
  return { branch: [...names].sort()[0], production: false };
}

/**
 * 이벤트를 알림에 필요한 값으로 줄인다. `action` 은 open(이슈를 연다) · resolve(열린 이슈를 닫는다) · ignore 중 하나다.
 */
export function readEvent(eventName, payload) {
  const defaultBranch = payload?.repository?.default_branch ?? "main";

  if (eventName === "status") {
    const state = payload?.state;
    const context = payload?.context ?? "";
    if (!context.startsWith("Vercel")) return { kind: "status", action: "ignore", state, context };
    const vercel = parseVercelInspectorUrl(payload.target_url);
    const { branch, production } = pickBranch(
      (payload.branches ?? []).map((item) => item.name),
      defaultBranch,
    );
    return {
      kind: "vercel",
      action: FAILED_STATES.has(state) ? "open" : state === "success" ? "resolve" : "ignore",
      state,
      context,
      project: vercel?.project ?? context,
      team: vercel?.team ?? null,
      deploymentId: vercel?.deploymentId ?? null,
      environment: production ? "Production" : "Preview",
      branch,
      sha: payload.sha ?? "",
      commitMessage: payload.commit?.commit?.message ?? null,
      description: payload.description ?? "",
      url: payload.target_url ?? "",
      at: payload.updated_at ?? payload.created_at ?? null,
    };
  }

  if (eventName === "workflow_run") {
    const workflowRun = payload?.workflow_run ?? {};
    const conclusion = workflowRun.conclusion;
    return {
      kind: "workflow",
      action: FAILED_WORKFLOW_CONCLUSIONS.has(conclusion) ? "open" : conclusion === "success" ? "resolve" : "ignore",
      state: conclusion,
      workflow: workflowRun.name ?? "unknown",
      runNumber: workflowRun.run_number,
      branch: workflowRun.head_branch ?? null,
      sha: workflowRun.head_sha ?? "",
      commitMessage: workflowRun.head_commit?.message ?? null,
      url: workflowRun.html_url ?? "",
      at: workflowRun.updated_at ?? null,
    };
  }

  return { kind: "unknown", action: "ignore", state: undefined };
}

/** 이슈 하나가 맡는 범위. Vercel 프로젝트마다 Production 하나, Preview 는 브랜치마다(모르면 커밋마다), 워크플로는 이름마다. */
export function alertKey(info) {
  if (info.kind === "workflow") return `workflow/${info.workflow}`;
  if (info.environment === "Production") return `vercel/${info.project}/production`;
  return `vercel/${info.project}/preview/${info.branch ?? shortSha(info.sha)}`;
}

/** 한국 시각. 한국은 서머타임이 없어 9시간을 더하면 된다. */
export function formatKst(iso) {
  const time = Date.parse(iso ?? "");
  if (Number.isNaN(time)) return "시각 모름";
  return `${new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ")} KST`;
}

export function shortSha(sha) {
  return (sha ?? "").slice(0, 7);
}

export function issueTitle(info, { repoName } = {}) {
  if (info.kind === "workflow") return `⚠️ 워크플로 실패: ${info.workflow}`;
  const icon = info.environment === "Production" ? "🚨" : "⚠️";
  // 저장소 하나에 Vercel 프로젝트가 여럿이거나 이름이 다르면 어느 프로젝트인지 적는다.
  const project = repoName && info.project !== repoName ? ` · ${info.project}` : "";
  return `${icon} 배포 실패: ${info.environment} (${info.branch ?? shortSha(info.sha)})${project}`;
}

function commitLine(info, repoUrl) {
  const link = `[\`${shortSha(info.sha)}\`](${repoUrl}/commit/${info.sha})`;
  const subject = info.commitMessage?.split("\n")[0].trim();
  return subject ? `${link} ${subject}` : link;
}

function workflowLink(info) {
  return `[${info.workflow}${info.runNumber ? ` #${info.runNumber}` : ""}](${info.url})`;
}

/** 실패 한 번을 설명하는 목록. 첫 이슈 본문과 다시 실패했을 때 댓글이 같이 쓴다. */
export function failureDetails(info, { repoUrl, hints = {} }) {
  if (info.kind === "workflow") {
    const lines = [
      `- 워크플로: ${workflowLink(info)}`,
      `- 결과: \`${info.state}\``,
      info.branch ? `- 브랜치: \`${info.branch}\`` : null,
      `- 커밋: ${commitLine(info, repoUrl)}`,
      `- 시각: ${formatKst(info.at)}`,
    ];
    if (hints[info.workflow]) lines.push("", hints[info.workflow]);
    return lines.filter((line) => line !== null).join("\n");
  }

  const scope = info.team ? ` --scope ${info.team}` : "";
  const lines = [
    `- Vercel 프로젝트: \`${info.project}\` — **${info.environment}**`,
    `- 브랜치: ${info.branch ? `\`${info.branch}\`` : "모름"}`,
    `- 커밋: ${commitLine(info, repoUrl)}`,
    `- 상태: \`${info.state}\`${info.description ? ` — ${info.description}` : ""}`,
    `- 시각: ${formatKst(info.at)}`,
    info.url ? `- 빌드 로그: [Vercel 에서 보기](${info.url})` : null,
    info.deploymentId ? `- 터미널에서: \`npx vercel inspect ${info.deploymentId} --logs${scope}\`` : null,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function issueBody(info, { key, repoUrl, runUrl, hints }) {
  const what =
    info.kind === "workflow"
      ? `GitHub Actions 「${info.workflow}」 실행이 실패했다.`
      : `Vercel ${info.environment} 배포가 실패했다.`;
  const scope =
    info.kind === "workflow"
      ? "이 워크플로의 다음 실행이 성공하면"
      : info.environment === "Production"
        ? "다음 Production 배포가 성공하면"
        : "같은 브랜치의 다음 배포가 성공하면";
  return [
    marker(key),
    what,
    "",
    failureDetails(info, { repoUrl, hints }),
    "",
    `${scope} 이 이슈는 자동으로 닫힌다. 그 사이 또 실패하면 여기에 댓글로 붙는다.`,
    "",
    `<sub>[이 알림을 보낸 실행](${runUrl}) · \`.github/workflows/deploy-failure-alert.yml\`</sub>`,
  ].join("\n");
}

export function repeatComment(info, options) {
  return ["다시 실패했다.", "", failureDetails(info, options)].join("\n");
}

export function resolvedComment(info, { repoUrl }) {
  const where = info.kind === "workflow" ? workflowLink(info) : `${info.project} ${info.environment}`;
  const branch = info.branch ? ` \`${info.branch}\`` : "";
  const commit = info.sha ? ` [\`${shortSha(info.sha)}\`](${repoUrl}/commit/${info.sha})` : "";
  const logs = info.kind === "vercel" && info.url ? ` · [Vercel](${info.url})` : "";
  return `✅ 다시 성공했다 — ${where}${branch}${commit} · ${formatKst(info.at)}${logs}\n\n이슈를 닫는다.`;
}

async function findOpenAlert(github, repo, key) {
  const { data } = await github.rest.issues.listForRepo({ ...repo, state: "open", labels: LABEL, per_page: 100 });
  return data.find((issue) => !issue.pull_request && keyFromBody(issue.body) === key) ?? null;
}

async function ensureLabel(github, repo) {
  try {
    await github.rest.issues.createLabel({
      ...repo,
      name: LABEL,
      color: LABEL_COLOR,
      description: "배포 실패 알림 (.github/workflows/deploy-failure-alert.yml)",
    });
  } catch (error) {
    // 422 = 이미 있다.
    if (error?.status !== 422) throw error;
  }
}

async function createIssue(github, repo, params) {
  try {
    return await github.rest.issues.create({ ...repo, ...params });
  } catch (error) {
    // 배정할 수 없는 사람이면 배정 없이 연다 — 알림이 아예 안 가는 것보다 낫다.
    if (error?.status !== 422 || !params.assignees) throw error;
    const withoutAssignees = { ...params };
    delete withoutAssignees.assignees;
    return github.rest.issues.create({ ...repo, ...withoutAssignees });
  }
}

/**
 * github-script 진입점. 무엇을 했는지 돌려준다(테스트가 본다).
 * `hints` 는 워크플로 이름 → 실패했을 때 할 일(이슈 본문에 붙는다). 저장소 YAML 이 넘긴다.
 * @returns {Promise<{ action: "ignore" | "none" | "opened" | "commented" | "closed", key?: string, number?: number }>}
 */
export async function run({ github, context, core, hints = {} }) {
  const info = readEvent(context.eventName, context.payload);
  if (info.action === "ignore") {
    core.info(`알릴 일이 아니다: ${context.eventName} ${info.context ?? ""} ${info.state ?? "(상태 없음)"}`.trim());
    return { action: "ignore" };
  }

  const repo = { owner: context.repo.owner, repo: context.repo.repo };
  const repoUrl = `${context.serverUrl ?? "https://github.com"}/${repo.owner}/${repo.repo}`;
  const runUrl = `${repoUrl}/actions/runs/${context.runId}`;
  const key = alertKey(info);
  const open = await findOpenAlert(github, repo, key);

  if (info.action === "resolve") {
    if (!open) {
      core.info(`열린 알림이 없다: ${key}`);
      return { action: "none", key };
    }
    await github.rest.issues.createComment({ ...repo, issue_number: open.number, body: resolvedComment(info, { repoUrl }) });
    await github.rest.issues.update({ ...repo, issue_number: open.number, state: "closed", state_reason: "completed" });
    core.notice(`다시 성공해 알림 #${open.number} 을 닫았다: ${key}`);
    return { action: "closed", key, number: open.number };
  }

  if (open) {
    await github.rest.issues.createComment({ ...repo, issue_number: open.number, body: repeatComment(info, { repoUrl, hints }) });
    core.warning(`또 실패해 알림 #${open.number} 에 댓글을 달았다: ${key}`);
    return { action: "commented", key, number: open.number };
  }

  await ensureLabel(github, repo);
  const { data: issue } = await createIssue(github, repo, {
    title: issueTitle(info, { repoName: repo.repo }),
    body: issueBody(info, { key, repoUrl, runUrl, hints }),
    labels: [LABEL],
    assignees: [repo.owner],
  });
  core.warning(`실패 알림 이슈를 열었다: #${issue.number} ${issue.html_url ?? ""}`.trim());
  return { action: "opened", key, number: issue.number };
}
