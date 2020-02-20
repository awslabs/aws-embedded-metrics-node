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

import { IConfiguration } from './IConfiguration';
import Environments from "../environment/Environments";

const ENV_VAR_PREFIX = 'AWS_EMF';

enum ConfigKeys {
  LOG_GROUP_NAME = 'LOG_GROUP_NAME',
  LOG_STREAM_NAME = 'LOG_STREAM_NAME',
  ENABLE_DEBUG_LOGGING = 'ENABLE_DEBUG_LOGGING',
  SERVICE_NAME = 'SERVICE_NAME',
  SERVICE_TYPE = 'SERVICE_TYPE',
  AGENT_ENDPOINT = 'AGENT_ENDPOINT',
  ENVIRONMENT_OVERRIDE = 'ENVIRONMENT'
}

export class EnvironmentConfigurationProvider {
  public getConfiguration(): IConfiguration {
    return {
      agentEndpoint: this.getEnvVariable(ConfigKeys.AGENT_ENDPOINT),
      debuggingLoggingEnabled: this.tryGetEnvVariableAsBoolean(ConfigKeys.ENABLE_DEBUG_LOGGING, false),
      logGroupName: this.getEnvVariable(ConfigKeys.LOG_GROUP_NAME),
      logStreamName: this.getEnvVariable(ConfigKeys.LOG_STREAM_NAME),
      serviceName:
        this.getEnvVariable(ConfigKeys.SERVICE_NAME) || this.getEnvVariableWithoutPrefix(ConfigKeys.SERVICE_NAME),
      serviceType:
        this.getEnvVariable(ConfigKeys.SERVICE_TYPE) || this.getEnvVariableWithoutPrefix(ConfigKeys.SERVICE_TYPE),
      environmentOverride: this.getEnvironmentOverride()
    };
  }

  private getEnvVariableWithoutPrefix(configKey: string): string | undefined {
    return process.env[configKey];
  }

  private getEnvVariable(configKey: string): string | undefined {
    return process.env[`${ENV_VAR_PREFIX}_${configKey}`];
  }

  private tryGetEnvVariableAsBoolean(configKey: string, fallback: boolean): boolean {
    const configValue = this.getEnvVariable(configKey);
    return !configValue ? fallback : configValue.toLowerCase() === 'true';
  }
  
  getEnvironmentOverride(): Environments {
    const overrideValue = this.getEnvVariable(ConfigKeys.ENVIRONMENT_OVERRIDE);
    const environment = Environments[overrideValue as keyof typeof Environments];
    if (environment === undefined) {
      return Environments.Unknown;
    }
    return environment;
  }
}
