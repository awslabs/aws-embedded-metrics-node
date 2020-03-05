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

import url = require('url');

import Configuration from '../config/Configuration';
import { MetricsContext } from '../logger/MetricsContext';
import { LogSerializer } from '../serializers/LogSerializer';
import { ISerializer } from '../serializers/Serializer';
import { LOG } from '../utils/Logger';
import { IEndpoint } from './connections/IEndpoint';
import { ISocketClient } from './connections/ISocketClient';
import { TcpClient } from './connections/TcpClient';
import { UdpClient } from './connections/UdpClient';
import { ISink } from './Sink';

const TCP = 'tcp:';
const UDP = 'udp:';

const defaultTcpEndpoint = {
  host: '0.0.0.0',
  port: 25888,
  protocol: TCP,
};

const parseEndpoint = (endpoint: string | undefined): IEndpoint => {
  try {
    if (!endpoint) {
      return defaultTcpEndpoint;
    }

    const parsedUrl = url.parse(endpoint);
    if (!parsedUrl.hostname || !parsedUrl.port || !parsedUrl.protocol) {
      LOG(`Failed to parse the provided agent endpoint. Falling back to the default TCP endpoint.`, parsedUrl);
      return defaultTcpEndpoint;
    }

    if (parsedUrl.protocol !== TCP && parsedUrl.protocol !== UDP) {
      LOG(
        `The provided agent endpoint protocol '${parsedUrl.protocol}' is not supported. Please use TCP or UDP. Falling back to the default TCP endpoint.`,
        parsedUrl,
      );
      return defaultTcpEndpoint;
    }

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port),
      protocol: parsedUrl.protocol,
    };
  } catch (e) {
    LOG('Failed to parse the provided agent endpoint', e);
    return defaultTcpEndpoint;
  }
};

/**
 * A sink that flushes to the CW Agent.
 * This sink instance should be re-used to avoid
 * leaking connections.
 */
export class AgentSink implements ISink {
  public readonly name: string = 'AgentSink';
  private readonly serializer: ISerializer;
  private readonly endpoint: IEndpoint;
  private readonly logGroupName: string;
  private readonly logStreamName: string | undefined;
  private readonly socketClient: ISocketClient;

  constructor(logGroupName: string, logStreamName?: string, serializer?: ISerializer) {
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
    this.serializer = serializer || new LogSerializer();
    this.endpoint = parseEndpoint(Configuration.agentEndpoint);
    this.socketClient = this.getSocketClient(this.endpoint);
    LOG('Using socket client', this.socketClient.constructor.name);
  }

  public async accept(context: MetricsContext): Promise<void> {
    if (this.logGroupName) {
      context.meta.LogGroupName = this.logGroupName;
    }
   
    if (this.logStreamName) {
      context.meta.LogStreamName = this.logStreamName;
    }

    const message = this.serializer.serialize(context) + '\n';
    const bytes = Buffer.from(message);

    await this.socketClient.sendMessage(bytes);
  }

  private getSocketClient(endpoint: IEndpoint): ISocketClient {
    LOG('Getting socket client for connection.', endpoint);
    const client = endpoint.protocol === TCP ? new TcpClient(endpoint) : new UdpClient(endpoint);
    client.warmup();
    return client;
  }
}
