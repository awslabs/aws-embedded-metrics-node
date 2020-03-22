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

import { LOG } from '../utils/Logger';
import { DefaultEnvironment } from './DefaultEnvironment';
import { ECSEnvironment } from './ECSEnvironment';
import { EC2Environment } from './EC2Environment';
import { LambdaEnvironment } from './LambdaEnvironment';
import { IEnvironment } from './IEnvironment';
import config from '../config/Configuration';
import Environments from './Environments';
import { LocalEnvironment } from './LocalEnvironment';

type EnvironmentProvider = () => Promise<IEnvironment>;

const lambdaEnvironment = new LambdaEnvironment();
const ecsEnvironment = new ECSEnvironment();
const ec2Environment = new EC2Environment();
const defaultEnvironment = new DefaultEnvironment();

// ordering of this array matters
// both Lambda and ECS can be determined from environment variables
// making the entire detection process fast an cheap
// EC2 can only be determined by making a remote HTTP request
const environments = [lambdaEnvironment, ecsEnvironment, ec2Environment];

let environment: IEnvironment | undefined = undefined;

const getEnvironmentFromOverride = (): IEnvironment | undefined => {
  // short-circuit environment detection and use override
  switch (config.environmentOverride) {
    case Environments.Agent:
      return defaultEnvironment;
    case Environments.EC2:
      return ec2Environment;
    case Environments.Lambda:
      return lambdaEnvironment;
    case Environments.ECS:
      return ecsEnvironment;
    case Environments.Local:
      return new LocalEnvironment();
    case Environments.Unknown:
    default:
      return undefined;
  }
};

const discoverEnvironment = async (): Promise<IEnvironment> => {
  LOG(`Discovering environment`);
  for (const envUnderTest of environments) {
    LOG(`Testing: ${envUnderTest.constructor.name}`);

    try {
      if (await envUnderTest.probe()) {
        return envUnderTest;
      }
    } catch (e) {
      LOG(`Failed probe: ${envUnderTest.constructor.name}`);
    }
  }
  return defaultEnvironment;
};

const _resolveEnvironment: EnvironmentProvider = async (): Promise<IEnvironment> => {
  LOG('Resolving environment');
  if (environment) {
    return environment;
  }

  if (config.environmentOverride) {
    LOG('Environment override supplied', config.environmentOverride);
    // this will be falsy if an invalid configuration value is provided
    environment = getEnvironmentFromOverride();
    if (environment) {
      return environment;
    } else {
      LOG('Invalid environment provided. Falling back to auto-discovery.', config.environmentOverride);
    }
  }

  environment = await discoverEnvironment(); // eslint-disable-line require-atomic-updates
  return environment;
};

// pro-actively begin resolving the environment
// this will allow us to kick off any async tasks
// at module load time to reduce any blocking that
// may occur on the initial flush()
const environmentPromise = _resolveEnvironment();
const resolveEnvironment: EnvironmentProvider = async (): Promise<IEnvironment> => {
  return environmentPromise;
};

// this method is used for testing to bypass the cached environmentPromise result
const cleanResolveEnvironment = async (): Promise<IEnvironment> => {
  await environmentPromise;
  environment = undefined;
  return await _resolveEnvironment();
};

export { EnvironmentProvider, resolveEnvironment, cleanResolveEnvironment };
