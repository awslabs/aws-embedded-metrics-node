import * as faker from 'faker';
import { MetricsContext } from '../../logger/MetricsContext';
import { ConsoleSink } from '../ConsoleSink';

beforeEach(() => {
  console.log = jest.fn();
});

test('accept serializes and writes result to stdout', () => {
  // arrange
  const expected = faker.random.alphaNumeric(20);
  const serializer: any = {
    serialize: jest.fn(() => expected),
  };

  const sink = new ConsoleSink(serializer);

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(console.log).toBeCalledWith(expected);
});
