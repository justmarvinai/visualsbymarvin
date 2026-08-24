/**
 * SIDEQUESTS (home page)
 * ------------------------------------------------------------
 * The stuff outside the client work — the things that show you
 * stick with something.
 *
 * ✏️ EDIT HERE:
 *   • `duolingo.streak` — your current streak in days.
 *       While it is 0 the Duolingo card is hidden, so nothing
 *       made-up ever ships. Put your real number in to show it.
 *   • `duolingo.username` — fill this in and the streak is fetched
 *       live at build time instead (see fetchDuolingoStreak below);
 *       the number above stays as the fallback.
 *   • `quests` — the other sidequest cards.
 */

/**
 * Duolingo username — read from the environment, never written here.
 *
 * This repo is public, so the name must not live in the source. Set
 * `DUOLINGO_USERNAME` in Vercel → Settings → Environment Variables (and
 * in a local `.env`, which is gitignored). It is read while the site
 * builds and is NOT prefixed with `PUBLIC_`, so Astro keeps it
 * server-side: the built pages carry the streak number and nothing else.
 *
 * process.env covers Vercel/shell; import.meta.env covers a local .env.
 */
const username =
  (typeof process !== 'undefined' ? process.env?.DUOLINGO_USERNAME : undefined) ||
  import.meta.env.DUOLINGO_USERNAME ||
  '';

export const duolingo = {
  username,
  /** ✏️ Manual fallback, in days. 0 hides the card. Used when the
   *  username is unset or Duolingo does not answer. */
  streak: 0,
  /** Shown in the widget header next to the flag. */
  language: 'Japanese',
  /** Deliberately the plain homepage — a /profile/<name> link would put
   *  the username straight back into the public HTML. */
  profileUrl: 'https://www.duolingo.com/',
};

export type Quest = {
  /** Small label above the title */
  kicker: string;
  title: string;
  blurb: string;
  /** Which accent from the palette this card wears */
  accent: 'lime' | 'violet' | 'coral' | 'sky';
  /** Little pills along the bottom */
  tags?: string[];
  link?: { href: string; label: string; external?: boolean };
};

export const quests: Quest[] = [
  {
    kicker: 'Side project',
    title: 'I built & shipped Jima',
    blurb:
      'An AI captions & motion studio I planned, designed and developed myself. Open source, free, and built so your files never leave your device.',
    accent: 'violet',
    tags: ['Open source', 'Privacy-first', 'Figma → shipped'],
    link: { href: '/work/jima/', label: 'See how it was made' },
  },
];

/**
 * Reads the live streak from a public Duolingo profile.
 *
 * Called at build time, so there is no CORS problem and visitors pay
 * nothing for it — the number is baked into the HTML and refreshes on
 * every deploy. Every failure path returns null so the site falls back
 * to `duolingo.streak` and a bad response can never break the build.
 */
export async function fetchDuolingoStreak(username: string): Promise<number | null> {
  if (!username) return null;
  try {
    const res = await fetch(
      `https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(username)}`,
      { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const user = (await res.json())?.users?.[0];
    // Duolingo returns the live streak under streakData and, on older
    // profiles, as a flat `streak` — take whichever one is a real number.
    const candidates = [user?.streakData?.currentStreak?.length, user?.site_streak, user?.streak];
    const streak = candidates.find((n) => typeof n === 'number' && n > 0);
    return streak ?? null;
  } catch {
    return null; // offline, rate-limited, profile private, shape changed …
  }
}
