import * as faker from 'faker';
import config from '../../config/Configuration';
import { DefaultEnvironment } from '../DefaultEnvironment';

test('probe() always returns true', async () => {
  // arrange
  const env = new DefaultEnvironment();

  // act
  const result = await env.probe();

  // assert
  expect(result).toBe(true);
});

test('getName() returns "Unknown" if not specified', () => {
  // arrange
  const env = new DefaultEnvironment();

  // act
  const result = env.getName();

  // assert
  expect(result).toBe('Unknown');
});

test('getType() returns "Unknown" if not specified', () => {
  // arrange
  const env = new DefaultEnvironment();

  // act
  const result = env.getType();

  // assert
  expect(result).toBe('Unknown');
});

test('getName() returns name if configured', () => {
  // arrange
  const expectedName = faker.random.word();
  config.serviceName = expectedName;
  const env = new DefaultEnvironment();

  // act
  const result = env.getName();

  // assert
  expect(result).toBe(expectedName);
});

test('getType() returns type if configured', () => {
  // arrange
  const expectedType = faker.random.word();
  config.serviceType = expectedType;
  const env = new DefaultEnvironment();

  // act
  const result = env.getType();

  // assert
  expect(result).toBe(expectedType);
});

test('getLogGroupName() returns logGroup if configured', () => {
  // arrange
  const name = faker.random.word();
  config.logGroupName = name;
  const env = new DefaultEnvironment();

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
  const env = new DefaultEnvironment();

  // act
  const result = env.getLogGroupName();

  // assert
  expect(result).toBe(`${serviceName}-metrics`);
});

test('getLogGroupName() returns empty if explicitly set to empty', () => {
  // arrange
  config.logGroupName = "";
  const env = new DefaultEnvironment();

  // act
  const result = env.getLogGroupName();

  // assert
  expect(result).toBe(``);
});

test('getSink() creates an AgentSink', () => {
  // arrange
  const expectedSink = 'AgentSink';
  const env = new DefaultEnvironment();
  config.logGroupName = faker.random.word();
  config.logStreamName = faker.random.word();

  // act
  const sink = env.getSink();

  // assert
  expect(sink.name).toBe(expectedSink);
});

test('getSink() uses service name if LogGroup is not configured', () => {
  // arrange
  const env = new DefaultEnvironment();
  const expectedName = faker.random.word();
  config.serviceName = expectedName;
  config.logGroupName = undefined;

  // act
  const sink: any = env.getSink();

  // assert
  expect(sink.logGroupName).toBe(`${expectedName}-metrics`);
});
