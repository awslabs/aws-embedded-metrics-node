import * as faker from 'faker';
import config from '../../config/Configuration';
import { LocalEnvironment } from '../LocalEnvironment';

test('probe() always returns false', async () => {
  // arrange
  const env = new LocalEnvironment();

  // act
  const result = await env.probe();

  // assert
  expect(result).toBe(false);
});

test('getName() returns "Unknown" if not specified', () => {
  // arrange
  const env = new LocalEnvironment();

  // act
  const result = env.getName();

  // assert
  expect(result).toBe('Unknown');
});

test('getType() returns "Unknown" if not specified', () => {
  // arrange
  const env = new LocalEnvironment();

  // act
  const result = env.getType();

  // assert
  expect(result).toBe('Unknown');
});

test('getName() returns name if configured', () => {
  // arrange
  const expectedName = faker.random.word();
  config.serviceName = expectedName;
  const env = new LocalEnvironment();

  // act
  const result = env.getName();

  // assert
  expect(result).toBe(expectedName);
});

test('getType() returns type if configured', () => {
  // arrange
  const expectedType = faker.random.word();
  config.serviceType = expectedType;
  const env = new LocalEnvironment();

  // act
  const result = env.getType();

  // assert
  expect(result).toBe(expectedType);
});

test('getLogGroupName() returns logGroup if configured', () => {
  // arrange
  const name = faker.random.word();
  config.logGroupName = name;
  const env = new LocalEnvironment();

  // act
  const result = env.getLogGroupName();

  // assert
  expect(result).toBe(name);
});

test('getLogGroupName() returns <ServiceName>-metrics if not configured', () => {
  // arrange
  const serviceName = faker.random.word();
  config.logGroupName = undefined;
  config.serviceName = serviceName;
  const env = new LocalEnvironment();

  // act
  const result = env.getLogGroupName();

  // assert
  expect(result).toBe(`${serviceName}-metrics`);
});

test('getSink() creates a ConsoleSink', () => {
  // arrange
  const expectedSink = 'ConsoleSink';
  const env = new LocalEnvironment();

  // act
  const sink = env.getSink();

  // assert
  expect(sink.name).toBe(expectedSink);
});
