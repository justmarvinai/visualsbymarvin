/**
 * " - " typed between words is a dash, not a hyphen — set it as an
 * en dash (with a no-break space in front, so it never starts a line)
 * wherever a title is shown big.
 */
export const dash = (s: string) => s.replace(/\s+-\s+/g, ' – ');
