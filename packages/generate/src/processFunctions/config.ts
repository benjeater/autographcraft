import { getExistingConfiguration } from '../helpers';
import { setConfigValue, setToDefaultConfigValue } from './configFunctions';
import { logger } from '@autographcraft/core';
import type { ProcessFunctionParams } from '../types';

const CONFIG_FUNCTION: string[] = ['set', 'setToDefault'] as const;

/**
 * Provides functionality to update a single configuration setting programatically
 *
 * @param currentWorkingDirectory The path that the function was executed from
 * @param params The user provided params to the function call
 */
export async function config(
  currentWorkingDirectory: string,
  params: ProcessFunctionParams
): Promise<void> {
  // Get the existing configuration
  const existingConfig = await getExistingConfiguration(
    currentWorkingDirectory
  );
  if (!existingConfig) {
    logger.warn(
      'No existing configuration exists, use `init` to create the initial configuration file'
    );
    logger.end();
    process.exit(1);
  }

  // Get the index of the config param provided to the function call
  const paramIndexConfig = params._.indexOf('config');
  const paramConfigFunction = params._[paramIndexConfig + 1];
  if (!CONFIG_FUNCTION.includes(paramConfigFunction)) {
    logger.warn(
      `Unknown function following 'config', expected one of: ${CONFIG_FUNCTION.join(
        ', '
      )}`
    );
  }

  // If the request is to set a config value...
  if (paramConfigFunction === 'set') {
    await setConfigValue(
      currentWorkingDirectory,
      params,
      paramIndexConfig,
      existingConfig
    );
    return;
  }

  // If the request is to set a config value to default...
  if (paramConfigFunction === 'setToDefault') {
    await setToDefaultConfigValue(
      currentWorkingDirectory,
      params,
      paramIndexConfig,
      existingConfig
    );
    return;
  }
}
