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
import { ISink } from '../sinks/Sink';

/**
 * A runtime environment (e.g. Lambda, EKS, ECS, EC2)
 */
export interface IEnvironment {
  /**
   * Determines whether or not we are executing in this environment
   */
  probe(): Promise<boolean>;

  /**
   * Get the environment name. This will be used to set the ServiceName dimension.
   */
  getName(): string;

  /**
   * Get the environment type. This will be used to set the ServiceType dimension.
   */
  getType(): string;

  /**
   * Get log group name. This will be used to set the LogGroup dimension.
   */
  getLogGroupName(): string;

  /**
   * Configure the context with environment properties.
   *
   * @param context
   */
  configureContext(context: MetricsContext): void;

  /**
   * Create the appropriate sink for this environment.
   */
  getSink(): ISink;
}
