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
import { IEnvironment } from './IEnvironment';
import { fetchJSON } from '../utils/Fetch';
import { LOG } from '../utils/Logger';
import * as os from 'os';
import { Constants } from '../Constants';

interface IECSMetadataResponse {
  Name: string;
  DockerId: string;
  DockerName: string;
  Image: string;
  FormattedImageName: string;
  ImageID: string;
  Ports: string;
  Labels: IECSMetadataLabels;
  CreatedAt: string;
  StartedAt: string;
  Networks: IECSMetadataNetworks[];
}

interface IECSMetadataLabels {
  'com.amazonaws.ecs.cluster': string;
  'com.amazonaws.ecs.container-name': string;
  'com.amazonaws.ecs.task-arn': string;
  'com.amazonaws.ecs.task-definition-family': string;
  'com.amazonaws.ecs.task-definition-version': string;
}

interface IECSMetadataNetworks {
  NetworkMode: string;
  IPv4Addresses: string[];
}

// formats image names into something more readable for a metric name
// e.g. <account-id>.dkr.ecr.<region>.amazonaws.com/<image-name>:latest -> <image-name>:latest
const formatImageName = (imageName: string): string => {
  if (imageName) {
    const splitImageName = imageName.split('/');
    return splitImageName[splitImageName.length - 1];
  }
  return imageName;
};

export class ECSEnvironment implements IEnvironment {
  private sink: ISink | undefined;
  private metadata: IECSMetadataResponse | undefined;
  private fluentBitEndpoint: string | undefined;

  public async probe(): Promise<boolean> {
    if (!process.env.ECS_CONTAINER_METADATA_URI) {
      return Promise.resolve(false);
    }

    if (process.env.FLUENT_HOST && !config.agentEndpoint) {
      this.fluentBitEndpoint = `tcp://${process.env.FLUENT_HOST}:${Constants.DEFAULT_AGENT_PORT}`;
      config.agentEndpoint = this.fluentBitEndpoint;
      LOG(`Using FluentBit configuration. Endpoint: ${this.fluentBitEndpoint}`);
    }

    try {
      const options = new URL(process.env.ECS_CONTAINER_METADATA_URI);
      this.metadata = await fetchJSON<IECSMetadataResponse>(options);
      if (this.metadata) {
        this.metadata.FormattedImageName = formatImageName(this.metadata.Image);
        LOG(`Successfully collected ECS Container metadata.`);
      }
    } catch (e) {
      LOG('Failed to collect ECS Container Metadata.');
      LOG(e);
    }

    // return true regardless of whether or not metadata collection
    // succeeded. we know that this is supposed to be an ECS environment
    // just from the environment variable
    return true;
  }

  public getName(): string {
    if (config.serviceName) {
      return config.serviceName;
    }

    return this.metadata?.FormattedImageName ? this.metadata.FormattedImageName : 'Unknown';
  }

  public getType(): string {
    return 'AWS::ECS::Container';
  }

  public getLogGroupName(): string {
    // FireLens / fluent-bit does not need the log group to be included
    // since configuration of the LogGroup is handled by the
    // fluent bit config file
    if (this.fluentBitEndpoint) {
      return '';
    }

    return config.logGroupName || this.getName();
  }

  public configureContext(context: MetricsContext): void {
    this.addProperty(context, 'containerId', os.hostname());
    this.addProperty(context, 'createdAt', this.metadata?.CreatedAt);
    this.addProperty(context, 'startedAt', this.metadata?.StartedAt);
    this.addProperty(context, 'image', this.metadata?.Image);
    this.addProperty(context, 'cluster', this.metadata?.Labels['com.amazonaws.ecs.cluster']);
    this.addProperty(context, 'taskArn', this.metadata?.Labels['com.amazonaws.ecs.task-arn']);

    // we override the standard default dimensions here because in the
    // FireLens / fluent-bit case, we don't need the LogGroup
    if (this.fluentBitEndpoint) {
      context.setDefaultDimensions({
        ServiceName: config.serviceName || this.getName(),
        ServiceType: config.serviceType || this.getType(),
      });
    }
  }

  public getSink(): ISink {
    if (!this.sink) {
      const logGroupName = this.fluentBitEndpoint ? '' : this.getLogGroupName();
      this.sink = new AgentSink(logGroupName);
    }
    return this.sink;
  }

  private addProperty(context: MetricsContext, key: string, value: string | undefined): void {
    if (value) {
      context.setProperty(key, value);
    }
  }
}
