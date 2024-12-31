import open from 'open';

/**
 * Opens the documentation in the default browser
 */
export async function help(): Promise<void> {
  open(`https://github.com/benjeater/autographcraft#readme`);
}
