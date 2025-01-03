import { logger, DEFAULT_CONFIG } from '@autographcraft/core';
import { writeConfigFileAndUpdateGitIgnore } from '../sharedFunctions';
import { questionSetConfigurationValueConfirmation } from './questions';
import type {
  AutoGraphCraftConfiguration,
  AutoGraphCraftConfigurationField,
} from '@autographcraft/core';
import { checkThatProvidedValueIsAcceptableToKey } from './checkThatProvidedValueIsAcceptableToKey';

export async function setConfigValue(
  currentWorkingDirectory: string,
  params: string[],
  paramIndexConfig: number,
  existingConfig: AutoGraphCraftConfiguration
): Promise<void> {
  const keyToSet = params[paramIndexConfig + 2];
  const valueToSet = params[paramIndexConfig + 3];

  if (!Object.keys(DEFAULT_CONFIG).includes(keyToSet)) {
    logger.warn(
      `Unknown key '${keyToSet}' provided; please check your command and try again.`
    );
    process.exit(1);
  }

  const answerSetConfigurationValueConfirmation =
    questionSetConfigurationValueConfirmation(
      keyToSet as AutoGraphCraftConfigurationField,
      valueToSet
    );
  if (!answerSetConfigurationValueConfirmation) {
    logger.info('Exiting because user does not want to change value');
    return;
  }

  const checkResult = checkThatProvidedValueIsAcceptableToKey(
    keyToSet,
    valueToSet
  );
  if (!checkResult) {
    process.exit(1);
  }

  const newConfig = {
    ...existingConfig,
    [keyToSet]: valueToSet,
  };

  writeConfigFileAndUpdateGitIgnore(
    currentWorkingDirectory,
    newConfig,
    existingConfig
  );
}
