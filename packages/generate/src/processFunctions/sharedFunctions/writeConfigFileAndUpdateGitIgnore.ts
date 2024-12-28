import { writeFileSync, readFileSync } from 'node:fs';
import util from 'node:util';
import { join } from 'path';

import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import {
  CONFIG_FILE_NAME,
  GIT_IGNORE_LABEL,
  HOOK_INS_DIRECTORY_NAME,
  LOGGER_FILE_PATH,
} from '@autographcraft/core';
/**
 * Writes the configuration to the working directory and updates the gitignore
 * file at the location specified in the configuration to include all the directories
 * that should be ignored
 * @param configPath The path to the save the config file to
 * @param configContent The content of the config file to write
 */
export function writeConfigFileAndUpdateGitIgnore(
  currentWorkingDirectory: string,
  configContent: AutoGraphCraftConfiguration,
  existingConfig: AutoGraphCraftConfiguration | undefined
): void {
  const configPath = join(currentWorkingDirectory, CONFIG_FILE_NAME);

  const configLines: string[] = [
    `/** @type {import('@autographcraft/core').AutoGraphCraftConfigurationOutput} **/`,
    `export const config = ${util.inspect(configContent, false)};`,
    '',
    'export default config;',
    '',
  ];

  const configFileContent = configLines.join('\n');
  writeFileSync(configPath, configFileContent);

  const gitIgnorePath = join(
    currentWorkingDirectory,
    configContent.gitIgnorePath
  );

  const gitignoreContent = readFileSync(gitIgnorePath, { encoding: 'utf8' });
  const gitignoreContentLines = gitignoreContent.split('\n');

  // Find the index of the gitIgnore label in the gitIgnore file
  let gitIgnoreLabelIndex = getIgnoreLabelIndex(gitignoreContentLines);

  // Add the gitignore label if it is not present
  if (gitIgnoreLabelIndex === -1) {
    if (gitignoreContentLines[-1] !== '') {
      gitignoreContentLines.push('');
    }
    gitignoreContentLines.push(GIT_IGNORE_LABEL);
    gitIgnoreLabelIndex = getIgnoreLabelIndex(gitignoreContentLines);
  }

  const {
    generatedTypesDirectory,
    generatedDatabaseDirectory,
    generatedUtilsDirectory,
    generatedModelsDirectory,
  } = configContent;

  const modelGitIgnoreLine = `${generatedModelsDirectory}/*/*`;
  const modelGitIgnoreIncludeHookInsLine = `!${generatedModelsDirectory}/*/${HOOK_INS_DIRECTORY_NAME}`;
  const loggerGitIgnoreLine = LOGGER_FILE_PATH;

  if (!gitignoreContentLines.includes(generatedTypesDirectory)) {
    addLineToGitIgnore(
      gitignoreContentLines,
      gitIgnoreLabelIndex,
      generatedTypesDirectory,
      existingConfig?.generatedTypesDirectory
    );
  }

  if (!gitignoreContentLines.includes(generatedDatabaseDirectory)) {
    addLineToGitIgnore(
      gitignoreContentLines,
      gitIgnoreLabelIndex,
      generatedDatabaseDirectory,
      existingConfig?.generatedDatabaseDirectory
    );
  }

  if (!gitignoreContentLines.includes(generatedUtilsDirectory)) {
    addLineToGitIgnore(
      gitignoreContentLines,
      gitIgnoreLabelIndex,
      generatedUtilsDirectory,
      existingConfig?.generatedUtilsDirectory
    );
  }

  if (!gitignoreContentLines.includes(modelGitIgnoreLine)) {
    addLineToGitIgnore(
      gitignoreContentLines,
      gitIgnoreLabelIndex,
      modelGitIgnoreLine,
      existingConfig?.generatedModelsDirectory
        ? `${existingConfig.generatedModelsDirectory}/*/*`
        : undefined
    );

    addLineToGitIgnore(
      gitignoreContentLines,
      gitIgnoreLabelIndex + 1,
      modelGitIgnoreIncludeHookInsLine,
      existingConfig?.generatedModelsDirectory
        ? `!${existingConfig.generatedModelsDirectory}/*/${HOOK_INS_DIRECTORY_NAME}`
        : undefined
    );
  }

  if (!gitignoreContentLines.includes(loggerGitIgnoreLine)) {
    addLineToGitIgnore(
      gitignoreContentLines,
      gitIgnoreLabelIndex,
      loggerGitIgnoreLine,
      existingConfig?.generatedModelsDirectory ? LOGGER_FILE_PATH : undefined
    );
  }

  // Update gitignore file
  writeFileSync(gitIgnorePath, gitignoreContentLines.join('\n'));
}

function getIgnoreLabelIndex(gitignoreContentLines: string[]): number {
  const gitIgnoreLabelIndex = gitignoreContentLines.indexOf(GIT_IGNORE_LABEL);
  return gitIgnoreLabelIndex;
}

function addLineToGitIgnore(
  gitignoreContentLines: string[],
  gitIgnoreLabelIndex: number,
  newGitIgnoreLine: string,
  existingValue?: string
): void {
  let writeLineIndex: number = gitIgnoreLabelIndex + 1;
  let hasExistingLine: boolean = false;
  if (existingValue) {
    const linesAfterLabel = gitignoreContentLines.slice(gitIgnoreLabelIndex);
    const existingLineIndex = linesAfterLabel.indexOf(existingValue);
    if (existingLineIndex !== -1) {
      hasExistingLine = true;
      writeLineIndex = gitIgnoreLabelIndex + existingLineIndex;
    }
  }

  gitignoreContentLines.splice(
    writeLineIndex,
    hasExistingLine ? 1 : 0,
    newGitIgnoreLine
  );
}
