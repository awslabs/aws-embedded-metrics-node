import * as faker from 'faker';
import config from '../../config/Configuration';
import { DefaultEnvironment } from '../DefaultEnvironment';

test('probe() always returns true', () => {
  // arrange
  const env = new DefaultEnvironment();

  // act
  const result = env.probe();

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

test('createSink() creates an AgentSink', () => {
  // arrange
  const expectedSink = 'AgentSink';
  const env = new DefaultEnvironment();
  config.logGroupName = faker.random.word();
  config.logStreamName = faker.random.word();

  // act
  const sink = env.createSink();

  // assert
  expect(sink.name).toBe(expectedSink);
});

test('createSink() uses service name if LogGroup is not configured', () => {
  // arrange
  const env = new DefaultEnvironment();
  const expectedName = faker.random.word();
  config.serviceName = expectedName;
  config.logGroupName = undefined;

  // act
  const sink: any = env.createSink();

  // assert
  expect(sink.logGroupName).toBe(`${expectedName}-metrics`);
});
