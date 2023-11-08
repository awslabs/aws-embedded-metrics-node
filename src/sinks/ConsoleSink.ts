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

import { Console } from 'console';
import { MetricsContext } from '../logger/MetricsContext';
import { LogSerializer } from '../serializers/LogSerializer';
import { ISerializer } from '../serializers/Serializer';
import { ISink } from './Sink';

/**
 * A sink that flushes log data to stdout.
 * This is the preferred sink for Lambda functions.
 */
export class ConsoleSink implements ISink {
  public readonly name: string = 'ConsoleSink';

  private serializer: ISerializer;
  public readonly console: Console;
  private static readonly AWS_LAMBDA_LOG_FORMAT = 'AWS_LAMBDA_LOG_FORMAT';

  constructor(serializer?: ISerializer) {
    this.serializer = serializer || new LogSerializer();
    this.console =
      process.env[ConsoleSink.AWS_LAMBDA_LOG_FORMAT] === 'JSON' ? new Console(process.stdout, process.stderr) : console;
  }

  public accept(context: MetricsContext): Promise<void> {
    // tslint:disable-next-line
    const events = this.serializer.serialize(context);
    events.forEach((event) => this.console.log(event));
    return Promise.resolve();
  }
}
