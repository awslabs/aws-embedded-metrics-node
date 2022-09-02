import { faker } from '@faker-js/faker';
import { TcpClient } from '../connections/TcpClient';
import sleep from '../../../test/utils/Sleep';
import net = require('net');

test('handles tcp client errors', async () => {
  // arrange
  const client = new TcpClient({
    host: '0.0.0.0',
    port: 65535,
    protocol: 'tcp',
  });

  // assert
  return expect(client.sendMessage(Buffer.from([]))).rejects.toThrowError(/ECONNREFUSED/);
});

test('handles server disconnect', async () => {
  // arrange
  const port = 9999;
  const successSends = faker.datatype.number({ min: 1, max: 100 });
  const failedSends = faker.datatype.number({ min: 1, max: 100 });
  const successSendsReconnect = faker.datatype.number({ min: 1, max: 100 });

  let receivedMessages = 0;
  const server = net.createServer(socket => socket.on('data', () => receivedMessages++)).listen(port, '0.0.0.0');

  const client = new TcpClient({ host: '0.0.0.0', port: port, protocol: 'tcp' });
  const killServer = async () => {
    await new Promise(resolve => server.close(resolve));
    server.unref();
  };

  let failedCount = 0;
  const sendMessages = async (count: number) => {
    for (let index = 0; index < count; index++) {
      try {
        await client.sendMessage(Buffer.from('test\n'));
        // allow kernel + server time to get request
        await sleep(20);
      } catch (_) {
        failedCount++;
      }
    }
  };

  // act
  await sendMessages(successSends);
  await killServer();
  await sendMessages(failedSends);
  server.listen(port, '0.0.0.0');
  await sendMessages(successSendsReconnect);

  // assert
  expect(failedCount).toBe(failedSends);
  expect(receivedMessages).toBe(successSends + successSendsReconnect);

  // cleanup
  // @ts-ignore
  client.disconnect('cleanup');
  await killServer();
}, 10000);

test('does not leak event listeners on failed sends', async () => {
  // arrange
  const runCount = 100;
  const client = new TcpClient({
    host: '0.0.0.0',
    port: 65535,
    protocol: 'tcp',
  });

  // act
  let failedCount = 0;
  for (let index = 0; index < runCount; index++) {
    try {
      await client.sendMessage(Buffer.from([]));
    } catch (_) {
      failedCount++;
    }
  }

  // assert
  expect(failedCount).toBe(runCount);

  // @ts-ignore
  const socket = client.socket;

  expect(socket.listeners('error').length).toBe(0);
  expect(socket.listeners('connect').length).toBe(1);
  expect(socket.listeners('timeout').length).toBe(0);
});

test('does not leak event listeners on successful sends', async () => {
  // arrange
  const port = 9999;
  const server = net.createServer(socket => socket.pipe(socket)).listen(port, '0.0.0.0');
  const client = new TcpClient({
    host: '0.0.0.0',
    port: port,
    protocol: 'tcp',
  });

  // act
  for (let index = 0; index < 100; index++) {
    await client.sendMessage(Buffer.from([]));
  }

  server.close();
  server.unref();

  // assert
  // @ts-ignore
  const socket = client.socket;

  expect(socket.listeners('error').length).toBe(0);
  expect(socket.listeners('connect').length).toBe(0);
  expect(socket.listeners('timeout').length).toBe(1);
});
