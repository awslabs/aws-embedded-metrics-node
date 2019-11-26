import * as faker from 'faker'
import { TcpClient } from '../connections/TcpClient';

test('handles tcp client errors', async () => {
  // arrange
  const noProcessPort = faker.random.number({min: 1000, max: 9999})
  const client = new TcpClient({
    host: '0.0.0.0',
    port: noProcessPort,
    protocol: 'tcp'
  })

  // assert
  return expect(
    client.sendMessage(Buffer.from([]))
  ).rejects.toThrowError(/ECONNREFUSED/)
});
