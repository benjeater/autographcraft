import { convertToCamelCase } from './convertToCamelCase';
import { convertToPascalCase } from './convertToPascalCase';
import { convertToUpperSnakeCase } from './convertToUpperSnakeCase';

type ModelNameFlavours = {
  camelCase: string;
  pascalCase: string;
  upperSnakeCase: string;
};

/**
 * Converts a model name to different cases (camelCase, pascalCase, upperSnakeCase)
 * @param modelName The model name to convert to different flavours
 * @returns
 */
export function getModelNameFlavours(modelName: string): ModelNameFlavours {
  return {
    camelCase: convertToCamelCase(modelName),
    pascalCase: convertToPascalCase(modelName),
    upperSnakeCase: convertToUpperSnakeCase(modelName),
  };
}
