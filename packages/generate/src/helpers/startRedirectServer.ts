import http, { type ServerResponse } from 'node:http';
import { parse } from 'node:url';
import type { AuthTokens } from '../types';

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
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.write(
          'Invalid request; unique_ref not found or did not match expected value'
        );
        res.end(); //end the response
        return;
      }

      const authTokens: AuthTokens = {
        idToken: query.id_token as string,
        accessToken: query.access_token as string,
        refreshToken: query.refresh_token as string,
      };
      if (authTokens) {
        // Save the token
        onTokenReceived(authTokens);
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('Token saved successfully.  You may now close this window');
      res.end(); //end the response
    })
    .listen(freePort);
}