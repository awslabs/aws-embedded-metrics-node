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

import { Constants } from '../Constants';
import { Unit } from '../logger/Unit';
import { StorageResolution } from '../logger/StorageResolution';
import { DimensionSetExceededError } from '../exceptions/DimensionSetExceededError';
import { InvalidDimensionError } from '../exceptions/InvalidDimensionError';
import { InvalidMetricError } from '../exceptions/InvalidMetricError';
import { InvalidNamespaceError } from '../exceptions/InvalidNamespaceError';
import { InvalidTimestampError } from '../exceptions/InvalidTimestampError';

/**
 * Validates dimension set.
 * @see [CloudWatch Dimensions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_Dimension.html)
 *
 * @param dimensionSet
 * @throws {DimensionSetExceededError} Dimension set must not exceed 30 dimensions.
 * @throws {InvalidDimensionError} Dimension name and value must be valid.
 */
const validateDimensionSet = (dimensionSet: Record<string, string>): void => {
  // Validates dimension set length
  if (Object.keys(dimensionSet).length > Constants.MAX_DIMENSION_SET_SIZE)
    throw new DimensionSetExceededError(
      `Maximum number of dimensions per dimension set allowed are ${Constants.MAX_DIMENSION_SET_SIZE}`,
    );

  // Validate dimension key and value
  Object.entries(dimensionSet).forEach(([key, value]) => {
    dimensionSet[key] = value = String(value);

    if (!new RegExp(Constants.VALID_DIMENSION_REGEX).test(key)) {
      throw new InvalidDimensionError(`Dimension key ${key} has invalid characters`);
    }
    if (!new RegExp(Constants.VALID_DIMENSION_REGEX).test(value)) {
      throw new InvalidDimensionError(`Dimension value ${value} has invalid characters`);
    }
    if (key.trim().length == 0) {
      throw new InvalidDimensionError(`Dimension key ${key} must include at least one non-whitespace character`);
    }

    if (value.trim().length == 0) {
      throw new InvalidDimensionError(`Dimension value ${value} must include at least one non-whitespace character`);
    }

    if (key.length > Constants.MAX_DIMENSION_NAME_LENGTH) {
      throw new InvalidDimensionError(
        `Dimension key ${key} must not exceed maximum length ${Constants.MAX_DIMENSION_NAME_LENGTH}`,
      );
    }

    if (value.length > Constants.MAX_DIMENSION_VALUE_LENGTH) {
      throw new InvalidDimensionError(
        `Dimension value ${value} must not exceed maximum length ${Constants.MAX_DIMENSION_VALUE_LENGTH}`,
      );
    }

    if (key.startsWith(':')) {
      throw new InvalidDimensionError(`Dimension key ${key} cannot start with ':'`);
    }
  });
};

/**
 * Validates metric.
 * @see [CloudWatch Metric](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html)
 *
 * @param key
 * @param value
 * @param unit
 * @param storageResolution
 *
 * @throws {InvalidMetricError} Metric name must be valid.
 */
const validateMetric = (
  key: string,
  value: number,
  unit?: Unit | string,
  storageResolution?: StorageResolution,
  metricNameAndResolutionMap?: Map<string, StorageResolution>,
): void => {
  if (key.trim().length == 0) {
    throw new InvalidMetricError(`Metric key ${key} must include at least one non-whitespace character`);
  }

  if (key.length > Constants.MAX_METRIC_NAME_LENGTH) {
    throw new InvalidMetricError(
      `Metric key ${key} must not exceed maximum length ${Constants.MAX_METRIC_NAME_LENGTH}`,
    );
  }

  if (!Number.isFinite(value)) {
    throw new InvalidMetricError(`Metric value ${value} is not a number`);
  }

  if (value > Number.MAX_SAFE_INTEGER) {
    throw new InvalidMetricError(`Metric value ${value} must not exceed maximum value ${Number.MAX_SAFE_INTEGER}}`);
  }

  if (value < -Number.MAX_SAFE_INTEGER) {
    throw new InvalidMetricError(
      `Metric value ${value} must not be less than minimum value ${-Number.MAX_SAFE_INTEGER}`,
    );
  }

  if (
    unit !== undefined &&
    !Object.values(Unit)
      .map((u) => String(u))
      .includes(unit)
  ) {
    throw new InvalidMetricError(`Metric unit ${unit} is not valid`);
  }

  if (
    storageResolution !== undefined &&
    !Object.values(StorageResolution)
      .map((s) => s)
      .includes(storageResolution)
  ) {
    throw new InvalidMetricError(`Metric resolution ${storageResolution} is not valid`);
  }

  if (
    metricNameAndResolutionMap?.has(key) &&
    metricNameAndResolutionMap.get(key) !== (storageResolution ? storageResolution : StorageResolution.Standard)
  ) {
    throw new InvalidMetricError(
      `Resolution for metrics ${key} is already set. A single log event cannot have a metric with two different resolutions.`,
    );
  }
};

/**
 * Validates metric namespace.
 * @see [CloudWatch Namespace](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Namespace)
 *
 * @param namespace
 * @throws {InvalidNamespaceError} Namespace must be of valid length.
 */
const validateNamespace = (namespace: string): void => {
  if (namespace.trim().length == 0) {
    throw new InvalidNamespaceError(`Namespace must include at least one non-whitespace character`);
  }

  if (namespace.length > Constants.MAX_NAMESPACE_LENGTH) {
    throw new InvalidNamespaceError(`Namespace must not exceed maximum length ${Constants.MAX_NAMESPACE_LENGTH}`);
  }

  if (!new RegExp(Constants.VALID_NAMESPACE_REGEX).test(namespace)) {
    throw new InvalidNamespaceError(`Namespace ${namespace} has invalid characters`);
  }
};

/**
 * Validates timestamp.
 * @see [CloudWatch Timestamp](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#about_timestamp)
 *
 * @param timestamp
 */
const validateTimestamp = (timestamp: Date | number): void => {
  if (!isDate(timestamp)) {
    throw new InvalidTimestampError(`Timestamp ${String(timestamp)} is invalid`);
  }

  timestamp = new Date(timestamp);

  if (timestamp < new Date(Date.now() - Constants.MAX_TIMESTAMP_PAST_AGE)) {
    throw new InvalidTimestampError(
      `Timestamp ${String(timestamp)} must not be older than ${Constants.MAX_TIMESTAMP_PAST_AGE} milliseconds`,
    );
  }

  if (timestamp > new Date(Date.now() + (Constants.MAX_TIMESTAMP_FUTURE_AGE as number))) {
    throw new InvalidTimestampError(
      `Timestamp ${String(timestamp)} must not be newer than ${Constants.MAX_TIMESTAMP_FUTURE_AGE} milliseconds`,
    );
  }
};

const isDate = (timestamp: Date | number): boolean => {
  return (timestamp instanceof Date && !isNaN(new Date(timestamp).getTime())) || new Date(timestamp).getTime() > 0;
};

export { validateDimensionSet, validateMetric, validateNamespace, validateTimestamp };
