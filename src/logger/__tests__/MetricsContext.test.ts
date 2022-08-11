import * as faker from 'faker';
import { MetricsContext } from '../MetricsContext';
import { DimensionSetExceededError } from '../../exceptions/DimensionSetExceededError';

test('can set property', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.word();

  // act
  context.setProperty(expectedKey, expectedValue);

  // assert
  const actualValue = context.properties[expectedKey];
  expect(actualValue).toBeTruthy();
  expect(actualValue).toBe(expectedValue);
});

test('setDimensions allows 30 dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  const numOfDimensions = 30
  const expectedDimensionSet = getDimensionSet(numOfDimensions);

  // act
  context.setDimensions([expectedDimensionSet]);

  // assert
  expect(context.getDimensions()[0]).toStrictEqual(expectedDimensionSet);
});

test('putDimension adds key to dimension and sets the dimension as a property', () => {

  // arrange
  const context = MetricsContext.empty();
  const dimension = faker.random.word();
  const expectedDimension = { dimension };

  // act
  context.putDimensions(expectedDimension);

  // assert
  expect(context.getDimensions()[0]).toStrictEqual(expectedDimension);
});

test('putDimensions accepts multiple unique dimension sets', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedDimension1 = { d1: faker.random.word(), d2: faker.random.word() };
  const expectedDimension2 = { d2: faker.random.word(), d3: faker.random.word() };

  // act
  context.putDimensions(expectedDimension1);
  context.putDimensions(expectedDimension2);

  // assert
  expect(context.getDimensions().length).toBe(2);
  expect(context.getDimensions()[0]).toStrictEqual(expectedDimension1);
  expect(context.getDimensions()[1]).toStrictEqual(expectedDimension2);
});

test('putDimensions will not duplicate dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  const dimension1 = faker.random.word();
  const dimension2 = faker.random.word();
  const expectedDimension1 = {};
  const expectedDimension2 = { dimension1 };
  const expectedDimension3 = { dimension2, dimension1 };
  const expectedDimension4 = { dimension2 };

  // act
  context.putDimensions({});
  context.putDimensions({ dimension1 });
  context.putDimensions({ dimension1, dimension2 });
  context.putDimensions({ dimension2, dimension1 });
  context.putDimensions({ dimension2 });
  context.putDimensions({});
  context.putDimensions({ dimension1 });
  context.putDimensions({ dimension1, dimension2 });
  context.putDimensions({ dimension2, dimension1 });
  context.putDimensions({ dimension2 });

  // assert
  expect(context.getDimensions().length).toBe(4);
  expect(context.getDimensions()[0]).toStrictEqual(expectedDimension1);
  expect(context.getDimensions()[1]).toStrictEqual(expectedDimension2);
  expect(context.getDimensions()[2]).toStrictEqual(expectedDimension3);
  expect(context.getDimensions()[3]).toStrictEqual(expectedDimension4);
});

test('putDimensions will sort dimensions correctly', () => {
  // arrange
  const context = MetricsContext.empty();
  const dimension1 = faker.random.word();
  const dimension2 = faker.random.word();
  const expectedDimension1 = { dimension2, dimension1 };
  const expectedDimension2 = { dimension2 };
  const expectedDimension3 = { dimension1 };
  const expectedDimension4 = {};

  // act
  context.putDimensions({});
  context.putDimensions({ dimension1 });
  context.putDimensions({ dimension1, dimension2 });
  context.putDimensions({ dimension2, dimension1 });
  context.putDimensions({ dimension2 });
  context.putDimensions({ dimension1, dimension2 });
  context.putDimensions({ dimension2, dimension1 });
  context.putDimensions({ dimension2 });
  context.putDimensions({ dimension1 });
  context.putDimensions({});

  // assert
  expect(context.getDimensions().length).toBe(4);
  expect(context.getDimensions()[0]).toStrictEqual(expectedDimension1);
  expect(context.getDimensions()[1]).toStrictEqual(expectedDimension2);
  expect(context.getDimensions()[2]).toStrictEqual(expectedDimension3);
  expect(context.getDimensions()[3]).toStrictEqual(expectedDimension4);
});

