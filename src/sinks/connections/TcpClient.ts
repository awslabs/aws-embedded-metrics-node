/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates.
 * Licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import net = require('net');
import { LOG } from '../../utils/Logger';
import { IEndpoint } from './IEndpoint';
import { ISocketClient } from './ISocketClient';

interface SocketExtended extends net.Socket {
  writeable: boolean;
  readyState: string;
}

export class TcpClient implements ISocketClient {
  private endpoint: IEndpoint;
  private socket: SocketExtended;

  constructor(endpoint: IEndpoint) {
    this.endpoint = endpoint;
    this.socket = new net.Socket({ allowHalfOpen: true, writable: false })
      .setEncoding('utf8')
      .setKeepAlive(true)
      .setTimeout(5000) // idle timeout
      .on('timeout', () => this.disconnect('idle timeout'))
      .on('end', () => this.disconnect('end'))
      .on('data', data => LOG('TcpClient received data.', data)) as SocketExtended;
  }

  public async warmup(): Promise<void> {
    try {
      await this.establishConnection();
    } catch (err) {
      LOG('Failed to connect', err);
    }
  }

  public async sendMessage(message: Buffer): Promise<void> {
    // ensure the socket is open and writable
    await this.waitForOpenConnection();

    await new Promise((resolve, reject) => {
      const onSendError = (err: Error): void => {
        LOG('Failed to write', err);
        reject(err);
      };

      const wasFlushedToKernel = this.socket.write(message, (err?: Error) => {
        if (!err) {
          LOG('Write succeeded');
          resolve();
        } else {
          onSendError(err);
        }
      });

      if (!wasFlushedToKernel) {
        LOG('TcpClient data was not flushed to kernel buffer and was queued in memory.');
      }
    });
  }

  private disconnect(eventName: string): void {
    LOG('TcpClient disconnected due to:', eventName);
    this.socket.removeAllListeners();
    this.socket.destroy();
    this.socket.unref();
  }

  private async waitForOpenConnection(): Promise<void> {
    if (!this.socket.writeable || this.socket.readyState !== 'open') {
      await this.establishConnection();
    }
  }

  private async establishConnection(): Promise<void> {
    await new Promise((resolve, reject) => {
      const onError = (e: Error): void => {
        // socket is already open, no need to connect
        if (e.message.includes('EISCONN')) {
          resolve();
          return;
        }
        LOG('TCP Client received error', e);
        this.disconnect(e.message);
        reject(e);
      };

      const onConnect = (): void => {
        this.socket.removeListener('error', onError);
        LOG('TcpClient connected.', this.endpoint);
        resolve();
      };

      // TODO: convert this to a proper state machine
      switch (this.socket.readyState) {
        case 'open':
          resolve();
          break;
        case 'opening':
          // the socket is currently opening, we will resolve
          // or fail the current promise on the connect or
          // error events
          this.socket.once('connect', onConnect);
          this.socket.once('error', onError);
          break;
        default:
          LOG('opening connection with socket in state: ', this.socket.readyState);
          this.socket.connect(this.endpoint.port, this.endpoint.host, onConnect).once('error', onError);
          break;
      }
    });
  }
}
