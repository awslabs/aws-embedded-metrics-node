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

/**
 * The executor is responsible for:
 *
 * - executing the customer defined operation
 * - ensuring that the metrics context gets flushed in the event of an unhandled
 *      exception
 */
const executor = async (operation: () => void, metrics: MetricsLogger) => {
  let exception = null;
  try {
    return await operation();
  } catch (e) {
    exception = e;
  } finally {
    metrics.flush();
  }

  if (exception) {
    throw exception;
  }
};

export { executor };
