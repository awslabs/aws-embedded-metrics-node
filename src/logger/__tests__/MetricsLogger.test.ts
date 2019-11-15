import * as faker from 'faker';
import { Unit } from '../..';
import { TestSink } from '../../../test/utils/TestSink';
import Configuration from '../../config/Configuration';
import { EnvironmentProvider } from '../../environment/EnvironmentDetector';
import { IEnvironment } from '../../environment/IEnvironment';
import { ISink } from '../../sinks/Sink';
import { MetricsContext } from '../MetricsContext';
import { MetricsLogger } from '../MetricsLogger';

const createSink = () => new TestSink();
const createEnvironment = (sink: ISink) => {
  return {
    probe: async () => true,
    getSink: () => sink,
    getName: () => 'test',
    getType: () => 'test',
    getLogGroupName: () => 'test',
    configureContext: jest.fn(),
  };
};
const createLogger = (env: EnvironmentProvider) => new MetricsLogger(env);

let sink: TestSink;
let environment: IEnvironment;
let logger: MetricsLogger;

beforeEach(() => {
  sink = createSink();
  environment = createEnvironment(sink);
  logger = createLogger(async () => environment);
});

test('can set property', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();

  // act
  logger.setProperty(expectedKey, expectedValue);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualValue = sink.events[0].properties[expectedKey];
  expect(actualValue).toBeTruthy();
  expect(actualValue).toBe(expectedValue);
});

test('can put metric', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();

  // act
  logger.putMetric(expectedKey, expectedValue);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualMetric = sink.events[0].metrics.get(expectedKey);
  expect(actualMetric).toBeTruthy();
  expect(actualMetric!.values).toStrictEqual([expectedValue]);
  expect(actualMetric!.unit).toBe('None');
});

test('put metric appends metrics using same key', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValues = [faker.random.number(), faker.random.number()];

  // act
  logger.putMetric(expectedKey, expectedValues[0]);
  logger.putMetric(expectedKey, expectedValues[1]);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualMetric = sink.events[0].metrics.get(expectedKey);
  expect(actualMetric).toBeTruthy();
  expect(actualMetric!.values).toStrictEqual(expectedValues);
  expect(actualMetric!.unit).toBe('None');
});

test('can put metric with enum unit', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();
  const expectedUnit = Unit.Bits;

  // act
  logger.putMetric(expectedKey, expectedValue, expectedUnit);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualMetric = sink.events[0].metrics.get(expectedKey);
  expect(actualMetric).toBeTruthy();
  expect(actualMetric!.unit).toBe('Bits');
});

test('can put metric with string unit', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();
  const expectedUnit = 'Bits/Second';

  // act
  logger.putMetric(expectedKey, expectedValue, expectedUnit);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualMetric = sink.events[0].metrics.get(expectedKey);
  expect(actualMetric).toBeTruthy();
  expect(actualMetric!.unit).toBe(expectedUnit);
});

test('can put dimension', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: Record<string, string> = {};
  dimensions[expectedKey] = expectedValue;

  // act
  logger.putDimensions(dimensions);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();
  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[expectedKey];
  expect(actualValue).toBe(expectedValue);
});

test('setDimensions overwrites default dimensions', async () => {
  // arrange
  const context = MetricsContext.empty();
  context.setDefaultDimensions({ Foo: 'Bar' });

  const sink = createSink();
  const env = createEnvironment(sink);
  const logger = new MetricsLogger(async () => env, context);

  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: Record<string, string> = {};
  dimensions[expectedKey] = expectedValue;

  // act
  logger.setDimensions(dimensions);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();
  expect(dimensionSets).toHaveLength(1);
  const actualDimensions = dimensionSets[0];
  expect(Object.keys(actualDimensions).length).toBe(1);
  const actualValue = actualDimensions[expectedKey];
  expect(actualValue).toBe(expectedValue);
});

test('setDimensions overwrites previous dimensions', async () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: Record<string, string> = {};
  dimensions[expectedKey] = expectedValue;

  // act
  logger.putDimensions({ Foo: 'Bar' });
  logger.setDimensions(dimensions);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();
  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[expectedKey];
  expect(actualValue).toBe(expectedValue);
});

test('can set namespace', async () => {
  // arrange
  const expectedValue = faker.random.word();

  // act
  logger.setNamespace(expectedValue);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualValue = sink.events[0].namespace;
  expect(actualValue).toBe(expectedValue);
});

test('flush() uses configured serviceName for default dimension if provided', async () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceName = expected;

  // act
  await logger.flush();

  // assert
  expectDimension('ServiceName', expected);
});

test('flush() uses environment serviceName for default dimension if not configured', async () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceName = undefined;
  environment.getName = () => expected;

  // act
  await logger.flush();

  // assert
  expectDimension('ServiceName', expected);
});

test('flush() uses configured serviceType for default dimension if provided', async () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceType = expected;

  // act
  await logger.flush();

  // assert
  expectDimension('ServiceType', expected);
});

test('flush() uses environment serviceType for default dimension if not configured', async () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceType = undefined;
  environment.getType = () => expected;

  // act
  await logger.flush();

  // assert
  expectDimension('ServiceType', expected);
});

test('flush() delegates context configuration to the environment by calling configureContext()', async () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceType = expected;

  // act
  await logger.flush();

  // assert
  expect(environment.configureContext).toBeCalled();
});

const expectDimension = (key: string, value: string) => {
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();

  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[key];
  expect(actualValue).toBe(value);
};
