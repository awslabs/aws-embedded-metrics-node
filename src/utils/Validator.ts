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
import { DimensionSetExceededError } from '../exceptions/DimensionSetExceededError';
import { InvalidDimensionError } from '../exceptions/InvalidDimensionError';

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
}
