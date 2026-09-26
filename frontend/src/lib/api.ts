import type {
  Answer,
  AnswerResult,
  Guidebook,
  LearningPath,
  Leaderboard,
  LessonSession,
  Me,
  Profile,
  Quest,
  SessionMode,
  SessionSummary,
  Shop,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** Error returned by the API, carrying the backend's machine-readable code. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network", "Can't reach the server. Is the backend running?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.code ?? "error", body.detail ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  me: () => request<Me>("/api/me"),
  updateSettings: (patch: Partial<Pick<Me, "display_name" | "daily_goal_xp" | "sound_enabled" | "listening_enabled" | "timezone">>) =>
    request<Me>("/api/me/settings", { method: "PATCH", body: JSON.stringify(patch) }),
  profile: () => request<Profile>("/api/profile"),

  path: () => request<LearningPath>("/api/path"),
  guidebook: (unitId: number) => request<Guidebook>(`/api/units/${unitId}/guidebook`),
  openChest: (skillId: number) => post<{ gems_awarded: number; gems: number }>(`/api/skills/${skillId}/chest`),

  startSession: (mode: SessionMode, skillId?: number | null) =>
    post<LessonSession>("/api/sessions", { mode, skill_id: skillId ?? null }),
  skipListening: (sessionId: number, exerciseId: number) =>
    post<void>(`/api/sessions/${sessionId}/skip-listening`, { exercise_id: exerciseId }),
  answer: (sessionId: number, exerciseId: number, answer: Answer | null) =>
    post<AnswerResult>(`/api/sessions/${sessionId}/answers`, { exercise_id: exerciseId, answer }),
  complete: (sessionId: number) => post<SessionSummary>(`/api/sessions/${sessionId}/complete`),
  abandon: (sessionId: number) => post<void>(`/api/sessions/${sessionId}/abandon`),

  leaderboard: () => request<Leaderboard>("/api/leaderboard"),
  quests: () => request<Quest[]>("/api/quests"),
  shop: () => request<Shop>("/api/shop"),
  purchase: (item: "heart_refill" | "streak_freeze") => post<Me>("/api/shop/purchase", { item }),

  timeTravel: (hours: number) => post<Me>("/api/dev/time-travel", { hours }),
  reset: () => post<void>("/api/dev/reset"),
};
