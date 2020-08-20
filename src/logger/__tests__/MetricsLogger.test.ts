import * as faker from 'faker';
import { Unit } from '../..';
import { TestSink } from '../../../test/utils/TestSink';
import Configuration from '../../config/Configuration';
import { EnvironmentProvider } from '../../environment/EnvironmentDetector';
import { IEnvironment } from '../../environment/IEnvironment';
import { ISink } from '../../sinks/Sink';
import { MetricsContext } from '../MetricsContext';
import { MetricsLogger } from '../MetricsLogger';
import { Constants } from '../../Constants';

const createSink = () => new TestSink();
const createEnvironment = (sink: ISink) => {
  return {
    probe: () => Promise.resolve(true),
    getSink: () => sink,
    getName: () => 'test',
    getType: () => 'test',
    getLogGroupName: () => 'test',
    configureContext: jest.fn(),
  };
};
const createLogger = (env: EnvironmentProvider) => new MetricsLogger(env);

const DEFAULT_DIMENSIONS = { Foo: 'Bar' };
const createLoggerWithDefaultDimensions = (): MetricsLogger => {
  const context = MetricsContext.empty();
  context.setDefaultDimensions(DEFAULT_DIMENSIONS);

  const sink = createSink();
  const env = createEnvironment(sink);
  return new MetricsLogger(() => Promise.resolve(env), context);
}

let sink: TestSink;
let environment: IEnvironment;
let logger: MetricsLogger;

beforeEach(() => {
  sink = createSink();
  environment = createEnvironment(sink);
  logger = createLogger(() => Promise.resolve(environment));
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
  const logger = new MetricsLogger(() => Promise.resolve(env), context);

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

test('context is preserved across flush() calls', async () => {
  // arrange
  const expectedNamespace = 'Namespace';
  const metricKey = 'Metric';
  const expectedDimensionKey = 'Dim';
  const expectedPropertyKey = 'Prop';
  const expectedValues = 'Value';

  const dimensions: Record<string, string> = {};
  dimensions[expectedDimensionKey] = expectedValues;

  logger.setNamespace(expectedNamespace);
  logger.setProperty(expectedPropertyKey, expectedValues);
  logger.setDimensions(dimensions);

  // act
  logger.putMetric(metricKey, 0);
  await logger.flush();

  logger.putMetric(metricKey, 1);
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(2);
  for (let i = 0; i < sink.events.length; i++) {
    const evt = sink.events[i];
    // namespace, properties, dimensions should survive flushes
    expect(evt.namespace).toBe(expectedNamespace);
    expect(evt.getDimensions()[0][expectedDimensionKey]).toBe(expectedValues);
    expect(evt.properties[expectedPropertyKey]).toBe(expectedValues);
    // metric values should not survive flushes
    // @ts-ignore
    expect(evt.metrics.get(metricKey).values).toStrictEqual([i]);
  }
});

test('putMetricWithDimensions metric only', async () => {
  // arrange
  const logger = createLoggerWithDefaultDimensions();

  // act
  logger.putMetricWithDimensions({
    metrics: { "MyMetric": 100 }
  });

  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const evt = sink.events[0];
  expect(evt.metrics.size).toBe(1);
  expect(evt.metrics.get("MyMetric")).toBe(100);
  // everything else should be defaults
  expect(evt.namespace).toBe(Constants.DEFAULT_NAMESPACE);
  expect(evt.getDimensions()[0]).toBe(DEFAULT_DIMENSIONS);
});

test('putMetricWithDimensions single metric with namespace', async () => {
  // arrange
  const logger = createLoggerWithDefaultDimensions();

  // act
  logger.putMetricWithDimensions({
    metrics: { "MyMetric": 100 },
    namespace: "My-Namespace"
  });

  // act
  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const evt = sink.events[0];
  expect(evt.metrics.size).toBe(1);
  expect(evt.metrics.get("MyMetric")).toBe(100);
  expect(evt.namespace).toBe("My-Namespace");
  expect(evt.getDimensions()[0]).toBe(DEFAULT_DIMENSIONS);
});


test('putMetricWithDimensions with single dimensions and default namespace', async () => {
  // arrange
  const logger = createLoggerWithDefaultDimensions();
  const client = 'client';

  // act
  logger.putMetricWithDimensions({
    metrics: { Metric1: 100 },
    dimensions: [{ client }]
  });

  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const evt = sink.events[0];
  expect(evt.metrics.size).toBe(1);
  expect(evt.metrics.get("MyMetric")).toBe(100);
  expect(evt.namespace).toBe(Constants.DEFAULT_NAMESPACE);
  expect(evt.getDimensions()).toBe([{ ...DEFAULT_DIMENSIONS, client }]);
});

test('putMetricWithDimensions along multiple dimensions', async () => {
  // arrange
  const logger = createLoggerWithDefaultDimensions();
  const client = 'client';
  const pageType = 'pageType';

  // act
  logger.putMetricWithDimensions({
    metrics: {
      Metric1: 100,
    },
    namespace: "My Namespace",
    dimensions: [
      { client },
      { pageType },
      { client, pageType },
    ]
  });

  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const evt = sink.events[0];
  expect(evt.metrics.size).toBe(1);
  expect(evt.metrics.get("MyMetric")).toBe(100);
  expect(evt.namespace).toBe("My-Namespace");
  expect(evt.getDimensions()[0]).toBe([
    { ...DEFAULT_DIMENSIONS, client },
    { ...DEFAULT_DIMENSIONS, pageType },
    { ...DEFAULT_DIMENSIONS, client, pageType },
  ]);
});

test('putMetricWithDimensions without default dimensions', async () => {
  // arrange
  const logger = createLoggerWithDefaultDimensions();
  const client = 'client';
  const pageType = 'pageType';

  // act
  logger.putMetricWithDimensions({
    metrics: {
      Metric1: 100
    },
    namespace: "My-Namespace",
    dimensions: [
      { client },
      { pageType },
      { client, pageType },
    ],
    stripDefaultDimensions: true
  });

  await logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const evt = sink.events[0];
  expect(evt.metrics.size).toBe(1);
  expect(evt.metrics.get("MyMetric")).toBe(100);
  expect(evt.namespace).toBe("My-Namespace");
  expect(evt.getDimensions()[0]).toBe([
    { client },
    { pageType },
    { client, pageType },
  ]);
});

const expectDimension = (key: string, value: string) => {
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();

  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[key];
  expect(actualValue).toBe(value);
};
