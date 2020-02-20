import * as faker from 'faker';
import { MetricsContext } from '../../logger/MetricsContext';
import { LambdaEnvironment } from '../LambdaEnvironment';

test('probe() returns true if function name provided in environment', async () => {
  // arrange
  process.env.AWS_LAMBDA_FUNCTION_NAME = faker.random.word();
  const env = new LambdaEnvironment();

  // act
  const result = await env.probe();

  // assert
  expect(result).toBe(true);
});

test('getName() returns function name', () => {
  // arrange
  const env = new LambdaEnvironment();
  const expectedName = faker.random.word();
  process.env.AWS_LAMBDA_FUNCTION_NAME = expectedName;

  // act
  const result = env.getName();

  // assert
  expect(result).toBe(expectedName);
});

test('getType() returns "AWS::Lambda::Function"', () => {
  // arrange
  const env = new LambdaEnvironment();

  // act
  const result = env.getType();

  // assert
  expect(result).toBe('AWS::Lambda::Function');
});

test('getLogGroupName() returns function name', () => {
  // arrange
  const env = new LambdaEnvironment();
  const expectedName = faker.random.word();
  process.env.AWS_LAMBDA_FUNCTION_NAME = expectedName;

  // act
  const result = env.getLogGroupName();

  // assert
  expect(result).toBe(expectedName);
});

test('createSink() creates a ConsoleSink', () => {
  // arrange
  const expectedSink = 'ConsoleSink';
  const env = new LambdaEnvironment();

  // act
  const sink = env.getSink();

  // assert
  expect(sink.name).toBe(expectedSink);
});

test('configureContex() adds default properties', () => {
  // arrange
  const env = new LambdaEnvironment();
  const context = MetricsContext.empty();

  const executionEnvironment = faker.random.word();
  const memorySize = faker.random.word();
  const functionVersion = faker.random.word();
  const logStreamId = faker.random.word();

  process.env.AWS_EXECUTION_ENV = executionEnvironment;
  process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = memorySize;
  process.env.AWS_LAMBDA_FUNCTION_VERSION = functionVersion;
  process.env.AWS_LAMBDA_LOG_STREAM_NAME = logStreamId;

  // act
  env.configureContext(context);

  // assert
  expect(context.properties.executionEnvironment).toBe(executionEnvironment);
  expect(context.properties.memorySize).toBe(memorySize);
  expect(context.properties.functionVersion).toBe(functionVersion);
  expect(context.properties.logStreamId).toBe(logStreamId);
});

test('configureContex() sets trace id if sampled', () => {
  // arrange
  const expectedTraceId = 'Root=1-5da0c3a1-0494a318bc08973b890cafed;Parent=236fcb7c7ff79f19;Sampled=1';
  process.env._X_AMZN_TRACE_ID = expectedTraceId;
  const context = MetricsContext.empty();
  const env = new LambdaEnvironment();

  // act
  env.configureContext(context);

  // assert
  expect(context.properties.traceId).toBe(expectedTraceId);
});

test('configureContex() does not set trace id if not sampled', () => {
  // arrange
  const expectedTraceId = 'Root=1-5da0c3a1-0494a318bc08973b890cafed;Parent=236fcb7c7ff79f19;Sampled=0';
  process.env._X_AMZN_TRACE_ID = expectedTraceId;
  const context = MetricsContext.empty();
  const env = new LambdaEnvironment();

  // act
  env.configureContext(context);

  // assert
  expect(context.properties.traceId).toBe(undefined);
});
