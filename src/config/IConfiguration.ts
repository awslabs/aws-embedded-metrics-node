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

export interface IConfiguration {
  /**
   * Whether or not internal logging should be enabled.
   */
  debuggingLoggingEnabled: boolean;

  /**
   * The name of the service to use in the default dimensions.
   */
  serviceName: string | undefined;

  /**
   * The type of the service to use in the default dimensions.
   */
  serviceType: string | undefined;

  /**
   * The LogGroup name to use. This will be ignored when using the
   * Lambda scope.
   */
  logGroupName: string | undefined;

  /**
   * The LogStream name to use. This will be ignored when using the
   * Lambda scope.
   */
  logStreamName: string | undefined;

  /**
   * The endpoint to use to connect to the CloudWatch Agent
   */
  agentEndpoint: string | undefined;
}
