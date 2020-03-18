// this test demonstrates how other packages could mock
// the aws-embedded-metrics modules when using the
// jest testing framework: https://github.com/facebook/jest

// import the modules that are being tested
// each of the methods being tested use a variation
// of the aws-embedded-metrics logger
const { usingScope, usingCreateLogger } = require('../src/module');

// setup our mocks
jest.mock('aws-embedded-metrics', () => {
  // here we're pulling the actual Units in since our methods under
  // test depend on it and there's no reason to mock this type since
  // it's just a POJO
  const { Unit } = jest.requireActual('aws-embedded-metrics');

  // here we're mocking the actual logger that our methods under test use
  const mockLogger = {
    putMetric: jest.fn(),
    putDimensions: jest.fn(),
    setProperty: jest.fn(),
    flush: jest.fn(),
  };

  // return the mocked module
  return {
    // by returning the actual mock logger instance,
    // our tests can make assertions about which metrics
    // were logged if desired
    mockLogger,
    metricScope: fn => fn(mockLogger),
    createMetricsLogger: () => mockLogger,
    Unit,
  };
});

// import the mock logger that we setup above
// we need to do it this way since Jest won't allow us to
// share variables with the mocked modules since mocks
// get hoisted above everything else
const { mockLogger } = require('aws-embedded-metrics');

// now we'll begin testing our actual methods
test('usingScope records latency with metadata', async () => {
  // arrange
  const count = Math.random() * 100;
  const accountId = Math.random() * 100;
  const requestId = '1e2171fa-fe92-4b20-b44d-43f908beda14';

  // act
  await usingScope({ accountId, count }, { requestId });

  // assert
  expect(mockLogger.putMetric).toBeCalledWith('EventCount', count, 'Count');
  expect(mockLogger.putDimensions).toBeCalledWith({ Service: 'Aggregator' });
  expect(mockLogger.setProperty).toBeCalledWith('RequestId', requestId);
  expect(mockLogger.setProperty).toBeCalledWith('AccountId', accountId);
});

test('usingCreateLogger records latency with metadata', async () => {
  // arrange
  const count = Math.random() * 100;
  const accountId = Math.random() * 100;
  const requestId = 'de126e0c-4ca0-484b-88f8-7bde08f2ae46';

  // act
  await usingCreateLogger({ accountId, count }, { requestId });

  // assert
  expect(mockLogger.putMetric).toBeCalledWith('EventCount', count, 'Count');
  expect(mockLogger.putDimensions).toBeCalledWith({ Service: 'Aggregator' });
  expect(mockLogger.setProperty).toBeCalledWith('RequestId', requestId);
  expect(mockLogger.setProperty).toBeCalledWith('AccountId', accountId);
  expect(mockLogger.flush).toBeCalled();
});
