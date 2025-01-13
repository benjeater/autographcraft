import type { AuthResponse } from '../../types';
import {
  AUTOGRAPHCRAFT_AUTH_LOGIN_URL,
  AUTOGRAPHCRAFT_CLIENT_ID,
} from '../../constants';

export async function getIdTokenUsingUsernameAndPassword(
  username: string,
  password: string
): Promise<string> {
  const body = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: AUTOGRAPHCRAFT_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  const response = await fetch(AUTOGRAPHCRAFT_AUTH_LOGIN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify(body),
  });

  if (response.status >= 400) {
    throw new Error(await response.text());
  }

  const responseJson: AuthResponse = await response.json();
  return responseJson.AuthenticationResult.IdToken;
}
