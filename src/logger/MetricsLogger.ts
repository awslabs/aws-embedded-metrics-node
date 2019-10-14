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
import { ISink } from '../sinks/Sink';
import { MetricsContext } from './MetricsContext';

type Unit = CloudWatch.StandardUnit;

/**
 * An async metrics logger.
 * Use this interface to publish logs to CloudWatch Logs
 * and extract metrics to CloudWatch Metrics asynchronously.
 */
export class MetricsLogger {
  private context: MetricsContext;
  private sink: ISink;

  constructor(sink: ISink, context?: MetricsContext) {
    this.sink = sink;
    this.context = context || MetricsContext.empty();
  }

  /**
   * Flushes the current context state to the configured sink.
   */
  public flush(): void {
    this.sink.accept(this.context);
    this.context = MetricsContext.empty();
  }

  /**
   * Set a property on the published metrics.
   * This is stored in the emitted log data and you are not
   * charged for this data by CloudWatch Metrics.
   * These values can be values that are useful for searching on,
   * but have too high cardinality to emit as dimensions to
   * CloudWatch Metrics.
   *
   * @param key Property name
   * @param value Property value
   */
  public setProperty(key: string, value: any): MetricsLogger {
    this.context.setProperty(key, value);
    return this;
  }

  /**
   * Adds a dimension.
   * This is generally a low cardinality key-value pair that is part of the metric identity.
   * CloudWatch treats each unique combination of dimensions as a separate metric, even if the metrics have the same metric name.
   *
   * @param dimension
   * @param value
   * @see [CloudWatch Dimensions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Dimension)
   */
  public putDimensions(dimensions: Record<string, string>): MetricsLogger {
    this.context.putDimensions(dimensions);
    return this;
  }

  /**
   * Overwrite all dimensions on this MetricsLogger instance.
   *
   * @param dimensionSets
   * @see [CloudWatch Dimensions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Dimension)
   */
  public setDimensions(...dimensionSets: Array<Record<string, string>>): MetricsLogger {
    this.context.setDimensions(dimensionSets);
    return this;
  }

  /**
   * Put a metric value.
   * This value will be emitted to CloudWatch Metrics asyncronously and does not contribute to your
   * account TPS limits. The value will also be available in your CloudWatch Logs
   * @param key
   * @param value
   * @param unit
   */
  public putMetric(key: string, value: number, unit?: Unit): MetricsLogger {
    this.context.putMetric(key, value, unit);
    return this;
  }

  /**
   * Creates a new logger using the same contextual data as
   * the previous logger. This allows you to flush the instances
   * independently.
   */
  public new(): MetricsLogger {
    return new MetricsLogger(this.sink, this.context.createCopyWithContext());
  }
}
