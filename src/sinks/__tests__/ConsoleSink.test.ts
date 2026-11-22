import { faker } from '@faker-js/faker';
import { MetricsContext } from '../../logger/MetricsContext';
import { ConsoleSink } from '../ConsoleSink';
import { LocalEnvironment } from '../../environment/LocalEnvironment';
import { MetricsLogger } from '../../logger/MetricsLogger';

beforeEach(() => {
  console.log = jest.fn();
});

afterEach(() => {
  delete process.env.AWS_LAMBDA_LOG_FORMAT;
});

test('logger flush preserves ordinary logs after metric values are reset', async () => {
  const environment = new LocalEnvironment();
  const logger = new MetricsLogger(() => Promise.resolve(environment));
  logger.setProperty('Message', 'still logged');
  logger.putDimensions({ Operation: 'test-operation' });
  logger.putMetric('Count', 0);

  await logger.flush();
  await logger.flush();
  logger.putMetric('Count', 1);
  await logger.flush();

  const events = (console.log as jest.Mock).mock.calls.map(([event]) => JSON.parse(event));
  expect(events).toHaveLength(3);
  expect(events[0]._aws.CloudWatchMetrics[0].Metrics).toStrictEqual([{ Name: 'Count', Unit: 'None' }]);
  expect(events[0].Count).toBe(0);
  expect(events[1]).not.toHaveProperty('_aws');
  expect(events[1]).not.toHaveProperty('Count');
  expect(events[2]._aws.CloudWatchMetrics[0].Metrics).toStrictEqual([{ Name: 'Count', Unit: 'None' }]);
  expect(events[2].Count).toBe(1);
  for (const event of events) {
    expect(event.Message).toBe('still logged');
    expect(event.Operation).toBe('test-operation');
    expect(event.ServiceName).toBeDefined();
    expect(event.ServiceType).toBeDefined();
    expect(event.LogGroup).toBeDefined();
  }
});

test('accept serializes and writes result to stdout', () => {
  // arrange
  const expected = faker.random.alphaNumeric(20);
  const serializer: any = {
    serialize: jest.fn(() => [expected]),
  };

  const sink = new ConsoleSink(serializer);

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(sink.console).toBe(console);
  expect(console.log).toBeCalledWith(expected);
});

test('accept serialized and writes result to stdout when lambda log format is JSON', () => {
  // arrange
  process.env.AWS_LAMBDA_LOG_FORMAT = 'JSON';
  const expected = faker.random.alphaNumeric(20);
  const serializer: any = {
    serialize: jest.fn(() => [expected]),
  };

  const sink = new ConsoleSink(serializer);
  const spy = jest.spyOn(sink.console, 'log');

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(sink.console).not.toBe(console);
  expect(spy).toBeCalledWith(expected);
});

test('accept writes multiple messages to stdout', () => {
  // arrange
  const expectedMessages = faker.datatype.number({ min: 2, max: 100 });
  const expected = new Array(expectedMessages).fill(null).map(() => faker.random.alphaNumeric(20));
  const serializer: any = {
    serialize: jest.fn(() => expected),
  };

  const sink = new ConsoleSink(serializer);

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(sink.console).toBe(console);
  expect(console.log).toBeCalledTimes(expectedMessages);
  expected.forEach((e) => expect(console.log).toBeCalledWith(e));
});

test('accept writes multiple messages to stdout when lambda log format is JSON', () => {
  // arrange
  process.env.AWS_LAMBDA_LOG_FORMAT = 'JSON';
  const expectedMessages = faker.datatype.number({ min: 2, max: 100 });
  const expected = new Array(expectedMessages).fill(null).map(() => faker.random.alphaNumeric(20));
  const serializer: any = {
    serialize: jest.fn(() => expected),
  };

  const sink = new ConsoleSink(serializer);
  const spy = jest.spyOn(sink.console, 'log');

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(sink.console).not.toBe(console);
  expect(spy).toBeCalledTimes(expectedMessages);
  expected.forEach((e) => expect(spy).toBeCalledWith(e));
});
