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
import { EC2Environment } from './EC2Environment';
import { IEnvironment } from './IEnvironment';
import { LambdaEnvironment } from './LambdaEnvironment';
import config from '../config/Configuration';
import Environments from './Environments';
import { LocalEnvironment } from './LocalEnvironment';

type EnvironmentProvider = () => Promise<IEnvironment>;

const lambdaEnvironment = new LambdaEnvironment();
const ec2Environment = new EC2Environment();
const defaultEnvironment = new DefaultEnvironment();
const environments = [lambdaEnvironment, ec2Environment];

let environment : IEnvironment | undefined = defaultEnvironment;

const getEnvironmentFromOverride = (): IEnvironment => {
  // short-circuit environment detection and use override
  switch (config.environmentOverride) {
    case Environments.Agent:
      return defaultEnvironment;
    case Environments.EC2:
      return ec2Environment;
    case Environments.Lambda:
      return lambdaEnvironment;
    case Environments.Local:
      return new LocalEnvironment();
    case Environments.Unknown:
    default:
      return defaultEnvironment;
  }
}

const discoverEnvironment = async (): Promise<IEnvironment> => {
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
}

const _resolveEnvironment: EnvironmentProvider = async (): Promise<IEnvironment> => {
  if (environment) {
    return environment;
  }

  if (config.environmentOverride) {
    LOG("Environment override supplied", config.environmentOverride);
    environment = getEnvironmentFromOverride();
    return environment;
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

const cleanResolveEnvironment = async (): Promise<IEnvironment> => {
  environment = undefined; 
  return await _resolveEnvironment();
};

export { EnvironmentProvider, resolveEnvironment, cleanResolveEnvironment };
