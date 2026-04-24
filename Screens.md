# SocFit — product analysis, flows, and screen map

**Mobile web first** · Concise copy · **Icons over paragraphs** (nav and primary actions) · Admin stays under `/admin/challenges` (extended).

---

## 1. Product analysis (from `SocFit description.md`)

**Core value:** Group fitness challenges where **visibility from friends** (completed vs missed practices, reactions) drives habit formation.

**Entities**

| Entity | Notes |
|--------|--------|
| **User** | Auth user + profile (`display_name`, `email`, `avatar` optional). |
| **Solo team** | System team per user (“Just me”, hidden, cannot add members) — used for **individual** enrollment without exposing a “fake” team in the social team list. |
| **Team** | Named group; **no join approval**; members add people directly. |
| **Challenge** | Cover, title, description, **evergreen** *or* **fixed date range**, `interval_days` for official post cadence, **ordered list of official message templates** (for automation / copy — delivery loop is product-defined: cycle when list ends). |
| **Enrollment** | **Team-based**: one enrollment row enrolls **all** current team members. **Join** when allowed by schedule; **Exit** = whole team leaves (or solo user leaves as one “team”). |
| **Chat** | Official posts + per-team user posts. **Reactions** on messages. **Default filter: my team**; can switch to **everyone in challenge** (all enrolled players’ public posts in that challenge). Rich media in spec: text + optional images/video — **phased in UI** (text + reactions first; media hooks reserved). |
| **Friends / follows** | **Follow** another user; **remove** = unfollow. **Feed** = recent **practice posts** (non-official) from people you follow. |

---

## 2. User flows and corner cases

### Auth
- **Sign in / up** (existing) · Wrong password, OAuth cancel, email not confirmed → show short inline error, no long copy.

### Challenges — browse & open
- List shows **all** published challenges; card shows image, title, 1 line description, key stats, cadence.
- **Schedule rules:** **Evergreen** — Join always (unless already enrolled in that team / no eligible team). **Date range** — Join only if **today ∈ [start, end]** (inclusive). **Outside window** — Join **disabled**; show compact label (e.g. “Closed” / “Upcoming” via icon + word).
- **No teams at all** (edge: should not happen if solo team exists) — CTA to create a team. **Solo only** — Join still works with “Just me”.

### Enroll
- **Join** → chooser: **one of user’s teams** (including **Just me**) or error if all teams already in this challenge.
- **Already enrolled** for a team — that team **cannot** be chosen again; list only **not yet enrolled** teams.
- **Duplicate click / race** — DB unique on `(team_id, challenge_id)`; show short “Already joined”.
- **Exit** (quit challenge for a team) — **confirm** (destructive) · removes team enrollment and **non-official** messages for that team in that challenge (per existing RPC) · **cannot** be undone from UI.

### Teams
- **My teams** — excludes **solo** from list. **Discover / all teams** — all **non-solo** teams; tap → detail.
- **Team detail** — name, **stats** (member count, active / completed challenge counts), **members** (name + email), **challenges** list with **chat** link.
- **Add member** — search / browse users; **add** is instant; **remove** (optional) **blocked** for solo; **remove self** on normal team **allowed** with confirm.
- **Solo** — not listed, **cannot** invite, **name** fixed as “Just me” (or similar).

### Chat (per challenge + team)
- **Access** — only if user in team **and** team enrolled **and** not completed.
- **Messages** — load **my team** thread by default; toggle **All** to show **all teams’ user posts in this challenge** (same official posts for everyone) — RLS must allow “enrolled in challenge (any team)” to read.
- **Post** — only in **own team**; cannot post to another team’s room from UI.
- **Reactions** — same visibility rules as messages (including **All** and **Feed**-visible messages you follow).
- **Empty** — short empty state, icon.
- **Media** (later) — lightbox for image, inline video; validation and storage policies.

### Friends & feed
- **Users directory** — list (paginated) with **Follow / Following**; **self** no button.
- **Feed** — reverse chronological **non-official** messages from **followed** users; **empty** if none / not following anyone.
- **Unfollow** from list or future profile; **no mutual requirement**.

### Profile (self)
- **Overview** — avatar placeholder, name, email, **compact stats** (e.g. posts count, active challenges count).
- **Challenges** — tabs or sub-routes: active vs completed, links to challenge + chat.
- **Activity** — own posts in order (links to context where possible).

### Admin
- **List / create / edit** challenges; **danger** delete.
- **Fields:** cover, title, description, **slug**, **evergreen vs date range** (dates if range), `duration_days`, `interval_days`, **official message templates** (ordered lines), save **idempotently** (replace template rows).

### Corner cases summary
- Solo team must exist for every user (backfill for legacy DB).
- Join disabled outside date window; evergreen always (unless business adds “archived” later).
- Quit vs completed challenge (completed_at) — “Exit” only for **active** enrollment; completed stays read-only history.
- Rate limits / size — not in v1; file upload TBD for chat.

