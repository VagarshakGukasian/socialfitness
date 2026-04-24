export type JoinWindow = "open" | "upcoming" | "ended";

export function getChallengeJoinWindow(c: {
  schedule_mode: string;
  window_start: string | null;
  window_end: string | null;
}): JoinWindow {
  if (!c.schedule_mode || c.schedule_mode === "evergreen") return "open";
  if (!c.window_start || !c.window_end) return "open";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(c.window_start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(c.window_end);
  e.setHours(0, 0, 0, 0);
  if (today < s) return "upcoming";
  if (today > e) return "ended";
  return "open";
}
