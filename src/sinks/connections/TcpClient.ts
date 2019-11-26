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

export class TcpClient implements ISocketClient {
  private endpoint: IEndpoint;
  private socket: net.Socket;

  constructor(endpoint: IEndpoint) {
    this.endpoint = endpoint;
    this.socket = new net.Socket({ allowHalfOpen: true })
      .setEncoding('utf8')
      .setKeepAlive(true)
      .setTimeout(5000) // idle timeout
      .on('timeout', () => this.disconnect('idle timeout'))
      .on('end', () => this.disconnect('end'))
      .on('data', data => LOG('TcpClient received data.', data));
  }

  // create the connection as soon as we can, but don't block
  // we can block on flush if we have to.
  public async warmup() {
    try {
      await this.establishConnection();
    } catch (err) {
      LOG('Failed to connect', err)
    }
  }

  public async sendMessage(message: Buffer): Promise<void> {
    await this.waitForOpenConnection();
    await new Promise((resolve, reject) => {
      const onSendError = (err: Error) => {
        LOG('Failed to write', err);
        LOG('Socket', this.socket);
        reject(err);
      }
      const wasFlushedToKernel = this.socket
      .once('error', onSendError)
      .write(message, (err?: Error) => {
        if (!err) {
          LOG('Write succeeded');
          resolve();
        } else {
          onSendError(err)
        }
      });

      if (!wasFlushedToKernel) {
        LOG('TcpClient data was not flushed to kernel buffer and was queued in memory.');
      }
    });
  }

  private disconnect(eventName: string) {
    LOG('TcpClient disconnected due to:', eventName);
    this.socket.destroy();
    this.socket.unref();
  }

  private async waitForOpenConnection() {
    if (!this.socket.writable) {
      await this.establishConnection();
    }
  }

  private async establishConnection(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.socket
        .connect(this.endpoint.port, this.endpoint.host, () => {
          LOG('TcpClient connected.', this.endpoint);
          resolve();
        })
        .once('error', (e) => {
          this.disconnect('error');
          this.socket.removeListener('connection', resolve);
          reject(e);
        });
    });
  }
}
