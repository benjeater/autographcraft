import { logger, DEFAULT_CONFIG } from '@autographcraft/core';
import { writeConfigFileAndUpdateGitIgnore } from '../sharedFunctions';
import { questionSetConfigurationValueConfirmation } from './questions';
import type {
  AutoGraphCraftConfiguration,
  AutoGraphCraftConfigurationField,
} from '@autographcraft/core';
import { checkThatProvidedValueIsAcceptableToKey } from './checkThatProvidedValueIsAcceptableToKey';
import type { ProcessFunctionParams } from '../../types';

export async function setConfigValue(
  currentWorkingDirectory: string,
  params: ProcessFunctionParams,
  paramIndexConfig: number,
  existingConfig: AutoGraphCraftConfiguration
): Promise<void> {
  const keyToSet = params._[paramIndexConfig + 2];
  const valueToSet = params._[paramIndexConfig + 3];

  if (!Object.keys(DEFAULT_CONFIG).includes(keyToSet)) {
    logger.warn(
      `Unknown key '${keyToSet}' provided; please check your command and try again.`
    );
    logger.end();
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
    logger.end();
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
