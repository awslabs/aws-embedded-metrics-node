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

type EnvironmentProvider = () => Promise<IEnvironment>;

const environments = [new LambdaEnvironment(), new EC2Environment()];

let environment: IEnvironment | undefined;
const resolveEnvironment: EnvironmentProvider = async (): Promise<IEnvironment> => {
  if (environment) {
    return environment;
  }

  for (const envUnderTest of environments) {
    LOG(`Testing: ${envUnderTest.constructor.name}`);
    if (await envUnderTest.probe()) {
      environment = envUnderTest;
      break;
    }
  }

  if (!environment) {
    environment = new DefaultEnvironment();
  }

  LOG(`Using Environment: ${environment.constructor.name}`);

  return environment;
};

const resetEnvironment = () => (environment = undefined);

// pro-actively begin resolving the environment
// this will allow us to kick off any async tasks
// at module load time to reduce any blocking that
// may occur on the initial flush()
resolveEnvironment();

export { EnvironmentProvider, resolveEnvironment, resetEnvironment };
