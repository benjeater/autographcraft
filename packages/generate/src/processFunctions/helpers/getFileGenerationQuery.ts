export function getFileGenerationQuery() {
  return `query GenerateFiles($configuration: String!, $schema: String!) {
    generate(configuration: $configuration, schema: $schema) {
      executionDuration
      files {
        filePath
        content
        addIgnoreHeader
        shouldOverwrite
      }
    }
  }
  `;
}
