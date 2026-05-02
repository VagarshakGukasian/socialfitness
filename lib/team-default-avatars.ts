/** Site-relative URLs (served from /public/team-pics). */
export const TEAM_DEFAULT_AVATAR_URLS = [
  "/team-pics/team_pic_1.jpg",
  "/team-pics/team_pic_2.jpg",
  "/team-pics/team_pic_3.jpg",
  "/team-pics/team_pic_4.jpg",
  "/team-pics/team_pic_5.jpg",
] as const;

export function isDefaultTeamAvatarUrl(url: string): boolean {
  const t = url.trim();
  return TEAM_DEFAULT_AVATAR_URLS.includes(t as (typeof TEAM_DEFAULT_AVATAR_URLS)[number]);
}

export function randomTeamAvatarUrl(): string {
  const i = Math.floor(Math.random() * TEAM_DEFAULT_AVATAR_URLS.length);
  return TEAM_DEFAULT_AVATAR_URLS[i] ?? "/team-pics/team_pic_1.jpg";
}
