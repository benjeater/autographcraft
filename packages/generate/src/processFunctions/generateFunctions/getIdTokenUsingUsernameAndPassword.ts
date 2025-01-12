export function getIdTokenUsingUsernameAndPassword(
  username: string,
  password: string
): Promise<string> {
  return new Promise<string>((resolve) => {
    // TODO: Implement call to Cognito endpoint.  This will require a DNS entry to allow
    // the endpoint to be static.

    resolve('idToken');
  });
}
