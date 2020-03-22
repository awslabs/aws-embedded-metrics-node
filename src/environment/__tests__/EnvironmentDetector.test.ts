import { cleanResolveEnvironment } from '../EnvironmentDetector';
import config from '../../config/Configuration';
import Environments from '../Environments';
import { DefaultEnvironment } from '../DefaultEnvironment';
import { ECSEnvironment } from '../ECSEnvironment';
import { EC2Environment } from '../EC2Environment';
import { LambdaEnvironment } from '../LambdaEnvironment';

const envs = [LambdaEnvironment, ECSEnvironment, EC2Environment, DefaultEnvironment];
const setEnvironment = (env: any) => {
  envs.forEach(e => {
    const probeResult = env === e;
    e.prototype.probe = jest.fn(() => Promise.resolve(probeResult));
  });
};

test('resolveEnvironment() returns LambdaEnvironment if AWS_LAMBDA_FUNCTION_NAME specified', async () => {
  // arrange
  setEnvironment(LambdaEnvironment);

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('LambdaEnvironment');
});

test('resolveEnvironment() returns ECSEnvironment if probe returns true', async () => {
  // arrange
  setEnvironment(ECSEnvironment);

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('ECSEnvironment');
});

test('resolveEnvironment() returns DefaultEnvironment if nothing else was detected', async () => {
  // arrange
  setEnvironment(undefined);

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('DefaultEnvironment');
});

test('resolveEnvironment() honors configured override', async () => {
  // arrange
  config.environmentOverride = Environments.Local;
  setEnvironment(ECSEnvironment);

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('LocalEnvironment');
});

test('resolveEnvironment() ignores invalid override and falls back to discovery', async () => {
  // arrange
  // @ts-ignore
  config.environmentOverride = 'Invalid';
  setEnvironment(LambdaEnvironment);

  // act
  const result = await cleanResolveEnvironment();

  // assert
  expect(result.constructor.name).toBe('LambdaEnvironment');
});
