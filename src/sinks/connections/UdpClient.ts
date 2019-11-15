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

import dgram = require('dgram');
import { LOG } from '../../utils/Logger';
import { IEndpoint } from './IEndpoint';
import { ISocketClient } from './ISocketClient';

export class UdpClient implements ISocketClient {
  private endpoint: IEndpoint;

  constructor(endpoint: IEndpoint) {
    this.endpoint = endpoint;
  }

  public sendMessage(message: Buffer): Promise<void> {
    const client = dgram.createSocket('udp4');
    client.send(message, this.endpoint.port, this.endpoint.host, (error: any) => {
      if (error) {
        LOG(error);
      }
      client.close();
    });

    return Promise.resolve();
  }
}
