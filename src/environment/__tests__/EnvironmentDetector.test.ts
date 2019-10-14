import * as faker from 'faker';
import { detectEnvironment } from '../EnvironmentDetector';

beforeEach(() => {
  process.env = {};
});

test('detectEnvironment() returns LambdaEnvironment if AWS_LAMBDA_FUNCTION_NAME specified', () => {
  // arrange
  process.env.AWS_LAMBDA_FUNCTION_NAME = faker.random.word();

  // act
  const result = detectEnvironment();

  // assert
  expect(result.constructor.name).toBe('LambdaEnvironment');
});

test('detectEnvironment() returns DefaultEnvironment if nothing else was detected', () => {
  // arrange
  // act
  const result = detectEnvironment();

  // assert
  expect(result.constructor.name).toBe('DefaultEnvironment');
});
