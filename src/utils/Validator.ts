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

import validator from 'validator';
import { Constants } from '../Constants';
import { Unit } from '../logger/Unit';
import { DimensionSetExceededError } from '../exceptions/DimensionSetExceededError';
import { InvalidDimensionError } from '../exceptions/InvalidDimensionError';
import { InvalidMetricError } from '../exceptions/InvalidMetricError';
import { InvalidNamespaceError } from '../exceptions/InvalidNamespaceError';
import { InvalidTimestampError } from '../exceptions/InvalidTimestampError';

export class Validator {
  /**
   * Validates dimension set.
   * @see [CloudWatch Dimensions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_Dimension.html)
   *
   * @param dimensionSet
   * @throws {DimensionSetExceededError} Dimension set must not exceed 30 dimensions.
   * @throws {InvalidDimensionError} Dimension name and value must be valid.
   */
  public static validateDimensionSet(dimensionSet: Record<string, string>): void {
    // Validates dimension set length
    if (Object.keys(dimensionSet).length > Constants.MAX_DIMENSION_SET_SIZE)
      throw new DimensionSetExceededError(
        `Maximum number of dimensions per dimension set allowed are ${Constants.MAX_DIMENSION_SET_SIZE}`,
      );

    // Validate dimension key and value
    Object.entries(dimensionSet).forEach(([key, value]) => {
      dimensionSet[key] = value = String(value);

      if (!validator.isAscii(key)) {
        throw new InvalidDimensionError(`Dimension key ${key} has invalid characters`);
      }
      if (!validator.isAscii(value)) {
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
  }

  /**
   * Validates metric name.
   * @see [CloudWatch Metric](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html)
   *
   * @param key
   * @param value
   *
   * @throws {InvalidMetricError} Metric name must be valid.
   */
  public static validateMetric(key: string, value: number, unit?: Unit | string): void {
    if (key.trim().length == 0) {
      throw new InvalidMetricError(`Metric key ${key} must include at least one non-whitespace character`);
    }

    if (key.length > Constants.MAX_METRIC_NAME_LENGTH) {
      throw new InvalidMetricError(
        `Metric key ${key} must not exceed maximum length ${Constants.MAX_METRIC_NAME_LENGTH}`,
      );
    }

    if (isNaN(value) || value === -Infinity || value === Infinity) {
      throw new InvalidMetricError(`Metric value ${value} is not a number`);
    }

    if (value >= Constants.MAX_METRIC_VALUE) {
      throw new InvalidMetricError(`Metric value ${value} must not exceed maximum value ${Constants.MAX_METRIC_VALUE}`);
    }

    if (value <= Constants.MIN_METRIC_VALUE) {
      throw new InvalidMetricError(
        `Metric value ${value} must not be less than minimum value ${Constants.MIN_METRIC_VALUE}`,
      );
    }

    if (
      unit &&
      !Object.values(Unit)
        .map(u => String(u))
        .includes(unit)
    ) {
      throw new InvalidMetricError(`Metric unit ${unit} is not valid`);
    }
  }

  /**
   * Validates metric namespace.
   * @see [CloudWatch Namespace](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Namespace)
   *
   * @param namespace
   * @throws {InvalidNamespaceError} Namespace must be of valid length.
   */
  public static validateNamespace(namespace: string): void {
    if (namespace.trim().length == 0) {
      throw new InvalidNamespaceError(`Namespace must include at least one non-whitespace character`);
    }

    if (namespace.length > Constants.MAX_NAMESPACE_LENGTH) {
      throw new InvalidNamespaceError(`Namespace must not exceed maximum length ${Constants.MAX_NAMESPACE_LENGTH}`);
    }

    if (!validator.matches(namespace, Constants.VALID_NAMESPACE_REGEX)) {
      throw new InvalidNamespaceError(`Namespace ${namespace} has invalid characters`);
    }
  }

  /**
   * Validates timestamp.
   * @see [CloudWatch Timestamp](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Metric)
   *
   * @param timestamp
   */
  public static validateTimestamp(timestamp: Date | number): void {
    timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);

    let timestampStr;
    try {
      timestampStr = timestamp.toISOString();
    } catch (e) {
      throw new InvalidTimestampError(`Timestamp ${timestamp} is invalid`);
    }

    const isTooOld = validator.isBefore(
      timestampStr,
      new Date(Date.now() - Constants.MAX_TIMESTAMP_PAST_AGE).toISOString(),
    );
    const isTooNew = validator.isAfter(
      timestampStr,
      new Date(Date.now() + Constants.MAX_TIMESTAMP_FUTURE_AGE).toISOString(),
    );

    if (isTooOld) {
      throw new InvalidTimestampError(
        `Timestamp ${timestampStr} must not be older than ${Constants.MAX_TIMESTAMP_PAST_AGE} milliseconds`,
      );
    }

    if (isTooNew) {
      throw new InvalidTimestampError(
        `Timestamp ${timestampStr} must not be newer than ${Constants.MAX_TIMESTAMP_FUTURE_AGE} milliseconds`,
      );
    }
  }
}
