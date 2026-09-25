import { site } from './site';

/**
 * CV DOWNLOAD
 * ------------------------------------------------------------
 * ✏️ Drop your PDF at `src/assets/cv.pdf` — every "Download CV"
 *    button on the site (top bar, hero, profile, footer, About)
 *    appears on its own. Astro fingerprints and serves the file.
 *
 * import.meta.glob returns nothing when the file is absent, so a
 * missing CV renders no button at all rather than shipping a link
 * that 404s on a recruiter.
 */
const cvFiles = import.meta.glob('../assets/cv.pdf', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const cvUrl = Object.values(cvFiles)[0] as string | undefined;

/** The file name the download is saved under. */
export const cvFileName = `${site.name} — CV.pdf`;

if (!cvUrl) {
  console.warn(
    '\n  ⚠  No CV found — every "Download CV" button is hidden.\n' +
      '     Drop your PDF at src/assets/cv.pdf and rebuild.\n'
  );
}
