import { logger, DEFAULT_CONFIG } from '@autographcraft/core';
import { writeConfigFileAndUpdateGitIgnore } from '../sharedFunctions';
import { questionSetConfigurationValueToDefaultConfirmation } from './questions';
import type {
  AutoGraphCraftConfiguration,
  AutoGraphCraftConfigurationField,
} from '@autographcraft/core';

export async function setToDefaultConfigValue(
  currentWorkingDirectory: string,
  params: string[],
  paramIndexConfig: number,
  existingConfig: AutoGraphCraftConfiguration
): Promise<void> {
  const keyToSet = params[paramIndexConfig + 2];

  if (!Object.keys(DEFAULT_CONFIG).includes(keyToSet)) {
    logger.warn(
      `Unknown key '${keyToSet}' provided; please check your command and try again.`
    );
    logger.end();
    process.exit(1);
  }

  const answerSetConfigurationValueConfirmation =
    questionSetConfigurationValueToDefaultConfirmation(
      keyToSet as AutoGraphCraftConfigurationField
    );
  if (!answerSetConfigurationValueConfirmation) {
    logger.info('Exiting because user does not want to change value');
    return;
  }

  const newConfig = {
    ...existingConfig,
    [keyToSet]: DEFAULT_CONFIG[
      keyToSet as AutoGraphCraftConfigurationField
    ] as string,
  };

  writeConfigFileAndUpdateGitIgnore(
    currentWorkingDirectory,
    newConfig,
    existingConfig
  );
}
