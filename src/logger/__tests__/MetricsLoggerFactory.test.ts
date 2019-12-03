const createMetricsLogger = () => {
  // environment detection happens at module load time which is why
  // this needs to be inlined during test execution
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createMetricsLogger } = require('../MetricsLoggerFactory');
  return createMetricsLogger();
};

test('createMetricsLogger() creates a logger', () => {
  // arrange
  // act
  const logger = createMetricsLogger();

  // assert
  expect(logger).toBeTruthy();
  expect(logger.constructor.name).toBe('MetricsLogger');
});
