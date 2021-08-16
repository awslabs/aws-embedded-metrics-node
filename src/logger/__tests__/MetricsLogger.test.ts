import * as faker from 'faker';
import { Unit } from '../..';
import { TestSink } from '../../../test/utils/TestSink';
import Configuration from '../../config/Configuration';
import { EnvironmentProvider } from '../../environment/EnvironmentDetector';
import { IEnvironment } from '../../environment/IEnvironment';
import { ISink } from '../../sinks/Sink';
import { MetricsContext } from '../MetricsContext';
import { MetricsLogger } from '../MetricsLogger';

const createSink = (forceAcceptRejects = false) => new TestSink(forceAcceptRejects);
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

let sink: TestSink;
let environment: IEnvironment;
let logger: MetricsLogger;

describe('successful', () => {
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

  test('logs a warning when setting a property with the same name as an existing dimension', () => {
    // arrange
    const consoleWarnSpy = jest.spyOn(global.console, 'warn');
    const property1Name = '1';
    const property1Value = '1';
    const dimension1: Record<string, string> = {'1': '1'};

    // act
    logger.setDimensions(dimension1);
    logger.setProperty(property1Name, property1Value);

    // assert
    expect(console.warn).toHaveBeenCalledTimes(1);

    // clear
    consoleWarnSpy.mockClear();
  });

  test('logs a warning when creating a dimension with the same name as an existing property that does not belong to an existing dimension', () => {
    // arrange
    const consoleWarnSpy = jest.spyOn(global.console, 'warn');
    const property1Name = '1';
    const property1Value = '1';
    const property2Name = '2';
    const property2Value = '2';
    const dimension1: Record<string, string> = {'1': '1'};
    const dimension2: Record<string, string> = {'2': '2'};

    // act
    logger.setProperty(property1Name, property1Value);
    logger.setDimensions(dimension1);
    logger.setProperty(property2Name, property2Value);
    logger.putDimensions(dimension2);
    // assert
    expect(console.warn).toHaveBeenCalledTimes(2);

    // clear
    consoleWarnSpy.mockClear();
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

  test('defaults timestamp to now', async () => {
    // arrange
    const before = new Date();
    // recreate logger to regenerate meta.Timestamp set to now
    sink = createSink();
    environment = createEnvironment(sink);
    logger = createLogger(() => Promise.resolve(environment));

    // act
    logger.putMetric(faker.random.word(), faker.random.number());
    await logger.flush();

    //assert
    const after = new Date();
    const lastEvent = sink.events.slice(-1)[0];
    expectTimestampWithin(lastEvent, [before, after]);
  });

  test('can set timestamp', async () => {
    // arrange
    const timestamp = faker.date.recent();
    logger.setTimestamp(timestamp)

    // act
    logger.putMetric(faker.random.word(), faker.random.number());
    await logger.flush();

    //assert
    expect(sink.events.length).toEqual(1);
    expect(sink.events[0].meta.Timestamp).toEqual(timestamp.getTime());
  });

  test('flush() preserves timestamp if set explicitly', async () => {
    // arrange
    const timestamp = faker.date.recent();
    logger.setTimestamp(timestamp)

    // act
    logger.putMetric(faker.random.word(), faker.random.number());
    await logger.flush();
    logger.putMetric(faker.random.word(), faker.random.number());
    await logger.flush();

    //assert
    expect(sink.events.length).toEqual(2);
    expect(sink.events[1].meta.Timestamp).toEqual(timestamp.getTime());
  });

  test('flush() resets timestamp to now if not set explicitly', async () => {
    // arrange
    const before = new Date();
    // recreate logger to regenerate meta.Timestamp set to now
    sink = createSink();
    environment = createEnvironment(sink);
    logger = createLogger(() => Promise.resolve(environment));
    // act
    logger.putMetric(faker.random.word(), faker.random.number());
    await logger.flush();
    const afterFirstFlush = new Date();
    logger.putMetric(faker.random.word(), faker.random.number());
    await logger.flush();
    const afterSecondFlush = new Date();

    //assert
    expect(sink.events.length).toEqual(2);

    expectTimestampWithin(sink.events[0], [before, afterFirstFlush]);
    expectTimestampWithin(sink.events[1], [afterFirstFlush, afterSecondFlush]);
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
    const expectedTimestamp = faker.date.recent();

    const dimensions: Record<string, string> = {};
    dimensions[expectedDimensionKey] = expectedValues;

    logger.setNamespace(expectedNamespace);
    logger.setProperty(expectedPropertyKey, expectedValues);
    logger.setDimensions(dimensions);
    logger.setTimestamp(expectedTimestamp);

    // act
    logger.putMetric(metricKey, 0);
    await logger.flush();

    logger.putMetric(metricKey, 1);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(2);
    for (let i = 0; i < sink.events.length; i++) {
      const evt = sink.events[i];
      // namespace, properties, dimensions, timestamp should survive flushes
      expect(evt.namespace).toBe(expectedNamespace);
      expect(evt.getDimensions()[0][expectedDimensionKey]).toBe(expectedValues);
      expect(evt.properties[expectedPropertyKey]).toBe(expectedValues);
      expect(evt.meta.Timestamp).toEqual(expectedTimestamp.getTime());
      // metric values should not survive flushes
      // @ts-ignore
      expect(evt.metrics.get(metricKey).values).toStrictEqual([i]);
    }
  });

  const expectDimension = (key: string, value: string) => {
    expect(sink.events).toHaveLength(1);
    const dimensionSets = sink.events[0].getDimensions();

    expect(dimensionSets).toHaveLength(1);
    const dimension = dimensionSets[0];
    const actualValue = dimension[key];
    expect(actualValue).toBe(value);
  };

  const expectTimestampWithin = (context: MetricsContext, range: [Date, Date]) => {
    expect(context.meta.Timestamp).toBeGreaterThanOrEqual(range[0].getTime());
    expect(context.meta.Timestamp).toBeLessThanOrEqual(range[1].getTime());
  }
});

describe('failure', () => {
  beforeEach(() => {
    sink = createSink(true);
    environment = createEnvironment(sink);
    logger = createLogger(() => Promise.resolve(environment));
  });

  test('flush should reject on sink error', async () => {
    // assert
    await expect(logger.flush()).rejects.toBeUndefined();
  });
});
