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

import { MetricsLogger } from '../logger/MetricsLogger';
import { createMetricsLogger } from '../logger/MetricsLoggerFactory';
import { executor } from './ScopeExecutor';

/**
 * An asynchronous wrapper that provides a metrics instance.
 */
const metricScope = (handler: (m: MetricsLogger) => any) => {
  // tslint:disable-next-line
  const wrappedHandler = async function(...args: any[]) {
    return await executionWrapper(handler, args);
  };
  return wrappedHandler;
};

const executionWrapper = async (handler: (m: MetricsLogger) => any, args: any[]) => {
  const metrics = createMetricsLogger();
  await executor(async () => (await handler(metrics))(...args), metrics);
};

export { metricScope };
