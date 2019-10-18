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
import url = require('url');
import Configuration from '../config/Configuration';
import { MetricsContext } from '../logger/MetricsContext';
import { LogSerializer } from '../serializers/LogSerializer';
import { ISerializer } from '../serializers/Serializer';
import { LOG } from '../utils/Logger';
import { ISink } from './Sink';

interface IEndpoint {
  host: string;
  port: number;
  protocol: string;
}

const defaultUdpEndpoint = {
  host: '0.0.0.0',
  port: 25888,
  protocol: 'udp:',
};

const parseEndpoint = (endpoint: string | undefined): IEndpoint => {
  try {
    if (!endpoint) {
      return defaultUdpEndpoint;
    }

    const parsedUrl = url.parse(endpoint);
    if (!parsedUrl.hostname || !parsedUrl.port || !parsedUrl.protocol) {
      LOG('Failed to parse the provided agent endpoint', parsedUrl);
      return defaultUdpEndpoint;
    }

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port),
      protocol: parsedUrl.protocol,
    };
  } catch (e) {
    LOG('Failed to parse the provided agent endpoint', e);
    return defaultUdpEndpoint;
  }
};

/**
 * A sink that flushes to the CW Agent
 */
export class AgentSink implements ISink {
  public readonly name: string = 'AgentSink';
  private readonly serializer: ISerializer;
  private readonly endpoint: IEndpoint;
  private readonly logGroupName: string;
  private readonly logStreamName: string | undefined;

  constructor(logGroupName: string, logStreamName?: string, serializer?: ISerializer) {
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
    this.serializer = serializer || new LogSerializer();
    this.endpoint = parseEndpoint(Configuration.agentEndpoint);
  }

  public accept(context: MetricsContext): void {
    context.setProperty('log_group_name', this.logGroupName);

    if (this.logStreamName) {
      context.setProperty('log_stream_name', this.logStreamName);
    }

    if (this.endpoint.protocol !== 'udp:') {
      throw new Error('');
    }
    const message = this.serializer.serialize(context);
    const bytes = Buffer.from(message);
    const client = dgram.createSocket('udp4');
    client.send(bytes, this.endpoint.port, this.endpoint.host, (error: any) => {
      if (error) {
        LOG(error);
      }
      client.close();
    });
  }
}
