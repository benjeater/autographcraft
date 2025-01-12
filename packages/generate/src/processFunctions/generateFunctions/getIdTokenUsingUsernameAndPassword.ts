export function getIdTokenUsingUsernameAndPassword(
  username: string,
  password: string
): Promise<string> {
  return new Promise<string>((resolve) => {
    resolve('idToken');
  });
}
