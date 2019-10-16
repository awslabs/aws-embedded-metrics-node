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
import { fetch } from '../utils/Fetch';
import { LOG } from '../utils/Logger';
import { IEnvironment } from './IEnvironment';

const endpoint = 'http://169.254.169.254/latest/dynamic/instance-identity/document';

interface IEC2MetadataResponse {
  imageId: string;
  availabilityZone: string;
  privateIp: string;
  instanceId: string;
  instanceType: string;
}

export class EC2Environment implements IEnvironment {
  private metadata: IEC2MetadataResponse | undefined;
  private sink: ISink | undefined;

  public async probe(): Promise<boolean> {
    try {
      this.metadata = await fetch<IEC2MetadataResponse>(endpoint);
      if (this.metadata) {
        return true;
      }
      return false;
    } catch (e) {
      LOG(e);
      return false;
    }
  }

  public getName(): string {
    if (!config.serviceName) {
      LOG('Unknown ServiceName.');
      return 'Unknown';
    }
    return config.serviceName;
  }

  public getType(): string {
    if (this.metadata) {
      return 'AWS::EC2::Instance';
    }

    // this will only happen if probe() is not called first
    return 'Unknown';
  }

  public getLogGroupName(): string {
    return config.logGroupName ? config.logGroupName : `${this.getName()}-metrics`;
  }

  public configureContext(context: MetricsContext): void {
    if (this.metadata) {
      context.setProperty('imageId', this.metadata.imageId);
      context.setProperty('instanceId', this.metadata.instanceId);
      context.setProperty('instanceType', this.metadata.instanceType);
      context.setProperty('privateIP', this.metadata.privateIp);
      context.setProperty('availabilityZone', this.metadata.availabilityZone);
    }
  }

  public getSink(): ISink {
    if (!this.sink) {
      this.sink = new AgentSink(this.getLogGroupName(), config.logStreamName);
    }
    return this.sink;
  }
}
