import { AUTOGRAPHCRAFT_API_URL } from '../../constants';
import type { AutoGraphCraftApiResponse } from '../../types';
import { logger } from '@autographcraft/core';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import { getFileGenerationQuery } from '../helpers';

type APIError = {
  message: string;
  errorType?: string;
  locations?: Record<string, unknown>[];
  path?: string[];
};

type APIResponse = {
  data: {
    generate: AutoGraphCraftApiResponse;
  };
  errors?: APIError[];
};

/**
 * Fetches the AutoGraphCraft API response
 * @param authIdToken The auth token to use for the request
 * @param configuration The configuration of AutoGraphCraft
 * @param schema The schema to use for the request
 * @returns
 */
export async function getAutoGraphCraftApiResponse(
  authIdToken: string,
  configuration: AutoGraphCraftConfiguration,
  schema: string
): Promise<AutoGraphCraftApiResponse> {
  const query = getFileGenerationQuery();
  const variables = {
    configuration: JSON.stringify(configuration),
    schema,
  };

  const response = await fetch(AUTOGRAPHCRAFT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authIdToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (response.status >= 400) {
    throw new Error(await response.text());
  }

  const responseJson: APIResponse = await response.json();

  if (responseJson.errors) {
    logger.error(JSON.stringify(responseJson, null, 2));
    throw new Error(responseJson.errors[0].message);
  }

  return responseJson.data.generate;
}
