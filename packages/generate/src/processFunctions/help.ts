import open from 'open';

/**
 * Opens the documentation in the default browser
 *
 * `open` resolves once the browser has been spawned, and the caller exits the
 * process as soon as this resolves, so the call has to be awaited or the
 * process would be gone before the browser is launched.
 */
export async function help(): Promise<void> {
  await open(`https://github.com/benjeater/autographcraft#readme`);
}
