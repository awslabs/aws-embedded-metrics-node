import { faker } from '@faker-js/faker';
import { MetricsContext } from '../../logger/MetricsContext';
import { ConsoleSink } from '../ConsoleSink';

beforeEach(() => {
  console.log = jest.fn();
});

test('accept serializes and writes result to stdout', () => {
  // arrange
  const expected = faker.random.alphaNumeric(20);
  const serializer: any = {
    serialize: jest.fn(() => [expected]),
  };

  const sink = new ConsoleSink(serializer);

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(console.log).toBeCalledWith(expected);
});

test('accept writes multiple messages to stdout', () => {
  // arrange
  const expectedMessages = faker.datatype.number({ min: 2, max: 100 });
  const expected = new Array(expectedMessages).fill(null).map(() => faker.random.alphaNumeric(20));
  const serializer: any = {
    serialize: jest.fn(() => expected),
  };

  const sink = new ConsoleSink(serializer);

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(console.log).toBeCalledTimes(expectedMessages);
  expected.forEach(e => expect(console.log).toBeCalledWith(e));
});