test('getDimensions returns default dimensions if custom dimensions not set', () => {
  // arrange
  const context = MetricsContext.empty();
  const defaultDimension = faker.random.word();
  const expectedDimension = { defaultDimension };
  context.setDefaultDimensions(expectedDimension);

  // act
  const dimensions = context.getDimensions();

  // assert
  expect(dimensions[0]).toStrictEqual(expectedDimension);
});

test('getDimensions custom dimensions plus default dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  const defaultDimension = faker.random.word();
  const customDimension = faker.random.word();
  const expectedDimensions = { defaultDimension, customDimension };

  // act
  context.setDefaultDimensions({ defaultDimension });
  context.putDimensions({ customDimension });
  const dimensions = context.getDimensions();

  // assert
  expect(dimensions[0]).toStrictEqual(expectedDimensions);
});

test('getDimensions returns only custom dimensions if no default dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  const customDimension = faker.random.word();
  const expectedDimensions = { customDimension };

  // act
  context.putDimensions({ customDimension });
  const dimensions = context.getDimensions();

  // assert
  expect(dimensions[0]).toStrictEqual(expectedDimensions);
});

test('putMetric adds metric to metrics key', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();
  const expectedUnit = faker.random.word();

  // act
  context.putMetric(expectedKey, expectedValue, expectedUnit);

  // assert
  const metricDatum: any = context.metrics.get(expectedKey);
  expect(metricDatum).toBeTruthy();
  expect(metricDatum.values).toStrictEqual([expectedValue]);
  expect(metricDatum.unit).toBe(expectedUnit);
});

test('putMetric uses None unit if not provided', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.random.number();
  const expectedUnit = 'None';

  // act
  context.putMetric(expectedKey, expectedValue);

  // assert
  const metricDatum: any = context.metrics.get(expectedKey);
  expect(metricDatum).toBeTruthy();
  expect(metricDatum.values).toStrictEqual([expectedValue]);
  expect(metricDatum.unit).toBe(expectedUnit);
});

test('createCopyWithContext creates new instance', () => {
  // arrange
  const context = MetricsContext.empty();

  // act
  const newContext = context.createCopyWithContext();

  // assert
  expect(newContext).not.toBe(context);
});

test('createCopyWithContext creates new instance', () => {
  // arrange
  const context = MetricsContext.empty();

  // act
  const newContext = context.createCopyWithContext();

  // assert
  expect(newContext).not.toBe(context);
});

test('createCopyWithContext copies properties and dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  context.putDimensions({ Key: 'Value' });
  context.setProperty('Prop', 'Value');

  // act
  const newContext = context.createCopyWithContext();

  // assert
  expect(newContext).not.toBe(context);
  expect(newContext).toStrictEqual(context);
});

test('createCopyWithContext copies shouldUseDefaultDimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  context.setDimensions([]);
  context.setDefaultDimensions({ Key: 'Value' });

  // act
  const newContext = context.createCopyWithContext();

  // assert
  expect(newContext).not.toBe(context);
  expect(newContext.getDimensions()).toEqual([]);
});

test('putDimensions checks the dimension set length', () => {
  // arrange
  const context = MetricsContext.empty();
  const numOfDimensions = 33

  expect(() => {
    context.putDimensions(getDimensionSet(numOfDimensions))
  }).toThrow(DimensionSetExceededError);
});

test('setDimensions checks all the dimension sets have less than 30 dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  const numOfDimensions = 33

  expect(() => {
    context.setDimensions([getDimensionSet(numOfDimensions)])
  }).toThrow(DimensionSetExceededError);
});

const getDimensionSet = (numOfDimensions: number) => {
  const dimensionSet:Record<string, string> = {}

  for (let i = 0; i < numOfDimensions; i++) {
    const expectedKey = `${i}`;
    dimensionSet[expectedKey] = faker.random.word();
  }

  return dimensionSet;
}
