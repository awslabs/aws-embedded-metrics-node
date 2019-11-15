import * as faker from 'faker';
import { MetricsContext } from '../../logger/MetricsContext';
import { LogSerializer } from '../LogSerializer';

test('serializes dimensions', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();
  const dimensions: any = {};
  dimensions[expectedKey] = expectedValue;

  const expected: any = { ...getEmptyPayload(), ...dimensions };
  expected._aws.CloudWatchMetrics[0].Dimensions.push([expectedKey]);

  const context = getContext();
  context.putDimensions(dimensions);
  // act
  const resultJson = serializer.serialize(context);

  // assert
  assertJsonEquality(resultJson, expected);
});

test('cannot serialize more than 10 dimensions', () => {
  // arrange
  const dimensions: any = {};
  const dimensionPointers = [];
  const allowedDimensions = 10;
  const dimensionsToAdd = 11;
  for (let i = 0; i < dimensionsToAdd; i++) {
    const expectedKey = `${i}`;
    const expectedValue = faker.random.word();
    dimensions[expectedKey] = expectedValue;
    dimensionPointers.push(expectedKey);
  }

  const expectedDimensionPointers = dimensionPointers.slice(0, allowedDimensions);

  const expected: any = { ...getEmptyPayload(), ...dimensions };
  expected._aws.CloudWatchMetrics[0].Dimensions.push(expectedDimensionPointers);

  const context = getContext();
  context.putDimensions(dimensions);
  // act
  const resultJson = serializer.serialize(context);

  // assert
  assertJsonEquality(resultJson, expected);
});

test('serializes properties', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();

  const expected: any = { ...getEmptyPayload() };
  expected[expectedKey] = expectedValue;

  const context = getContext();
  context.setProperty(expectedKey, expectedValue);

  // act
  const resultJson = serializer.serialize(context);

  // assert
  assertJsonEquality(resultJson, expected);
});

test('serializes metrics with single datapoint', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();
  const expectedMetricDefinition = {
    Name: expectedKey,
    Unit: 'None',
  };
  const expected: any = { ...getEmptyPayload() };
  expected[expectedKey] = expectedValue;
  expected._aws.CloudWatchMetrics[0].Metrics.push(expectedMetricDefinition);

  const context = getContext();
  context.putMetric(expectedKey, expectedValue);

  // act
  const resultJson = serializer.serialize(context);

  // assert
  assertJsonEquality(resultJson, expected);
});

test('serializes metrics with multiple datapoints', () => {
  // arrange
  const expectedKey = faker.random.word();
  const expectedValues = [faker.random.number(), faker.random.number()];
  const expectedMetricDefinition = {
    Name: expectedKey,
    Unit: 'None',
  };
  const expected: any = { ...getEmptyPayload() };
  expected[expectedKey] = expectedValues;
  expected._aws.CloudWatchMetrics[0].Metrics.push(expectedMetricDefinition);

  const context = getContext();
  context.putMetric(expectedKey, expectedValues[0]);
  context.putMetric(expectedKey, expectedValues[1]);

  // act
  const resultJson = serializer.serialize(context);

  // assert
  assertJsonEquality(resultJson, expected);
});

const assertJsonEquality = (resultJson: string, expectedObj: any) => {
  const actual = JSON.parse(resultJson);
  expect(actual).toStrictEqual(expectedObj);
};

const getEmptyPayload = () => {
  return Object.assign(
    {},
    {
      _aws: {
        CloudWatchMetrics: [
          {
            Dimensions: [],
            Metrics: [],
            Namespace: 'aws-embedded-metrics',
          },
        ],
        Timestamp: 0,
      },
    },
  );
};

const serializer = new LogSerializer();
const getContext = () => {
  const context = MetricsContext.empty();
  context.meta.Timestamp = 0;
  return context;
};
