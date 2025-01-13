export type AuthResponse = {
  AuthenticationResult: {
    AccessToken: string;
    ExpiresIn: number;
    IdToken: string;
    RefreshToken: string;
    TokenType: string;
  };
  ChallengeParameters: Record<string, string>;
};
