import * as faker from 'faker';
import Configuration from '../../config/Configuration';

const sink = {};
const environment = {
  constructor: {
    name: 'TestEnvironment',
  },
  getName: () => jest.fn(),
  getType: () => jest.fn(),
  configureContext: jest.fn(),
  createSink: () => {
    return sink;
  },
};

const environmentDetector: any = {
  detectEnvironment: () => {
    return environment;
  },
};

jest.mock('../../environment/EnvironmentDetector', () => {
  return environmentDetector;
});

const createMetricsLogger = () => {
  // environment detection happens at module load time which is why
  // this needs to be inlined during test execution
  const { createMetricsLogger } = require('../MetricsLoggerFactory');
  return createMetricsLogger();
};

test('createMetricsLogger() creates a logger', () => {
  // arrange
  // act
  const logger = createMetricsLogger();

  // assert
  expect(logger).toBeTruthy();
});

test('createMetricsLogger() uses configured serviceName for default dimension if provided', () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceName = expected;

  // act
  const logger = createMetricsLogger();

  // assert
  expect(logger.context.defaultDimensions.ServiceName).toBe(expected);
});

test('createMetricsLogger() uses configured serviceType for default dimension if provided', () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceType = expected;

  // act
  const logger = createMetricsLogger();

  // assert
  expect(logger.context.defaultDimensions.ServiceType).toBe(expected);
});

test('createMetricsLogger() delegates context configuration to the environment by calling configureContext()', () => {
  // arrange
  const expected = faker.random.word();
  Configuration.serviceType = expected;

  // act
  createMetricsLogger();

  // assert
  expect(environment.configureContext).toBeCalled();
});

test('createMetricsLogger() configures logger with the sink provided by the environment', () => {
  // arrange
  const expectedSink = environment.createSink();

  // act
  const logger = createMetricsLogger();

  // assert
  expect(logger.sink).toBeTruthy();
  expect(logger.sink).toBe(expectedSink);
});
