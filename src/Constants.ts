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

export enum Constants {
  MAX_DIMENSION_SET_SIZE = 30,
  MAX_DIMENSION_NAME_LENGTH = 250,
  MAX_DIMENSION_VALUE_LENGTH = 1024,
  MAX_METRIC_NAME_LENGTH = 1024,
  MIN_METRIC_VALUE = -2.3485425827738332278894805967893370273756825489083198707072e108,
  MAX_METRIC_VALUE = 2.3485425827738332278894805967893370273756825489083198707072e108,
  MAX_NAMESPACE_LENGTH = 256,
  VALID_NAMESPACE_REGEX = '^[a-zA-Z0-9._#:/-]+$',
  MAX_TIMESTAMP_PAST_AGE = 1209600000, // 2 weeks
  MAX_TIMESTAMP_FUTURE_AGE = 7200000, // 2 hours

  DEFAULT_NAMESPACE = 'aws-embedded-metrics',
  MAX_METRICS_PER_EVENT = 100,
  MAX_VALUES_PER_METRIC = 100,
  DEFAULT_AGENT_HOST = '0.0.0.0',
  DEFAULT_AGENT_PORT = 25888,
}
