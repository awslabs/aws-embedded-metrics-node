import * as faker from 'faker';
import { MetricsContext } from '../../logger/MetricsContext';
import { LambdaSink } from '../LambdaSink';

beforeEach(() => {
  console.log = jest.fn();
});

test('accept serializes and writes result to stdout', () => {
  // arrange
  const expected = faker.random.alphaNumeric(20);
  const serializer: any = {
    serialize: jest.fn(_ => expected),
  };

  const sink = new LambdaSink(serializer);

  // act
  sink.accept(MetricsContext.empty());

  // assert
  expect(console.log).toBeCalledWith(expected);
});
