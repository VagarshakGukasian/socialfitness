export type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_days: number | null;
  image_url: string | null;
  interval_days: number;
  created_at: string;
};
