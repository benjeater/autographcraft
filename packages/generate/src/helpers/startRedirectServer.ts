import http, { type ServerResponse } from 'node:http';
import { parse, type UrlWithParsedQuery } from 'node:url';
import type { AuthTokens } from '../types';
import { SUCCESS_HTML, FAILURE_HTML } from './redirectServer';

type QueryValue = UrlWithParsedQuery['query'][string];

/**
 * Starts a server to listen for the redirect from the auth provider
 * @param onTokenReceived - Callback to run when the token is received
 */
export async function startRedirectServer(
  freePort: number,
  uniqueRef: string,
  onTokenReceived: (authTokens: AuthTokens) => void
): Promise<void> {
  http
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .createServer(function (req: any, res: ServerResponse) {
      const query = parse(req.url || '', true).query;

      if (!query.unique_ref || query.unique_ref !== uniqueRef) {
        respondWithFailure(res);
        return;
      }

      const idToken = getSingleQueryValue(query.id_token);
      const accessToken = getSingleQueryValue(query.access_token);
      const refreshToken = getSingleQueryValue(query.refresh_token);

      // Every token has to be present before the callback is invoked; the
      // callback resolves the promise the CLI is waiting on, and a partial set
      // of tokens would be written to the credentials file as `undefined`
      if (!idToken || !accessToken || !refreshToken) {
        respondWithFailure(res);
        return;
      }

      const authTokens: AuthTokens = {
        idToken,
        accessToken,
        refreshToken,
      };

      // Save the token
      onTokenReceived(authTokens);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(SUCCESS_HTML);
      res.end(); //end the response
    })
    .listen(freePort);
}

/**
 * Query string values are `string | string[] | undefined`, so a token is only
 * usable when it arrived exactly once and is not empty
 * @param value The raw value taken from the parsed query string
 * @returns The token value, or `null` when there is no usable value
 */
function getSingleQueryValue(value: QueryValue): string | null {
  if (typeof value !== 'string' || value === '') {
    return null;
  }
  return value;
}

/**
 * Responds to a redirect that cannot be turned into a set of auth tokens
 * @param res The response to write the failure page to
 */
function respondWithFailure(res: ServerResponse): void {
  res.writeHead(400, { 'Content-Type': 'text/html' });
  res.write(FAILURE_HTML);
  res.end(); //end the response
}
