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

import CloudWatchLogs = require('aws-sdk/clients/cloudwatchlogs');
import { MetricsContext } from '../logger/MetricsContext';
import { LogSerializer } from '../serializers/LogSerializer';
import { ISerializer } from '../serializers/Serializer';
import { ISink } from './Sink';
const client = new CloudWatchLogs();

/**
 * A sink that flushes log data to PutLogEvents synchronously.
 */
export class SynchronousSink implements ISink {
  private static sequenceToken: string | null = null;

  public readonly name: string = 'SynchronousSink';
  private serializer: ISerializer;
  private logGroupName: string;
  private logStreamName: string;

  constructor(logGroupName: string, logStreamName: string, serializer?: ISerializer) {
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
    this.serializer = serializer || new LogSerializer();
  }

  public accept(context: MetricsContext): void {
    const message = this.serializer.serialize(context);
    this.putLogEvents({
      logEvents: [
        {
          message,
          timestamp: new Date().getTime(),
        },
      ],
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      sequenceToken: SynchronousSink.sequenceToken,
    });
  }

  private putLogEvents = async (body: any) => {
    const request = client.putLogEvents(body);
    request.httpRequest.headers['x-amzn-logs-format'] = 'Structured';

    try {
      await request.promise();
    } catch (e) {
      if (e) {
        if (e.code === 'DataAlreadyAcceptedException' || e.code === 'InvalidSequenceTokenException') {
          SynchronousSink.sequenceToken = e.message.split(' ').reduceRight((_: any) => _);
          body.sequenceToken = SynchronousSink.sequenceToken;
          await this.putLogEvents(body);
        } else {
          // tslint:disable-next-line
          console.error(e);
        }
      }
    }
  };
}
