import { confirm, input, password } from '@inquirer/prompts';

export async function questionHasAccount(): Promise<boolean> {
  const answerHasAccount = await confirm({
    message: 'Have you already signed up for an autographcraft account?',
    default: false,
  });
  return answerHasAccount;
}

export async function questionUsername(): Promise<string> {
  const answerUsername = await input({
    message: 'Username:',
  });
  return answerUsername;
}

export async function questionPassword(): Promise<string> {
  const answerPassword = await password({
    message: 'Password:',
  });
  return answerPassword;
}
