import { faker } from '@faker-js/faker';
import { MetricsContext } from '../MetricsContext';
import { DimensionSetExceededError } from '../../exceptions/DimensionSetExceededError';
import { InvalidDimensionError } from '../../exceptions/InvalidDimensionError';
import { InvalidMetricError } from '../../exceptions/InvalidMetricError';
import { Unit } from '../Unit';
import { Constants } from '../../Constants';
import { InvalidNamespaceError } from '../../exceptions/InvalidNamespaceError';
import { InvalidTimestampError } from '../../exceptions/InvalidTimestampError';
import { StorageResolution } from '../StorageResolution';

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
  const numOfDimensions = 30;
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

test('putMetric adds standard resolution metric to metrics key', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.datatype.number();
  const expectedUnit = faker.helpers.arrayElement(Object.values(Unit));

  // act
  context.putMetric(expectedKey, expectedValue, expectedUnit);

  // assert
  const metricDatum: any = context.metrics.get(expectedKey);
  expect(metricDatum).toBeTruthy();
  expect(metricDatum.values).toStrictEqual([expectedValue]);
  expect(metricDatum.unit).toBe(expectedUnit);
});

test('putMetric adds high resolution metric to metrics key', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.datatype.number();
  const expectedUnit = faker.helpers.arrayElement(Object.values(Unit));
  const expectedStorageResolution = StorageResolution.High;

  // act
  context.putMetric(expectedKey, expectedValue, expectedUnit, expectedStorageResolution);

  // assert
  const metricDatum: any = context.metrics.get(expectedKey);
  expect(metricDatum).toBeTruthy();
  expect(metricDatum.values).toStrictEqual([expectedValue]);
  expect(metricDatum.unit).toBe(expectedUnit);
  expect(metricDatum.storageResolution).toBe(expectedStorageResolution);
});

test('putMetric uses None unit if not provided', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.datatype.number();
  const expectedUnit = 'None';

  // act
  context.putMetric(expectedKey, expectedValue);

  // assert
  const metricDatum: any = context.metrics.get(expectedKey);
  expect(metricDatum).toBeTruthy();
  expect(metricDatum.values).toStrictEqual([expectedValue]);
  expect(metricDatum.unit).toBe(expectedUnit);
});

test('putMetric uses Standard storageResolution if not provided', () => {
  // arrange
  const context = MetricsContext.empty();
  const expectedKey = faker.random.word();
  const expectedValue = faker.datatype.number();
  const expectedStorageResolution = 60;

  // act
  context.putMetric(expectedKey, expectedValue);

  // assert
  const metricDatum: any = context.metrics.get(expectedKey);
  expect(metricDatum).toBeTruthy();
  expect(metricDatum.values).toStrictEqual([expectedValue]);
  expect(metricDatum.storageResolution).toBe(expectedStorageResolution);
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
  const numOfDimensions = 33;

  expect(() => {
    context.putDimensions(getDimensionSet(numOfDimensions));
  }).toThrow(DimensionSetExceededError);
});

test('setDimensions checks all the dimension sets have less than 30 dimensions', () => {
  // arrange
  const context = MetricsContext.empty();
  const numOfDimensions = 33;

  expect(() => {
    context.setDimensions([getDimensionSet(numOfDimensions)]);
  }).toThrow(DimensionSetExceededError);
});

test.each([
  [{ '🚀': faker.random.word() }],
  [{ d1: 'مارك' }],
  [{ ['a'.repeat(251)]: faker.random.word() }],
  [{ d1: 'a'.repeat(1025) }],
  [{ d1: 'a'.repeat(1025) }],
  [{ ['']: faker.random.word() }],
  [{ d1: '' }],
  [{ ':d1': faker.random.word() }],
])('putDimensions/setDimensions with invalid dimension %s throws error', (dimensionSet) => {
  // arrange
  const context = MetricsContext.empty();

  // act
  expect(() => {
    context.putDimensions(dimensionSet);
  }).toThrow(InvalidDimensionError);
  expect(() => {
    context.setDimensions([dimensionSet]);
  }).toThrow(InvalidDimensionError);
});

test.each([
  [{ [faker.random.word()]: faker.random.word() }],
  [{ d: faker.random.word() }],
  [{ [faker.random.word()]: 'a' }],
  [{ ['dimension:1']: 'a'.repeat(1024) }],
])('putDimensions/setDimensions with valid dimension %s does not throw error', (dimensionSet) => {
  // arrange
  const context = MetricsContext.empty();

  // act
  expect(() => {
    context.putDimensions(dimensionSet);
  }).not.toThrow(InvalidDimensionError);
  expect(() => {
    context.setDimensions([dimensionSet]);
  }).not.toThrow(InvalidDimensionError);
});

