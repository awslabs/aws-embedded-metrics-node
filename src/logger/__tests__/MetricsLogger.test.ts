import { faker } from '@faker-js/faker';
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
    const expectedValue = faker.datatype.number();

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
    const expectedValues = [faker.datatype.number(), faker.datatype.number()];

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
    const expectedValue = faker.datatype.number();
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
    const expectedValue = faker.datatype.number();
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

  test('setDimensions with default dimensions enabled', async () => {
    // arrange
    const expectedKey = 'key';
    const expectedValue = 'value';
    const dimensions: Record<string, string> = {};
    dimensions[expectedKey] = expectedValue;

    // act
    logger.putDimensions({ foo: 'bar' });
    logger.setDimensions(dimensions, true);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(1);

    const dimensionSets = sink.events[0].getDimensions();
    expect(dimensionSets).toHaveLength(1);

    const dimension = dimensionSets[0];
    expect(Object.keys(dimension).length).toBe(4);
    expect(dimension[expectedKey]).toBe(expectedValue);
  });

  test('setDimensions with default dimensions disabled', async () => {
    // arrange
    const expectedKey1 = 'key1';
    const expectedValue1 = 'value1';
    const expectedKey2 = 'key2';
    const expectedValue2 = 'value2';
    const dimensions1: Record<string, string> = {};
    const dimensions2: Record<string, string> = {};
    dimensions1[expectedKey1] = expectedValue1;
    dimensions2[expectedKey2] = expectedValue2;

    const dimensionsList = [dimensions1, dimensions2];

    // act
    logger.putDimensions({ foo: 'bar' });
    logger.setDimensions(dimensionsList, false);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(1);

    const dimensionSets = sink.events[0].getDimensions();
    expect(dimensionSets).toHaveLength(2);

    const dimension1 = dimensionSets[0];
    const dimension2 = dimensionSets[1];
    expect(Object.keys(dimension1).length).toBe(1);
    expect(Object.keys(dimension2).length).toBe(1);

    expect(dimension1[expectedKey1]).toBe(expectedValue1);
    expect(dimension2[expectedKey2]).toBe(expectedValue2);
  });

  test('setDimensions with empty dimension set', async () => {
    // arrange
    const dimensions: Record<string, string> = {};

    // act
    logger.putDimensions({ foo: 'bar' });
    logger.setDimensions(dimensions);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(1);

    const dimensionSets = sink.events[0].getDimensions();
    expect(dimensionSets).toHaveLength(1);
    expect(Object.keys(dimensionSets[0]).length).toBe(0);
  });

  test('resetDimensions with default dimensions enabled', async () => {
    // arrange
    const expectedKey = 'key';
    const expectedValue = 'value';
    const dimensions: Record<string, string> = {};
    dimensions[expectedKey] = expectedValue;

    // act
    logger.putDimensions({ foo: 'bar' });
    logger.resetDimensions(true);
    logger.putDimensions(dimensions);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(1);
    const dimensionSets = sink.events[0].getDimensions();

    expect(dimensionSets).toHaveLength(1);
    const dimension = dimensionSets[0];

    expect(Object.keys(dimension).length).toBe(4);
    expect(dimension[expectedKey]).toBe(expectedValue);
    expect(dimension['foo']).toBeUndefined();
  });

  test('resetDimensions with default dimensions disabled', async () => {
    // arrange
    const expectedKey = 'key';
    const expectedValue = 'value';
    const dimensions: Record<string, string> = {};
    dimensions[expectedKey] = expectedValue;

    // act
    logger.putDimensions({ foo: 'bar' });
    logger.resetDimensions(false);
    logger.putDimensions(dimensions);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(1);
    const dimensionSets = sink.events[0].getDimensions();

    expect(dimensionSets).toHaveLength(1);
    const dimension = dimensionSets[0];

    expect(Object.keys(dimension).length).toBe(1);
    expect(dimension[expectedKey]).toBe(expectedValue);
    expect(dimension['foo']).toBeUndefined();
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
    logger.putMetric(faker.random.word(), faker.datatype.number());
    await logger.flush();

    //assert
    const after = new Date();
    const lastEvent = sink.events.slice(-1)[0];
    expectTimestampWithin(lastEvent, [before, after]);
  });

  test('can set timestamp', async () => {
    // arrange
    const timestamp = faker.date.recent();
    logger.setTimestamp(timestamp);

    // act
    logger.putMetric(faker.random.word(), faker.datatype.number());
    await logger.flush();

    //assert
    expect(sink.events.length).toEqual(1);
    expect(sink.events[0].meta.Timestamp).toEqual(timestamp.getTime());
  });

  test('flush() preserves timestamp if set explicitly', async () => {
    // arrange
    const timestamp = faker.date.recent();
    logger.setTimestamp(timestamp);

    // act
    logger.putMetric(faker.random.word(), faker.datatype.number());
    await logger.flush();
    logger.putMetric(faker.random.word(), faker.datatype.number());
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
    logger.putMetric(faker.random.word(), faker.datatype.number());
    await logger.flush();
    const afterFirstFlush = new Date();
    logger.putMetric(faker.random.word(), faker.datatype.number());
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

  test('configure flush() to not preserve custom dimensions', async () => {
    // arrange
    const expectedKey = 'dim';
    const expectedValue = 'value';
    const dimensions: Record<string, string> = {};
    dimensions[expectedKey] = expectedValue;

    // act
    logger.flushPreserveDimensions = false;
    logger.putDimensions({ foo: 'bar' });
    await logger.flush();

    logger.putDimensions(dimensions);
    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(2);

    const evt1 = sink.events[0];
    expect(Object.keys(evt1.getDimensions()[0]).length).toBe(4);
    expect(evt1.getDimensions()[0]['foo']).toBe('bar');

    const evt2 = sink.events[1];
    expect(Object.keys(evt2.getDimensions()[0]).length).toBe(4);
    expect(evt2.getDimensions()[0]['foo']).toBeUndefined();
    expect(evt2.getDimensions()[0][expectedKey]).toBe(expectedValue);
  });

  test('configure flush() to not preserve any dimenions', async () => {
    // arrange
    logger.flushPreserveDimensions = false;
    logger.resetDimensions(false);

    // act
    logger.putDimensions({ foo: 'bar' });
    await logger.flush();

    logger.putDimensions({ baz: 'qux' });
    await logger.flush();

    await logger.flush();

    // assert
    expect(sink.events).toHaveLength(3);

    const evt1 = sink.events[0];
    expect(Object.keys(evt1.getDimensions()[0]).length).toBe(1);
    expect(evt1.getDimensions()[0]['foo']).toBe('bar');

    const evt2 = sink.events[1];
    expect(Object.keys(evt2.getDimensions()[0]).length).toBe(1);
    expect(evt2.getDimensions()[0]['baz']).toBe('qux');

    const evt3 = sink.events[2];
    expect(evt3.getDimensions().length).toBe(0);
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
  };
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
