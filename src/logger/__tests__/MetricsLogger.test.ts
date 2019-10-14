import * as faker from 'faker';
import { TestSink } from '../../../testutils/TestSink';
import { MetricsContext } from '../MetricsContext';
import { MetricsLogger } from '../MetricsLogger';
import { ISink } from '../../sinks/Sink';

const createSink = () => new TestSink();
const createLogger = (sink: ISink) => new MetricsLogger(sink);

let sink: TestSink;
let logger: MetricsLogger;

beforeEach(() => {
  sink = createSink();
  logger = createLogger(sink);
});

test('can set property', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();

  // act
  logger.setProperty(expectedKey, expectedValue);
  logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualValue = sink.events[0].properties[expectedKey];
  expect(actualValue).toBeTruthy();
  expect(actualValue).toBe(expectedValue);
});

test('can put metric', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();

  // act
  logger.putMetric(expectedKey, expectedValue);
  logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualMetric = sink.events[0].metrics.get(expectedKey);
  expect(actualMetric).toBeTruthy();
  expect(actualMetric!.value).toBe(expectedValue);
  expect(actualMetric!.unit).toBe('None');
});

test('put metric overwrites previous calls using same key', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();

  // act
  logger.putMetric(expectedKey, faker.random.number());
  logger.putMetric(expectedKey, faker.random.number());
  logger.putMetric(expectedKey, expectedValue);
  logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const actualMetric = sink.events[0].metrics.get(expectedKey);
  expect(actualMetric).toBeTruthy();
  expect(actualMetric!.value).toBe(expectedValue);
  expect(actualMetric!.unit).toBe('None');
});

test('can put dimension', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: Record<string, string> = {};
  dimensions[expectedKey] = expectedValue;

  // act
  logger.putDimensions(dimensions);
  logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();
  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[expectedKey];
  expect(actualValue).toBe(expectedValue);
});

test('setDimensions overwrites default dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  context.setDefaultDimensions({ Foo: 'Bar' });

  const sink = createSink();
  const logger = new MetricsLogger(sink, context);

  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: Record<string, string> = {};
  dimensions[expectedKey] = expectedValue;

  // act
  logger.setDimensions(dimensions);
  logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();
  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[expectedKey];
  expect(actualValue).toBe(expectedValue);
});

test('setDimensions overwrites previous dimensions', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: Record<string, string> = {};
  dimensions[expectedKey] = expectedValue;

  // act
  logger.putDimensions({ Foo: 'Bar' });
  logger.setDimensions(dimensions);
  logger.flush();

  // assert
  expect(sink.events).toHaveLength(1);
  const dimensionSets = sink.events[0].getDimensions();
  expect(dimensionSets).toHaveLength(1);
  const dimension = dimensionSets[0];
  const actualValue = dimension[expectedKey];
  expect(actualValue).toBe(expectedValue);
});