test.each([
  ['', faker.datatype.number(), faker.helpers.arrayElement(Object.values(Unit))],
  ['a'.repeat(Constants.MAX_METRIC_NAME_LENGTH + 1), faker.datatype.number(), 'None'],
  [faker.random.word(), Number.MAX_VALUE, undefined],
  [faker.random.word(), -Number.MAX_VALUE, undefined],
  [faker.random.word(), Number.MAX_SAFE_INTEGER + 1, undefined],
  [faker.random.word(), -Number.MAX_SAFE_INTEGER - 1, undefined],
  [faker.random.word(), parseFloat('not a number'), undefined],
  [faker.random.word(), Infinity, faker.helpers.arrayElement(Object.values(Unit))],
  [faker.random.word(), -Infinity, faker.helpers.arrayElement(Object.values(Unit))],
  [faker.random.word(), faker.datatype.number(), 'Fahrenheit'],
  [faker.random.word(), 4, ''],
  [faker.random.word(), NaN, faker.helpers.arrayElement(Object.values(Unit))],
])('putMetric with name: %s, value: %d and unit: %s throws error', (metricName, metricValue, metricUnit) => {
  // arrange
  const context = MetricsContext.empty();

  // act
  expect(() => {
    context.putMetric(metricName, metricValue, metricUnit);
  }).toThrow(InvalidMetricError);
});

test.each([
  [faker.random.word(), faker.datatype.number({ min: -1e3, max: -1 }), undefined],
  [faker.random.word(), faker.datatype.number(), faker.helpers.arrayElement(Object.values(Unit))],
  [faker.random.words(2), faker.datatype.number(), undefined],
  [faker.random.words(3), faker.datatype.number(), Unit.Seconds],
  ['Max_Value', Number.MAX_SAFE_INTEGER, Unit.Milliseconds],
  ['-Max_Value', -Number.MAX_SAFE_INTEGER, 'Bytes/Second'],
])('putMetric with name: %s, value: %d and unit: %s does not throw error', (metricName, metricValue, metricUnit) => {
  // arrange
  const context = MetricsContext.empty();

  // act
  expect(() => {
    context.putMetric(metricName, metricValue, metricUnit);
  }).not.toThrow(InvalidMetricError);
});

test('put metric with same key and different resolution in single flush throws error', () => {
  //arrange
  const context = MetricsContext.empty();
  const expectedKey = 'MetricName';
  const expectedValue = faker.datatype.number();
  const expectedUnit = 'None';

  // act
  expect(() => {
    context.putMetric(expectedKey, expectedValue, expectedUnit, StorageResolution.High);
    context.putMetric(expectedKey, expectedValue, expectedUnit, StorageResolution.Standard);
  }).toThrow(InvalidMetricError);
});

test.each([[''], [' '], ['a'.repeat(Constants.MAX_NAMESPACE_LENGTH + 1)], ['àẁş/ćļốṹḓⱳầƭḉⱨ'], ['namespace ']])(
  'setNamespace with invalid namespace: %s throws error',
  (namespace) => {
    // arrange
    const context = MetricsContext.empty();

    // act
    expect(() => {
      context.setNamespace(namespace);
    }).toThrow(InvalidNamespaceError);
  },
);

test('setNamespace with valid namespace does not throw error', () => {
  // arrange
  const context = MetricsContext.empty();
  const namespace = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-_/#:';

  // act
  expect(() => {
    context.setNamespace(namespace);
  }).not.toThrow(InvalidNamespaceError);
});

test.each([
  [NaN],
  [12345],
  [912884400], // Dec 5, 1998
  [32532951600], // Dec 5, 3000
  [Infinity],
  [-Infinity],
  [new Date('Yesterday')],
  [Date.now() - Constants.MAX_TIMESTAMP_PAST_AGE - 1000],
  [Date.now() + Constants.MAX_TIMESTAMP_FUTURE_AGE + 1000],
])('setTimestamp with invalid timestamp: %s throws error', (timestamp) => {
  // arrange
  const context = MetricsContext.empty();

  // act
  expect(() => {
    context.setTimestamp(timestamp);
  }).toThrow(InvalidTimestampError);
});

const getDimensionSet = (numOfDimensions: number) => {
  const dimensionSet: Record<string, string> = {};

  for (let i = 0; i < numOfDimensions; i++) {
    const expectedKey = `${i}`;
    dimensionSet[expectedKey] = faker.random.word();
  }

  return dimensionSet;
};
