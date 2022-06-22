import * as faker from 'faker';
import { Constants } from '../../Constants';
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
  const resultJson = serializer.serialize(context)[0];

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
  const resultJson = serializer.serialize(context)[0];

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
  const resultJson = serializer.serialize(context)[0];

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
  const resultJson = serializer.serialize(context)[0];

  // assert
  assertJsonEquality(resultJson, expected);
});

test('serializes more than 100 metrics into multiple events', () => {
  // arrange
  const expectedValue = 1;
  const metrics = 275;
  const expectedBatches = 3;

  const context = getContext();
  for (let index = 0; index < metrics; index++) {
    const expectedKey = `Metric-${index}`;
    context.putMetric(expectedKey, expectedValue);
  }

  // act
  const results = serializer.serialize(context);

  // assert
  const resultObjs = results.map(resultJson => JSON.parse(resultJson));
  expect(resultObjs.length).toBe(expectedBatches);
  for (let batchIndex = 0; batchIndex < expectedBatches; batchIndex++) {
    const expectedMetricCount = batchIndex === expectedBatches - 1 ? metrics % 100 : 100;

    const resultObj = resultObjs[batchIndex];
    expect(resultObj._aws.CloudWatchMetrics[0].Metrics.length).toBe(expectedMetricCount);
  }

  const mergedResult = Object.assign({}, ...resultObjs);
  for (let index = 0; index < metrics; index++) {
    expect(mergedResult[`Metric-${index}`]).toBe(expectedValue);
  }
});

test('serializes metrics with more than 100 values each into multiple events', () => {
  // arrange
  const metrics = 128;
  const valuesMultiplier = 3;
  const expectedBatches = Math.max(
    Math.ceil(metrics / Constants.MAX_METRICS_PER_EVENT),
    Math.ceil((metrics * valuesMultiplier) / Constants.MAX_VALUES_PER_METRIC),
  );

  const context = getContext();
  for (let i = 1; i <= metrics; i++) {
    const expectedKey = `Metric-${i}`;
    for (let j = 0; j < i * valuesMultiplier; j++) {
      context.putMetric(expectedKey, j);
    }
  }

  // act
  const results = serializer.serialize(context);

  // assert
  const resultObjs = results.map(resultJson => JSON.parse(resultJson));
  expect(resultObjs.length).toBe(expectedBatches);
  for (const resultObj of resultObjs) {
    expect(resultObj._aws.CloudWatchMetrics[0].Metrics.length).toBeLessThanOrEqual(Constants.MAX_METRICS_PER_EVENT);
  }

  for (let index = 1; index <= metrics; index++) {
    let metricValues: number[] = [];
    for (const resultObj of resultObjs) {
      const metricValue = resultObj[`Metric-${index}`];
      if (metricValue) {
        if (Array.isArray(metricValue)) {
          expect(metricValue.length).toBeLessThanOrEqual(Constants.MAX_VALUES_PER_METRIC);
          metricValues = metricValues.concat(metricValue);
        } else {
          metricValues.push(metricValue);
        }
      }
    }
    expect(metricValues.sort()).toEqual(Array.from({ length: index * valuesMultiplier }, (v, i) => i).sort());
  }
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
