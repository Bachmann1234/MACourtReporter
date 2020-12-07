import * as fs from 'fs';
import * as path from 'path';

export default function loadTextFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');
}

export function mockTypeORM(): [jest.Mock, jest.Mock] {
  // If anyone sees this, would love to know a better way.
  // I struggled getting __mocks__ working
  // Making this resuable leads to very awkward imports in the tests
  const getManyMock = jest.fn();
  const saveMock = jest.fn();
  jest.mock('typeorm', () => {
    return {
      getConnection: () => {
        return {
          getRepository: () => {
            return {
              createQueryBuilder: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                leftJoinAndMappOne: jest.fn().mockReturnThis(),
                getMany: getManyMock
              }),
              save: saveMock
            };
          },
          close: () => jest.fn()
        };
      },
      createConnection: () => jest.fn(),
      Repository: () => jest.fn(),
      Entity: () => jest.fn(),
      PrimaryGeneratedColumn: () => jest.fn(),
      Column: () => jest.fn(),
      Index: () => jest.fn(),
      Unique: () => jest.fn(),
      OneToOne: () => jest.fn(),
      JoinColumn: () => jest.fn(),
      CreateDateColumn: () => jest.fn()
    };
  });
  return [getManyMock, saveMock];
}
