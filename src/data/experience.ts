/**
 * EXPERIENCE & EDUCATION (About page)
 * ------------------------------------------------------------
 * ✏️ EDIT HERE: replace the [placeholder] entries with your real
 *    stations — newest first, like on LinkedIn.
 *    Delete or copy blocks as needed.
 */

/** Where the work happens — shown as a coloured chip next to the period. */
export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';

export type Station = {
  period: string;
  role: string;
  company: string;
  /** Leave out to hide the chip for that station. */
  mode?: WorkMode;
  note?: string;
};

export const experience: Station[] = [
  {
    period: '2026 — Now',
    role: 'Graphic Designer',
    mode: 'Remote',
    company: 'Adler Werbegeschenke, Saarbrücken, Germany',
    note: 'After completing my studies, my internship partner hired me as a Graphic Designer on the Customer Service Art Team, starting April 1, 2026. In this role, I work with customer logos and prepare them for printing and production in our factory.',
  },
  {
    period: '2022 — 2026',
    role: 'Media Design - Dual Student',
    mode: 'Remote',
    company: 'Adler Werbegeschenke, Saarbrücken, Germany',
    note: 'My internship partner throughout my college years, where I worked 20 hours per week during the academic term and 40 hours per week during internship periods. As part of the marketing team, I worked as an in-house designer on organic and paid social media ads, performance campaigns, and email marketing assets.',
  },
];

export const education: Station[] = [
  {
    period: '2022 — 2026',
    role: 'Student: B.A. Media Design',
    mode: 'Hybrid',
    company: 'IU International University of Applied Sciences, Bad Honnef, Germany',
    note: 'Focus on UI/UX design & Social Media Marketing / visuals.',
  },
];
