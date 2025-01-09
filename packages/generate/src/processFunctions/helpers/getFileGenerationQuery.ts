export function getFileGenerationQuery() {
  return `query GenerateFiles($configuration: String!, $schema: String!) {
    generate(configuration: $configuration, schema: $schema) {
      signedUrl
      warnings
      executionDurationMs
    }
  }
  `;
}
