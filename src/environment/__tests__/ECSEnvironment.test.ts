import * as faker from 'faker';
import config from '../../config/Configuration';
import { ECSEnvironment } from '../ECSEnvironment';
import { MetricsContext } from '../../logger/MetricsContext';
import { fetch } from '../../utils/Fetch';

import * as os from 'os';
import { Constants } from '../../Constants';
jest.mock('../../utils/Fetch', () => ({
  fetch: jest.fn(),
}));

beforeEach(() => {
  config.agentEndpoint = undefined;
  config.serviceName = undefined;
  config.logGroupName = undefined;
  process.env = {
    ECS_CONTAINER_METADATA_URI: faker.internet.ip(),
  };
});

describe('probe', () => {
  test('returns false if ECS_CONTAINER_METADATA_URI not set', async () => {
    // arrange
    process.env.ECS_CONTAINER_METADATA_URI = '';
    const env = new ECSEnvironment();

    // act
    const result = await env.probe();

    // assert
    expect(result).toBe(false);
  });

  test('returns true if ECS_CONTAINER_METADATA_URI set', async () => {
    // arrange -- env var is set in beforeEach
    const env = new ECSEnvironment();

    // act
    const result = await env.probe();

    // assert
    expect(result).toBe(true);
  });

  test('configures endpoint to use fluent bit if set', async () => {
    // arrange
    process.env.FLUENT_HOST = faker.internet.ip();
    const expectedEndpoint = `tcp://${process.env.FLUENT_HOST}:${Constants.DEFAULT_AGENT_PORT}`;

    const env = new ECSEnvironment();

    // act
    await env.probe();

    // assert
    expect(config.agentEndpoint).toBe(expectedEndpoint);
  });

  test('does not configure fluent bit endpoint if override specified', async () => {
    // arrange
    const configuredOverride = faker.internet.ip();
    config.agentEndpoint = configuredOverride;
    process.env.FLUENT_HOST = faker.internet.ip();

    const env = new ECSEnvironment();

    // act
    await env.probe();

    // assert
    expect(config.agentEndpoint).toBe(configuredOverride);
  });
});

describe('configureContext()', () => {
  test('uses ECS metadata', async () => {
    // arrange
    const expected = getRandomECSMetadata();

    // @ts-ignore
    fetch.mockImplementation(() => expected);
    const env = new ECSEnvironment();
    await env.probe();

    // act
    const ctx = MetricsContext.empty();
    env.configureContext(ctx);

    // assert
    expect(ctx.properties.containerId).toBe(os.hostname());
    expect(ctx.properties.createdAt).toBe(expected.CreatedAt);
    expect(ctx.properties.startedAt).toBe(expected.StartedAt);
    expect(ctx.properties.image).toBe(expected.Image);
    expect(ctx.properties.cluster).toBe(expected.Labels['com.amazonaws.ecs.cluster']);
    expect(ctx.properties.taskArn).toBe(expected.Labels['com.amazonaws.ecs.task-arn']);
  });

  test('does not set default dimensions if fluent bit is not set', async () => {
    // arrange
    const expected = getRandomECSMetadata();

    // @ts-ignore
    fetch.mockImplementation(() => expected);
    const env = new ECSEnvironment();
    await env.probe();

    // act
    const ctx = MetricsContext.empty();
    env.configureContext(ctx);

    // assert
    expect(ctx.getDimensions().length).toBe(0);
  });

  test('sets default dimensions without LogGroup if fluent bit is set', async () => {
    // arrange
    process.env.FLUENT_HOST = faker.internet.ip();
    const expected = getRandomECSMetadata();

    // @ts-ignore
    fetch.mockImplementation(() => expected);
    const env = new ECSEnvironment();
    await env.probe();

    // act
    const ctx = MetricsContext.empty();
    env.configureContext(ctx);

    // assert
    expect(ctx.getDimensions().length).toBe(1);
    const dimensionSet = ctx.getDimensions()[0];
    expect(Object.keys(dimensionSet).length).toBe(2);
    expect(dimensionSet['ServiceName']).toBe(expected.Image);
    expect(dimensionSet['ServiceType']).toBe('AWS::ECS::Container');
    expect(dimensionSet['LogGroup']).toBe(undefined);
  });
});

describe('getLogGroupName()', () => {
  test('is empty if FluentBit configured', async () => {
    // arrange
    process.env.FLUENT_HOST = faker.internet.ip();

    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getLogGroupName();

    // assert
    expect(result).toBe('');
  });

  test('getLogGroupName() return override if configured', async () => {
    // arrange
    config.logGroupName = faker.random.alphaNumeric(10);

    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getLogGroupName();

    // assert
    expect(result).toBe(config.logGroupName);
  });

  test('getLogGroupName() returns service name if not configured', async () => {
    // arrange
    config.serviceName = faker.random.alphaNumeric(10);

    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getLogGroupName();

    // assert
    expect(result).toBe(config.serviceName);
  });
});

describe('getName()', () => {
  test('returns service name if configured', async () => {
    // arrange
    config.serviceName = faker.random.alphaNumeric(10);

    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getName();

    // assert
    expect(result).toBe(config.serviceName);
  });

  test('returns formatted image name if available', async () => {
    // arrange
    const formattedImageName = `${faker.lorem.word()}:latest`;
    const fullImageName = `${faker.random.number({
      min: 0,
      max: 999999999999,
    })}.dkr.ecr.<region>.amazonaws.com/${formattedImageName}`;
    const metadata = {
      Image: fullImageName,
      Labels: {},
    };

    // @ts-ignore
    fetch.mockImplementation(() => metadata);
    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getName();

    // assert
    expect(result).toBe(formattedImageName);
  });

  test('returns Unknown if image name is undefined', async () => {
    // arrange
    const expectedName = `Unknown`;
    const metadata = {
      Image: undefined,
      Labels: {},
    };

    // @ts-ignore
    fetch.mockImplementation(() => metadata);
    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getName();

    // assert
    expect(result).toBe(expectedName);
  });

  test('returns Unknown if image not available', async () => {
    // arrange
    // @ts-ignore
    fetch.mockImplementation(() => {
      return {};
    });
    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result = env.getName();

    // assert
    expect(result).toBe('Unknown');
  });
});

describe('getType()', () => {
  test('returns AWS::ECS::Container', () => {
    // arrange
    const env = new ECSEnvironment();

    // act
    const result = env.getType();

    // assert
    expect(result).toBe('AWS::ECS::Container');
  });
});

describe('getSink()', () => {
  test('returns AgentSink without LogGroup if FluentBit configured', async () => {
    // arrange
    process.env.FLUENT_HOST = faker.internet.ip();

    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result: any = env.getSink();

    // assert
    expect(result.name).toBe('AgentSink');
    expect(result.logGroupName).toBe('');
  });

  test('returns AgentSink with LogGroup if FluentBit not configured', async () => {
    // arrange
    config.logGroupName = faker.lorem.word();

    const env = new ECSEnvironment();
    await env.probe();

    // act
    const result: any = env.getSink();

    // assert
    expect(result.name).toBe('AgentSink');
    expect(result.logGroupName).toBe(config.logGroupName);
  });
});

const getRandomECSMetadata = (): any => {
  return {
    CreatedAt: faker.date.past(),
    StartedAt: faker.date.past(),
    Image: faker.lorem.word(),
    Labels: {
      'com.amazonaws.ecs.cluster': faker.random.alphaNumeric(),
      'com.amazonaws.ecs.task-arn': faker.random.alphaNumeric(),
    },
  };
};
