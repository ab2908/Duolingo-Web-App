// Mirrors backend/app/schemas.py

export interface CourseSummary {
  id: number;
  title: string;
  flag: string;
  learning_language: string;
  from_language: string;
}

export interface Me {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
  course: CourseSummary;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  next_heart_at: string | null;
  heart_regen_minutes: number;
  refill_cost: number;
  streak: number;
  longest_streak: number;
  streak_extended_today: boolean;
  streak_freezes: number;
  daily_goal_xp: number;
  xp_today: number;
  sound_enabled: boolean;
  listening_enabled: boolean;
  timezone: string;
  now: string;
  today: string;
  time_offset_minutes: number;
}

export type NodeKind = "skill" | "chest" | "review";
export type NodeState = "completed" | "active" | "locked";

export interface PathSkill {
  id: number;
  kind: NodeKind;
  title: string;
  icon: string;
  position: number;
  state: NodeState;
  lessons_completed: number;
  total_lessons: number;
  is_legendary: boolean;
}

export interface PathUnit {
  id: number;
  position: number;
  section: number;
  title: string;
  description: string;
  color: UnitColor;
  has_guidebook: boolean;
  completed: boolean;
  skills: PathSkill[];
}

export type UnitColor = "green" | "purple" | "blue" | "orange" | "red";

export interface LearningPath {
  course: CourseSummary;
  units: PathUnit[];
  active_skill_id: number | null;
}

export interface Guidebook {
  unit_id: number;
  title: string;
  description: string;
  color: UnitColor;
  content: string;
}

export type SessionMode = "lesson" | "practice" | "legendary";
export type ExerciseType = "multiple_choice" | "translate" | "match_pairs" | "fill_blank" | "type_answer" | "listen";

export interface ExerciseOption {
  id: number;
  text: string;
  image: string | null;
  side: "left" | "right" | null;
  pair_key: string | null;
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  instruction: string;
  prompt: string;
  hint: string | null;
  prompt_language: string;
  answer_language: string;
  options: ExerciseOption[];
}

export interface LessonSession {
  id: number;
  mode: SessionMode;
  skill_id: number | null;
  lesson_id: number | null;
  title: string;
  hearts: number;
  max_mistakes: number | null;
  time_limit_seconds: number | null;
  uses_hearts: boolean;
  exercises: Exercise[];
}

export type Answer = number | string | number[] | number[][];

export interface AnswerResult {
  correct: boolean;
  solution: string;
  note: string | null;
  hearts: number;
  mistakes: number;
  session_status: "in_progress" | "completed" | "failed" | "abandoned";
}

export interface StreakWeekDay {
  date: string;
  active: boolean;
  is_today: boolean;
}

export interface AchievementUnlock {
  code: string;
  title: string;
  level: number;
  icon: string;
  color: string;
}

export interface SessionSummary {
  session_id: number;
  mode: SessionMode;
  xp_earned: number;
  base_xp: number;
  bonus_xp: number;
  accuracy: number;
  mistakes: number;
  duration_seconds: number;
  hearts: number;
  hearts_gained: number;
  total_xp: number;
  streak: { count: number; extended: boolean; week: StreakWeekDay[] };
  daily_goal: { goal: number; xp_today: number; just_completed: boolean };
  skill: {
    id: number;
    title: string;
    lessons_completed: number;
    total_lessons: number;
    completed: boolean;
    level_up: boolean;
    is_legendary: boolean;
  } | null;
  new_achievements: AchievementUnlock[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_color: string;
  weekly_xp: number;
  is_me: boolean;
  zone: "promotion" | "safe" | "demotion";
}

export interface Leaderboard {
  league: string;
  week_start: string;
  days_left: number;
  promotion_zone: number;
  demotion_zone: number;
  entries: LeaderboardEntry[];
}

export interface Quest {
  code: string;
  title: string;
  progress: number;
  goal: number;
  icon: string;
  completed: boolean;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  max_level: number;
  progress: number;
  goal: number;
}

export interface Profile {
  me: Me;
  league: string;
  lessons_completed: number;
  skills_completed: number;
  words_learned: number;
  achievements: Achievement[];
  xp_last_7_days: { date: string; xp: number }[];
  streak_week: StreakWeekDay[];
}

export interface ShopItem {
  code: "heart_refill" | "streak_freeze";
  title: string;
  description: string;
  price: number;
  available: boolean;
  owned: number | null;
  reason: string | null;
}

export interface Shop {
  gems: number;
  items: ShopItem[];
}
