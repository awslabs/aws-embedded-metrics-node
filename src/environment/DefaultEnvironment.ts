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

import config from '../config/Configuration';
import { AgentSink } from '../sinks/AgentSink';
import { ISink } from '../sinks/Sink';
import { LOG } from '../utils/Logger';
import { IEnvironment } from './IEnvironment';

export class DefaultEnvironment implements IEnvironment {
  private sink: ISink | undefined;

  public probe(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public getName(): string {
    if (!config.serviceName) {
      LOG('Unknown ServiceName.');
      return 'Unknown';
    }
    return config.serviceName;
  }

  public getType(): string {
    if (!config.serviceType) {
      LOG('Unknown ServiceType.');
      return 'Unknown';
    }
    return config.serviceType;
  }

  public getLogGroupName(): string {
    // if the caller explicitly overrides logGroupName to 
    // be empty, we should honor that rather than providing 
    // the default behavior.
    if (config.logGroupName === "") {
      return "";
    }
    return config.logGroupName ? config.logGroupName : `${this.getName()}-metrics`;
  }

  public configureContext(): void {
    // no-op
  }

  public getSink(): ISink {
    if (!this.sink) {
      this.sink = new AgentSink(this.getLogGroupName(), config.logStreamName);
    }
    return this.sink;
  }
}
