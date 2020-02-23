import * as faker from 'faker';
import Environments from '../../environment/Environments';

beforeEach(() => {
  jest.resetModules();
});

const getConfig = () => require('../Configuration').default;

test('can set LogGroup name from environment', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_LOG_GROUP_NAME = expectedValue;

  // act
  const config = getConfig();

  // assert
  const result = config.logGroupName;
  expect(result).toBe(expectedValue);
});

test('can set LogStream name from environment', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_LOG_STREAM_NAME = expectedValue;

  // act
  const config = getConfig();

  // assert
  const result = config.logStreamName;
  expect(result).toBe(expectedValue);
});

test('can enable debug logging from environment', () => {
  // arrange
  const expectedValue = true;
  process.env.AWS_EMF_ENABLE_DEBUG_LOGGING = expectedValue.toString();

  // act
  const config = getConfig();

  // assert
  const result = config.debuggingLoggingEnabled;
  expect(result).toBe(expectedValue);
});

test('can set ServiceName from environment', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_SERVICE_NAME = expectedValue;
  delete process.env.SERVICE_NAME;

  // act
  const config = getConfig();

  // assert
  const result = config.serviceName;
  expect(result).toBe(expectedValue);
});

test('can set ServiceName from environment w/o prefix', () => {
  // arrange
  const expectedValue = faker.random.word();
  delete process.env.AWS_EMF_SERVICE_NAME;
  process.env.SERVICE_NAME = expectedValue;

  // act
  const config = getConfig();

  // assert
  const result = config.serviceName;
  expect(result).toBe(expectedValue);
});

test('ServiceName w/ prefix takes precendence over w/o prefix', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_SERVICE_NAME = expectedValue;
  process.env.SERVICE_NAME = faker.random.word();

  // act
  const config = getConfig();

  // assert
  const result = config.serviceName;
  expect(result).toBe(expectedValue);
});

test('can manually set ServiceName', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_SERVICE_NAME = faker.random.word();
  process.env.SERVICE_NAME = faker.random.word();
  const config = getConfig();

  // act
  config.serviceName = expectedValue;

  // assert
  const result = config.serviceName;
  expect(result).toBe(expectedValue);
});

test('can set ServiceType from environment', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_SERVICE_TYPE = expectedValue;
  delete process.env.SERVICE_TYPE;

  // act
  const config = getConfig();

  // assert
  const result = config.serviceType;
  expect(result).toBe(expectedValue);
});

test('can set ServiceType from environment w/o prefix', () => {
  // arrange
  const expectedValue = faker.random.word();
  delete process.env.AWS_EMF_SERVICE_TYPE;
  process.env.SERVICE_TYPE = expectedValue;

  // act
  const config = getConfig();

  // assert
  const result = config.serviceType;
  expect(result).toBe(expectedValue);
});

test('ServiceType w/ prefix takes precendence over w/o prefix', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_SERVICE_TYPE = expectedValue;
  process.env.SERVICE_TYPE = faker.random.word();

  // act
  const config = getConfig();

  // assert
  const result = config.serviceType;
  expect(result).toBe(expectedValue);
});

test('can manually set ServiceType', () => {
  // arrange
  const expectedValue = faker.random.word();
  process.env.AWS_EMF_SERVICE_TYPE = faker.random.word();
  process.env.SERVICE_TYPE = faker.random.word();
  const config = getConfig();

  // act
  config.serviceType = expectedValue;

  // assert
  const result = config.serviceType;
  expect(result).toBe(expectedValue);
});

test('can set agent endpoint from environment', () => {
  // arrange
  const expectedValue = faker.internet.url();
  process.env.AWS_EMF_AGENT_ENDPOINT = expectedValue;

  // act
  const config = getConfig();

  // assert
  const result = config.agentEndpoint;
  expect(result).toBe(expectedValue);
});

test('can set environment override from environment', () => {
  // arrange
  const expectedValue = "Local"
  process.env.AWS_EMF_ENVIRONMENT = expectedValue;

  // act
  const config = getConfig();

  // assert
  const result = config.environmentOverride;
  expect(result).toBe(Environments.Local);
});

test('if environment override is not set, default to unknown', () => {
  // arrange
  process.env.AWS_EMF_ENVIRONMENT = "";
  // act
  const config = getConfig();

  // assert
  const result = config.environmentOverride;
  expect(result).toBe(Environments.Unknown);
});

test('if environment override cannot be parsed, default to unknown', () => {
  // arrange
  process.env.AWS_EMF_ENVIRONMENT = faker.random.alphaNumeric();
  // act
  const config = getConfig();

  // assert
  const result = config.environmentOverride;
  expect(result).toBe(Environments.Unknown);
});
