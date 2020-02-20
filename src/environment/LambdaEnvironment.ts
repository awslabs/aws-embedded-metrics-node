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

import { MetricsContext } from '../logger/MetricsContext';
import { ConsoleSink } from '../sinks/ConsoleSink';
import { ISink } from '../sinks/Sink';
import { IEnvironment } from './IEnvironment';

export class LambdaEnvironment implements IEnvironment {
  private sink: ISink | undefined;

  public probe(): Promise<boolean> {
    return Promise.resolve(process.env.AWS_LAMBDA_FUNCTION_NAME ? true : false);
  }

  public getName(): string {
    return process.env.AWS_LAMBDA_FUNCTION_NAME || 'Unknown';
  }

  public getType(): string {
    return 'AWS::Lambda::Function';
  }

  public getLogGroupName(): string {
    return this.getName();
  }

  public configureContext(context: MetricsContext): void {
    this.addProperty(context, 'executionEnvironment', process.env.AWS_EXECUTION_ENV);
    this.addProperty(context, 'memorySize', process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE);
    this.addProperty(context, 'functionVersion', process.env.AWS_LAMBDA_FUNCTION_VERSION);
    this.addProperty(context, 'logStreamId', process.env.AWS_LAMBDA_LOG_STREAM_NAME);

    const trace = this.getSampledTrace();
    if (trace) {
      this.addProperty(context, 'traceId', trace);
    }
  }

  public getSink(): ISink {
    if (!this.sink) {
      this.sink = new ConsoleSink();
    }
    return this.sink;
  }

  private addProperty(context: MetricsContext, key: string, value: string | undefined): void {
    if (value) {
      context.setProperty(key, value);
    }
  }

  private getSampledTrace(): string | void {
    // only collect traces which have been sampled
    if (process.env._X_AMZN_TRACE_ID && process.env._X_AMZN_TRACE_ID.includes('Sampled=1')) {
      return process.env._X_AMZN_TRACE_ID;
    }
  }
}
