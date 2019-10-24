import sleep from '../../../test/utils/Sleep';
import { metricScope } from '../MetricScope';
import { MetricsLogger } from '../MetricsLogger';

jest.mock('../../logger/MetricsLoggerFactory', () => {
  return {
    createMetricsLogger: () => new MetricsLogger(jest.fn()),
  };
});

test('async scope executes handler function', async () => {
  // arrange
  let wasInvoked = false;

  const handler = metricScope(metrics => async (evt: any) => {
    await sleep(100);
    wasInvoked = true;
  });

  // act
  await handler();

  // assert
  expect(wasInvoked).toBe(true);
});

test('sync scope executes handler function', async () => {
  // arrange
  let a = false;

  const handler = metricScope(metrics => (evt: any) => {
    a = true;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  await handler();

  // assert
  expect(a).toBe(true);
});

test('async scope passes arguments', async () => {
  // arrange
  let arg = false;

  const handler = metricScope(metrics => async (input: any) => {
    arg = input;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  await handler(true);

  // assert
  expect(arg).toBe(true);
});

test('async scope returns child function return value', async () => {
  // arrange
  const expected = true;

  const handler = metricScope(metrics => async () => {
    return expected;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  const result = await handler();

  // assert
  expect(result).toBe(expected);
});

test('sync scope passes arguments', async () => {
  // arrange
  let arg = false;

  const handler = metricScope(metrics => (input: any) => {
    arg = input;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  await handler(true);

  // assert
  expect(arg).toBe(true);
});

test('sync scope returns child function return value', async () => {
  // arrange
  const expected = true;

  const handler = metricScope(metrics => () => {
    return expected;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  const result = await handler();

  // assert
  expect(result).toBe(expected);
});
