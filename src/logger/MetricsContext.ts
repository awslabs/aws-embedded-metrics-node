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
import { MetricValues } from './MetricValues';
import { Unit } from './Unit';

interface IProperties {
  [s: string]: unknown;
}

type Metrics = Map<string, MetricValues>;
type DimensionSet = Record<string, string>;
type MetricsDirective = {
  namespace: string;
  dimensions: DimensionSet[]
  metrics: Metrics
}

export class MetricsContext {
  /**
   * Use this to create a new, empty context.
   */
  public static empty(): MetricsContext {
    return new MetricsContext();
  }

  public properties: IProperties;
  public meta: Record<string, string | number> = {};
  private defaultMetricsDirective: MetricsDirective;
  private metricDirectives: MetricsDirective[];
  private defaultDimensions: Record<string, string>;
  private shouldUseDefaultDimensions = true;

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
  ) {
    this.properties = properties || {};
    this.meta.Timestamp = new Date().getTime();
    this.defaultDimensions = defaultDimensions || {};
    this.defaultMetricsDirective = {
      namespace: namespace || Configuration.namespace,
      metrics: new Map<string, MetricValues>(),
      dimensions: dimensions || []
    };
    this.metricDirectives = [ this.defaultMetricsDirective ];
  }

  public setNamespace(value: string): void {
    this.defaultMetricsDirective.namespace = value;
  }

  public setProperty(key: string, value: unknown): void {
    this.properties[key] = value;
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
    if (this.defaultMetricsDirective.dimensions.length === 0) {
      this.defaultMetricsDirective.dimensions.push(incomingDimensionSet);
      return;
    }

    for (let i = 0; i < this.defaultMetricsDirective.dimensions.length; i++) {
      const existingDimensionSet = this.defaultMetricsDirective.dimensions[i];

      // check for duplicate dimensions when putting
      // this is an O(n^2) operation, but since we never expect to have more than
      // 10 dimensions, this is acceptable for almost all cases.
      // This makes re-using loggers much easier.
      const existingDimensionSetKeys = Object.keys(existingDimensionSet);
      const incomingDimensionSetKeys = Object.keys(incomingDimensionSet);
      if (existingDimensionSetKeys.length !== incomingDimensionSetKeys.length) {
        this.defaultMetricsDirective.dimensions.push(incomingDimensionSet);
        return;
      }

      for (let j = 0; j < existingDimensionSetKeys.length; j++) {
        if (!incomingDimensionSetKeys.includes(existingDimensionSetKeys[j])) {
          // we're done now because we know that the dimensions keys are not identical
          this.defaultMetricsDirective.dimensions.push(incomingDimensionSet);
          return;
        }
      }
    }
  }

  public putMetricDirective(metrics: Metrics, dimensions: DimensionSet[], namespace?: string): void {
    this.metricDirectives.push({
      namespace: namespace || Configuration.namespace,
      metrics,
      dimensions
    });
  }

  /**
   * Overwrite all dimensions.
   *
   * @param dimensionSets
   */
  public setDimensions(dimensionSets: Array<Record<string, string>>): void {
    this.shouldUseDefaultDimensions = false;
    this.defaultMetricsDirective.dimensions = dimensionSets;
  }

  /**
   * Get the current dimensions on the default metric directive.
   */
  public getDimensions(): Array<Record<string, string>> {
    // caller has explicitly called setDimensions
    if (this.shouldUseDefaultDimensions === false) {
      return this.defaultMetricsDirective.dimensions;
    }

    // if there are no default dimensions, return the custom dimensions
    if (Object.keys(this.defaultDimensions).length === 0) {
      return this.defaultMetricsDirective.dimensions;
    }

    // if default dimensions have been provided, but no custom dimensions, use the defaults
    if (this.defaultMetricsDirective.dimensions.length === 0) {
      return [this.defaultDimensions];
    }

    // otherwise, merge the dimensions
    // we do this on the read path because default dimensions
    // may get updated asynchronously by environment detection
    return this.defaultMetricsDirective.dimensions.map(custom => {
      return { ...this.defaultDimensions, ...custom };
    });
  }

  /**
   * Add a metric to the default metric directive.
   * 
   * @param key The name of the metric
   * @param value The metric value. Note that percentiles are only supported on positive vales.
   * @param unit The metric unit. Must be a valid CloudWatch metric.
   */
  public putMetric(key: string, value: number, unit?: Unit | string): void {
    const currentMetric = this.defaultMetricsDirective.metrics.get(key);
    if (currentMetric) {
      currentMetric.addValue(value);
    } else {
      this.defaultMetricsDirective.metrics.set(key, new MetricValues(value, unit));
    }
  }

  /**
   * Creates an independently flushable context.
   */
  public createCopyWithContext(): MetricsContext {
    return new MetricsContext(
      this.defaultMetricsDirective.namespace,
      Object.assign({}, this.properties),
      Object.assign([], this.defaultMetricsDirective.dimensions),
      this.defaultDimensions,
    );
  }
}
