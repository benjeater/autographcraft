import open from 'open';
import portfinder from 'portfinder';
import { v4 as uuidv4 } from 'uuid';
import { jwtDecode } from 'jwt-decode';
import {
  getExistingAuthTokens,
  writeAuthTokens,
  startRedirectServer,
} from '../helpers';
import { logger } from '@autographcraft/core';
import { SIGN_IN_URL } from '../constants';
import type { AuthTokens } from '../types';

/**
 * Fetches the auth token for the user, or prompts the user to visit the
 * sign in / sign up page.
 */
export async function getAuthIdToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const existingTokens = getExistingAuthTokens();
      let shouldOpenSite = false;
      let shouldAttemptRefresh = false;

      if (!existingTokens || !existingTokens.idToken) {
        logger.info(`No existing session found...`);
        shouldOpenSite = true;
      }

      // TODO: Re-enable refresh tokens if they become accessible via frontend
      // if (!shouldOpenSite && existingTokens?.refreshToken) {
      //   const decodedToken = jwtDecode(existingTokens.refreshToken);
      //   const currentTime = Date.now() / 1000;
      //   const tokenExpiry = decodedToken.exp || 0;
      //   if (currentTime > tokenExpiry) {
      //     logger.info(`All tokens have expired...`);
      //     shouldOpenSite = true;
      //   }
      // }

      if (!shouldOpenSite && existingTokens?.idToken) {
        const decodedToken = jwtDecode(existingTokens.idToken);
        const currentTime = Date.now() / 1000;
        const tokenExpiry = decodedToken.exp || 0;
        if (currentTime > tokenExpiry) {
          logger.info(`ID token has expired, refreshing ID token...`);
          shouldAttemptRefresh = true;
        }
      }

      // If the user has an active token, return it
      if (!shouldOpenSite && !shouldAttemptRefresh) {
        logger.info(`Using existing ID token...`);
        resolve(existingTokens!.idToken);
        return;
      }

      // If the user can attempt to refresh the token, do so
      // TODO: write logic to attempt to refresh the ID token
      // if (shouldAttemptRefresh && !shouldOpenSite) {
      //   logger.info(`Attempting to refresh ID token...`);

      //   const newTokens: AuthTokens = {
      //     idToken: '',
      //     accessToken: '',
      //     refreshToken: '',
      //   };
      //   resolve(newTokens!.idToken);
      //   return;
      // }

      // The user needs to sign in/up, so open the sign in page
      logger.info(`Opening sign in page...`);
      logger.info(`Please sign in or sign up to continue...`);

      resolve(
        new Promise<string>((resolve) => {
          try {
            const callback = (authTokens: AuthTokens) => {
              resolve(onTokenReceived(authTokens));
            };

            openSignInPage(callback);
          } catch (error) {
            reject(error);
          }
        })
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function openSignInPage(
  onTokenReceived: (authTokens: AuthTokens) => void
): Promise<void> {
  const freePort = await portfinder.getPortPromise();
  const uniqueRef = uuidv4().replace(/-/g, '');
  open(`${SIGN_IN_URL}?callback_port=${freePort}&unique_ref=${uniqueRef}`);

  // Start local server to listen for the redirect
  await startRedirectServer(freePort, uniqueRef, onTokenReceived);
}

function onTokenReceived(authTokens: AuthTokens): string {
  writeAuthTokens(authTokens);
  return authTokens.idToken;
}
