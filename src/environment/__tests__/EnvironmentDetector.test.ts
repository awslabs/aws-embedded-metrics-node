import * as faker from 'faker';
import { cleanResolveEnvironment } from '../EnvironmentDetector';
import config from '../../config/Configuration';
import Environments from '../Environments';

beforeEach(() => {
  process.env = {};
});

test('resolveEnvironment() returns LambdaEnvironment if AWS_LAMBDA_FUNCTION_NAME specified', async () => {
  // arrange
  process.env.AWS_LAMBDA_FUNCTION_NAME = faker.random.word();

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('LambdaEnvironment');
});

test('resolveEnvironment() returns DefaultEnvironment if nothing else was detected', async () => {
  // arrange
  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('DefaultEnvironment');
}, 10000);

test('resolveEnvironment() honors configured override', async () => {
  // arrange
  config.environmentOverride = Environments.Local;

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('LocalEnvironment');
});

test('resolveEnvironment() ignores invalid override and falls back to discovery', async () => {
  // arrange
  // @ts-ignore
  config.environmentOverride = "Invalid";
  process.env.AWS_LAMBDA_FUNCTION_NAME = faker.random.word();

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('LambdaEnvironment');
});