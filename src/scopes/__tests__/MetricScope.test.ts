import sleep from '../../../test/utils/Sleep';
import { MetricsLogger } from '../../logger/MetricsLogger';
import { LambdaSink } from '../../sinks/LambdaSink';
import { metricScope } from '../MetricScope';

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
    return true;
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
