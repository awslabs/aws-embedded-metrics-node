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

import { MetricsContext } from '../../src/logger/MetricsContext';
import { ISink } from '../../src/sinks/Sink';

/**
 * A sink that flushes log data to stdout.
 * This is the preferred sink for Lambda functions.
 */
export class TestSink implements ISink {
  public readonly name: string = 'TestSink';

  public events: MetricsContext[] = [];

  public forceAcceptRejects: boolean;

  constructor(forceAcceptRejects: boolean) {
    this.forceAcceptRejects = forceAcceptRejects;
  }

  public accept(context: MetricsContext): Promise<void> {
    this.events.push(context);
    return this.forceAcceptRejects ? Promise.reject(): Promise.resolve();
  }
}
