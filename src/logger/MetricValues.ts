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

import { Unit } from '..';
import { StorageResolution } from './StorageResolution';

export class MetricValues {
  public values: number[];
  public unit: string;
  public storageResolution: number;

  constructor(value: number, unit?: Unit | string, storageResolution?: StorageResolution | number) {
    this.values = [value];
    this.unit = unit || 'None';
    this.storageResolution = storageResolution || StorageResolution.Standard;
  }

  /**
   * Appends the provided value to the current metric
   * @param value
   */
  public addValue(value: number): void {
    this.values.push(value);
  }
}
