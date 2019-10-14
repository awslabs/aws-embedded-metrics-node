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
import { MetricsContext } from '../logger/MetricsContext';
import { AgentSink } from '../sinks/AgentSink';
import { ISink } from '../sinks/Sink';
import { LOG } from '../utils/Logger';
import { IEnvironment } from './IEnvironment';

export class DefaultEnvironment implements IEnvironment {
  public probe(): boolean {
    return true;
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

  public configureContext(context: MetricsContext): void {
    // no-op
  }

  public createSink(): ISink {
    if (!config.logGroupName) {
      let serviceName = this.getName();
      return new AgentSink(`${serviceName}-metrics`, config.logStreamName);
    }
    return new AgentSink(config.logGroupName, config.logStreamName);
  }
}
