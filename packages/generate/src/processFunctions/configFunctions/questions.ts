import { confirm } from '@inquirer/prompts';
import type { AutoGraphCraftConfigurationField } from '@autographcraft/core';

export async function questionSetConfigurationValueConfirmation(
  key: AutoGraphCraftConfigurationField,
  value: string
): Promise<boolean> {
  const answerSetConfigurationValueConfirmation = await confirm({
    message: `Would you like to set the ${key} setting to ${value}?`,
    default: true,
  });
  return answerSetConfigurationValueConfirmation;
}

export async function questionSetConfigurationValueToDefaultConfirmation(
  key: AutoGraphCraftConfigurationField
): Promise<boolean> {
  const answerSetConfigurationValueConfirmation = await confirm({
    message: `Would you like to set the ${key} setting to the default value?`,
    default: true,
  });
  return answerSetConfigurationValueConfirmation;
}
