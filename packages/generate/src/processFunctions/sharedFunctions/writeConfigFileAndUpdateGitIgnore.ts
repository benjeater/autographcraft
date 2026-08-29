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
  // An empty file has no lines at all; splitting it would produce a single
  // empty line and push the label onto the second line of the file
  const gitignoreContentLines =
    gitignoreContent === '' ? [] : gitignoreContent.split('\n');

  // Find the index of the gitIgnore label in the gitIgnore file
  let gitIgnoreLabelIndex = getIgnoreLabelIndex(gitignoreContentLines);

  // Add the gitignore label if it is not present
  if (gitIgnoreLabelIndex === -1) {
    // Separate the label from any existing content with a single blank line
    const lastLine = gitignoreContentLines[gitignoreContentLines.length - 1];
    if (gitignoreContentLines.length > 0 && lastLine !== '') {
      gitignoreContentLines.push('');
    }
    // The label is appended, so its index is the length before the push
    gitIgnoreLabelIndex = gitignoreContentLines.length;
    gitignoreContentLines.push(GIT_IGNORE_LABEL);
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
  // New lines go directly under the label, and only the lines under the label
  // are managed, so that same index is the origin of the search for an existing
  // line. `indexOf` runs over a slice, so the origin has to be added back to
  // turn its result into an index into `gitignoreContentLines`
  const firstManagedLineIndex = gitIgnoreLabelIndex + 1;
  let writeLineIndex: number = firstManagedLineIndex;
  let hasExistingLine: boolean = false;
  if (existingValue) {
    const linesAfterLabel = gitignoreContentLines.slice(firstManagedLineIndex);
    const existingLineIndex = linesAfterLabel.indexOf(existingValue);
    if (existingLineIndex !== -1) {
      hasExistingLine = true;
      writeLineIndex = firstManagedLineIndex + existingLineIndex;
    }
  }

  gitignoreContentLines.splice(
    writeLineIndex,
    hasExistingLine ? 1 : 0,
    newGitIgnoreLine
  );
}
