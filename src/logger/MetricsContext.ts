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

import Configuration from '../config/Configuration';
import { LOG } from '../utils/Logger';
import { Validator } from '../utils/Validator';
import { MetricValues } from './MetricValues';
import { Unit } from './Unit';

interface IProperties {
  [s: string]: unknown;
}

type Metrics = Map<string, MetricValues>;

export class MetricsContext {
  /**
   * Use this to create a new, empty context.
   */
  public static empty(): MetricsContext {
    return new MetricsContext();
  }

  public namespace: string;
  public properties: IProperties;
  public metrics: Metrics = new Map<string, MetricValues>();
  public meta: Record<string, string | number> = {};
  private dimensions: Array<Record<string, string>>;
  private defaultDimensions: Record<string, string>;
  private shouldUseDefaultDimensions = true;
  private timestamp: Date | number | undefined;

  /**
   * Constructor used to create child instances.
   * You should not use this constructor directly.
   * Instead, use createCopyWithContext() or empty().
   *
   * The reason for this is to avoid unexpected behavior when creating
   * MetricsContexts with defaultDimensions and existing dimensions.
   *
   * @param properties
   * @param dimensions
   */
  private constructor(
    namespace?: string,
    properties?: IProperties,
    dimensions?: Array<Record<string, string>>,
    defaultDimensions?: Record<string, string>,
    shouldUseDefaultDimensions?: boolean,
    timestamp?: Date | number,
  ) {
    this.namespace = namespace || Configuration.namespace;
    this.properties = properties || {};
    this.dimensions = dimensions || [];
    this.timestamp = timestamp;
    this.meta.Timestamp = MetricsContext.resolveMetaTimestamp(timestamp);
    this.defaultDimensions = defaultDimensions || {};
    if (shouldUseDefaultDimensions != undefined) {
      this.shouldUseDefaultDimensions = shouldUseDefaultDimensions;
    }
  }

  private static resolveMetaTimestamp(timestamp?: Date | number): number {
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    } else if (timestamp) {
      return timestamp;
    } else {
      return Date.now();
    }
  }

  public setNamespace(value: string): void {
    this.namespace = value;
  }

  public setProperty(key: string, value: unknown): void {
    this.properties[key] = value;
  }

  public setTimestamp(timestamp: Date | number): void {
    this.timestamp = timestamp;
    this.meta.Timestamp = MetricsContext.resolveMetaTimestamp(timestamp);
  }

  /**
   * Sets default dimensions for the Context.
   * A dimension set will be created with just the default dimensions
   * and all calls to putDimensions will be prepended with the defaults.
   */
  public setDefaultDimensions(dimensions: Record<string, string>): void {
    LOG(`Received default dimensions`, dimensions);
    this.defaultDimensions = dimensions;
  }

  /**
   * Adds a new set of dimensions. Any time a new dimensions set
   * is added, the set is first prepended by the default dimensions.
   *
   * @param dimensions
   */
  public putDimensions(incomingDimensionSet: Record<string, string>): void {
    Validator.validateDimensionSet(incomingDimensionSet);

    // Duplicate dimensions sets are removed before being added to the end of the collection.
    // This ensures the latest dimension key-value is used as a target member on the root EMF node.
    // This operation is O(n^2), but acceptable given sets are capped at 10 dimensions
    const incomingDimensionSetKeys = Object.keys(incomingDimensionSet);
    this.dimensions = this.dimensions.filter((existingDimensionSet) => {
      const existingDimensionSetKeys = Object.keys(existingDimensionSet);
      if (existingDimensionSetKeys.length !== incomingDimensionSetKeys.length) {
        return true;
      }
      return !existingDimensionSetKeys.every((existingDimensionSetKey) =>
        incomingDimensionSetKeys.includes(existingDimensionSetKey),
      );
    });

    this.dimensions.push(incomingDimensionSet);
  }

  /**
   * Overwrite all dimensions.
   *
   * @param dimensionSets
   */
  public setDimensions(dimensionSets: Array<Record<string, string>>, useDefault = false): void {
    dimensionSets.forEach((dimensionSet) => Validator.validateDimensionSet(dimensionSet));
    this.shouldUseDefaultDimensions = useDefault;
    this.dimensions = dimensionSets;
  }

  /**
   * Reset all custom dimensions
   * @param useDefault Indicates whether default dimensions should be used
   */
  public resetDimensions(useDefault: boolean): void {
    this.shouldUseDefaultDimensions = useDefault;
    this.dimensions = [];
  }

  /**
   * Get the current dimensions.
   */
  public getDimensions(): Array<Record<string, string>> {
    // caller has explicitly called setDimensions
    if (this.shouldUseDefaultDimensions === false) {
      return this.dimensions;
    }

    // if there are no default dimensions, return the custom dimensions
    if (Object.keys(this.defaultDimensions).length === 0) {
      return this.dimensions;
    }

    // if default dimensions have been provided, but no custom dimensions, use the defaults
    if (this.dimensions.length === 0) {
      return [this.defaultDimensions];
    }

    // otherwise, merge the dimensions
    // we do this on the read path because default dimensions
    // may get updated asynchronously by environment detection
    return this.dimensions.map((custom) => {
      return { ...this.defaultDimensions, ...custom };
    });
  }

  public putMetric(key: string, value: number, unit?: Unit | string): void {
    const currentMetric = this.metrics.get(key);
    if (currentMetric) {
      currentMetric.addValue(value);
    } else {
      this.metrics.set(key, new MetricValues(value, unit));
    }
  }

  /**
   * Creates an independently flushable context.
   * Custom dimensions are preserved by default unless preserveDimensions parameter is set.
   * @param preserveDimensions Indicates whether custom dimensions should be preserved
   */
  public createCopyWithContext(preserveDimensions = true): MetricsContext {
    return new MetricsContext(
      this.namespace,
      Object.assign({}, this.properties),
      preserveDimensions ? Object.assign([], this.dimensions) : [],
      this.defaultDimensions,
      this.shouldUseDefaultDimensions,
      this.timestamp,
    );
  }
}