---

## 3. Screen inventory (components · deps · state · interaction)

| ID | Route | Purpose | Key elements | Dependencies | States | Interaction |
|----|-------|---------|-------------|-------------|--------|-------------|
| S0 | `/(marketing)` or `/` | Land / marketing | logo, 2 CTAs | auth | guest / authed | tap → challenges or login |
| S1 | `/login` | Sign in | form, **icon** CTA | Supabase | loading / error | submit |
| S2 | `/challenges` | **Home feed of challenges** | **grid** cards (image, title, 1 line, meta icons) | `challenges`, stats RPC | empty list | **tap card** → S3 |
| S3 | `/challenges/[id]` | Challenge detail | hero image, title, **stats row** (icon+number), **schedule badge** (evergreen / dates), team rows **chat+quit** / **enroll** | team membership, enrollments, schedule fields | not joinable / joinable / partial enrolled | **Join** → modal sheet **team picker** (incl. **Just me**); **Quit** → confirm |
| S4 | `/challenges/.../chat` | Team chat | **filter**: My team \| All; list; composer; **reaction strip** | messages, RLS, `?view=` | team vs all filter | **toggle** same page **searchParam**; send; react |
| S5 | `/feed` | Friends activity | list of post cards (avatar, name, snippet, time, challenge) | `user_follows`, `challenge_messages` | empty | **tap** → S3 or S4 (best effort) |
| S6 | `/teams` | **My** teams + link discover | list rows **icon+name**; **FAB or top +** to create | `teams` where `!is_solo` | empty | **tap** row → S7 |
| S7 | `/teams/explore` | **Discover** public teams (non-solo) | list rows: name, **member count** | `teams`, `team_members` count | empty | **tap** → S8 if current user is a member; otherwise read-only is future — v1 may link to a lightweight row only |
| S8 | `/teams/[id]` | Team (member) | title, **stat chips** (users, active ch., done ch.), **members** list, **enroll** links; **add user** | members, enrollments, counts | — | add / remove (future) |
| S9 | `/teams/new` | Create team | name field, **submit** | insert | — | create → S8 |
| S10 | `/teams/[id]/members` | Add by search | search input + results | `users` | — | add |
| S11 | `/teams/[id]/users` | Browse users | table + **add** | `users` | — | add to team |
| S12 | `/users` | Global directory + follow | list + **Follow** | `users`, `user_follows` | — | follow toggle |
| S13 | `/profile` (layout) | Me | subnav: **Overview** \| **Challenges** \| **Activity** | profile | — | **bottom nav** + tabs |
| S14 | `/dashboard` | Hub (optional) | **same links as header** in one row; **admin** link if | `ADMIN_EMAILS` | — | navigation only |
| S15+ | `/admin/challenges*`| Admin | list, form with **schedule** + **template lines** | service role, storage | error/success | save / delete |

**Navigation pattern (mobile):** **Bottom bar** (fixed, safe area): **Challenges** · **Feed** · **Teams** · **Profile** · (optional **More** for `/users` or fold Users into Profile). **Header:** logo + **sign out** (icon) on the right; **no duplicate** 5 text links on small screens.

---

## 4. Implementation notes (this repo)

- **DB** (`20250426200000_solo_friends_schedule_templates.sql`): `teams.is_solo` + one solo team per user (trigger + backfill), **schedule** on `challenges` (`evergreen` | `date_range` + window dates), **`challenge_message_templates`**, **`user_follows`**, **message** read policy (see all teams in a challenge you’re in + see followees’ posts), **`user_can_see_message`** updated, second member on solo team blocked.
- **Apply:** `npx supabase db push` (or run SQL) before relying on new columns/tables.
- **Routes (protected):** `/challenges`, `/challenges/[id]`, `/challenges/.../chat?...`, `/feed`, `/users`, `/teams`, `/teams/explore`, `/teams/[id]`, `/profile` (+/challenges, /activity), `/dashboard` (Hub).
- **Chat:** `?view=all` = everyone in challenge; default = your team. Toggle in `ChatRoom`.
- **Enroll:** “Just you” = solo team; **Join** only when `getChallengeJoinWindow` is `open` for that challenge.
- **Admin:** schedule radios + message sequence textarea; saves templates via service role.
- **UI:** **Bottom nav** (mobile) + `AppHeader`, **`--accent`** in `app/globals.css`, **lucide-react** everywhere.

### Out of scope / next

- **Chat images/video** (DB columns, storage, lightbox) — not wired yet.  
- **Automation** to post from `challenge_message_templates` on `interval_days` (cron/Edge function).  
- **Replace** long challenge descriptions in the DB (seed still Russian) via Admin.

---

*Last updated: product implementation pass (flows + screen map aligned to code).*
