import * as faker from 'faker';
import Configuration from '../../config/Configuration';
import { AgentSink } from '../AgentSink';

test('default endpoint is tcp', () => {
  // arrange
  const logGroupName = faker.random.word();

  // act
  const sink = new AgentSink(logGroupName);

  // assert
  // @ts-ignore
  expect(sink.endpoint.protocol).toBe('tcp:');
  // @ts-ignore
  expect(sink.endpoint.host).toBe('0.0.0.0');
  // @ts-ignore
  expect(sink.endpoint.port).toBe(25888);
});

test('can parse udp endpoints', () => {
  // arrange
  Configuration.agentEndpoint = 'udp://127.0.0.1:1000';
  const logGroupName = faker.random.word();

  // act
  const sink = new AgentSink(logGroupName);

  // assert
  // @ts-ignore
  expect(sink.endpoint.protocol).toBe('udp:');
  // @ts-ignore
  expect(sink.endpoint.host).toBe('127.0.0.1');
  // @ts-ignore
  expect(sink.endpoint.port).toBe(1000);
});
