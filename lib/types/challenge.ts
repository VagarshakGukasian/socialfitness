export type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_days: number | null;
  image_url: string | null;
  interval_days: number;
  /** Added in migration; default evergreen in UI when missing */
  schedule_mode?: "evergreen" | "date_range" | null;
  window_start?: string | null;
  window_end?: string | null;
  created_at: string;
};
