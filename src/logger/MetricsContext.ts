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

import CloudWatch = require('aws-sdk/clients/cloudwatch');
import { Constants } from '../Constants';
import { LOG } from '../utils/Logger';
import { MetricDatum } from './MetricDatum';

interface IProperties {
  [s: string]: any;
}

type Metrics = Map<string, MetricDatum>;
type Unit = CloudWatch.StandardUnit;

export class MetricsContext {
  /**
   * Use this to create a new, empty context.
   */
  public static empty() {
    return new MetricsContext();
  }

  public namespace: string;
  public properties: IProperties;
  public metrics: Metrics = new Map<string, MetricDatum>();
  private dimensions: Array<Record<string, string>>;
  private defaultDimensions: Record<string, string>;

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
    this.namespace = namespace || Constants.DEFAULT_NAMESPACE;
    this.properties = properties || {};
    this.dimensions = dimensions || [];
    this.properties.Timestamp = new Date().getTime();
    this.defaultDimensions = defaultDimensions || {};
  }

  public setNamespace(value: string) {
    this.namespace = value;
  }

  public setProperty(key: string, value: any) {
    this.properties[key] = value;
  }

  /**
   * Sets default dimensions for the Context.
   * A dimension set will be created with just the default dimensions
   * and all calls to putDimensions will be prepended with the defaults.
   */
  public setDefaultDimensions(dimensions: Record<string, string>) {
    LOG(`Received default dimensions`, dimensions);
    this.defaultDimensions = dimensions;
  }

  /**
   * Adds a new set of dimensions. Any time a new dimensions set
   * is added, the set is first prepended by the default dimensions.
   *
   * @param dimensions
   */
  public putDimensions(dimensions: Record<string, string>) {
    this.dimensions.push(dimensions);
  }

  /**
   * Overwrite all dimensions.
   *
   * @param dimensionSets
   */
  public setDimensions(dimensionSets: Array<Record<string, string>>) {
    this.dimensions = dimensionSets;
  }

  /**
   * Get the current dimensions.
   */
  public getDimensions(): Array<Record<string, string>> {
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
    return this.dimensions.map(custom => {
      return { ...this.defaultDimensions, ...custom };
    });
  }

  public putMetric(key: string, value: number, unit?: Unit) {
    this.metrics.set(key, new MetricDatum(value, unit));
  }

  /**
   * Creates an independently flushable context.
   */
  public createCopyWithContext(): MetricsContext {
    return new MetricsContext(
      this.namespace,
      Object.assign({}, this.properties),
      Object.assign([], this.dimensions),
      this.defaultDimensions,
    );
  }
}
