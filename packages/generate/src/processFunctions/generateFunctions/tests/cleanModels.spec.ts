/* eslint-disable @typescript-eslint/no-explicit-any */
import { readdirSync, rmSync } from 'node:fs';
import { cleanModels } from '../cleanModels';

jest.mock('@autographcraft/core', () => ({
  logger: {
    info: jest.fn(),
  },
}));

jest.mock('node:fs', () => ({
  readdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

const CWD = '/current/working/directory';

describe('cleanModels', () => {
  it('should be defined', () => {
    expect(cleanModels).toBeDefined();
  });

  it('should delete model directories that are not found in the latest schema', () => {
    const config = {
      generatedModelsDirectory: 'generatedModelsDirectory',
      generatedTypesDirectory: 'generatedTypesDirectory',
      generatedDatabaseDirectory: 'generatedDatabaseDirectory',
    } as any;
    const allFiles = [
      {
        filePath: 'generatedModelsDirectory/modelUser/resolvers/readUser.ts',
      },
      {
        filePath:
          'generatedModelsDirectory/modelEmployee/resolvers/readEmployee.ts',
      },
      {
        filePath:
          'generatedTypesDirectory/modelEmployee/resolvers/readEmployee.ts',
      },
    ] as any;

    (readdirSync as jest.Mock).mockReturnValueOnce([
      { isDirectory: () => true, name: 'modelUser' },
      { isDirectory: () => true, name: 'modelEmployee' },
      { isDirectory: () => true, name: 'modelCompany' },
      { isDirectory: () => false, name: 'somefile.ts' },
    ]);

    cleanModels(CWD, config, allFiles);

    expect(readdirSync).toHaveBeenCalledWith(
      '/current/working/directory/generatedModelsDirectory',
      { withFileTypes: true }
    );

    expect(rmSync).toHaveBeenCalledTimes(4);
    expect(rmSync).toHaveBeenNthCalledWith(
      1,
      '/current/working/directory/generatedModelsDirectory/modelCompany',
      {
        force: true,
        recursive: true,
      }
    );
    expect(rmSync).toHaveBeenNthCalledWith(
      2,
      '/current/working/directory/generatedDatabaseDirectory/databaseConnections/CompanyDatabaseConnection.ts',
      {
        force: true,
        recursive: true,
      }
    );
    expect(rmSync).toHaveBeenNthCalledWith(
      3,
      '/current/working/directory/generatedDatabaseDirectory/databaseDocumentTypes/CompanyDatabaseDocumentType.ts',
      {
        force: true,
        recursive: true,
      }
    );
    expect(rmSync).toHaveBeenNthCalledWith(
      4,
      '/current/working/directory/generatedDatabaseDirectory/databaseSchemas/CompanyDatabaseSchema.ts',
      {
        force: true,
        recursive: true,
      }
    );
  });
});
