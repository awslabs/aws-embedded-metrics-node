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
import { MetricsLogger } from './MetricsLogger';
import { createMetricsLogger } from './MetricsLoggerFactory';

/**
 * An asynchronous wrapper that provides a metrics instance.
 */
const metricScope = <T, U extends readonly unknown[]>(
  handler: (m: MetricsLogger) => (...args: U) => T | Promise<T>,
): ((...args: U) => Promise<T>) => {
  const wrappedHandler = async (...args: U): Promise<T> => {
    const metrics = createMetricsLogger();
    try {
      return await handler(metrics)(...args);
    } finally {
      try {
        await metrics.flush();
      } catch (e) {
        LOG('Failed to flush metrics', e);
      }
    }
  };
  return wrappedHandler;
};

export { metricScope };
