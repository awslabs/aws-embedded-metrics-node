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
import { EnvironmentProvider } from '../environment/EnvironmentDetector';
import { IEnvironment } from '../environment/IEnvironment';
import { MetricsContext } from './MetricsContext';
import { Unit } from './Unit';

type Metrics = { name: string, value: number, unit?: Unit };
type MetricsWithDimensions = {
  metrics: Metrics[],
  namespace?: string | undefined,
  dimensions?: Array<Record<string, string>> | undefined,

  /**
   * Do not apply default dimensions such as ServiceName and ServiceType.
   * The default behavior is to include the default dimensions.
   */
  stripDefaultDimensions?: boolean | undefined;
};

/**
 * An async metrics logger.
 * Use this interface to publish logs to CloudWatch Logs
 * and extract metrics to CloudWatch Metrics asynchronously.
 */
export class MetricsLogger {
  private context: MetricsContext;
  private resolveEnvironment: EnvironmentProvider;

  constructor(resolveEnvironment: EnvironmentProvider, context?: MetricsContext) {
    this.resolveEnvironment = resolveEnvironment;
    this.context = context || MetricsContext.empty();
  }

  /**
   * Flushes the current context state to the configured sink.
   */
  public async flush(): Promise<void> {
    // resolve the environment and get the sink
    // MOST of the time this will run synchonrously
    // This only runs asynchronously if executing for the
    // first time in a non-lambda environment
    const environment = await this.resolveEnvironment();

    this.configureContextForEnvironment(this.context, environment);
    const sink = environment.getSink();

    // accept and reset the context
    sink.accept(this.context);
    this.context = this.context.createCopyWithContext();
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
  public setProperty(key: string, value: unknown): MetricsLogger {
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
  public putMetric(key: string, value: number, unit?: Unit | string): MetricsLogger {
    this.context.putMetric(key, value, unit);
    return this;
  }

  /**
   * Set the CloudWatch namespace that metrics should be published to.
   * @param value
   */
  public setNamespace(value: string): MetricsLogger {
    this.context.setNamespace(value);
    return this;
  }

  /**
   * Add a collection of metrics to be aggregated on a different set of dimensions
   * than the default dimension set.
   * 
   * @param metricWithDimensions 
   */
  public putMetricWithDimensions(metricWithDimensions: MetricsWithDimensions): MetricsLogger {
    return this;
  }

  /**
   * Creates a new logger using the same contextual data as
   * the previous logger. This allows you to flush the instances
   * independently.
   */
  public new(): MetricsLogger {
    return new MetricsLogger(this.resolveEnvironment, this.context.createCopyWithContext());
  }

  private configureContextForEnvironment = (context: MetricsContext, environment: IEnvironment): void => {
    const defaultDimensions = {
      // LogGroup name will entirely depend on the environment since there
      // are some cases where the LogGroup cannot be configured (e.g. Lambda)
      LogGroup: environment.getLogGroupName(),
      ServiceName: Configuration.serviceName || environment.getName(),
      ServiceType: Configuration.serviceType || environment.getType(),
    };
    context.setDefaultDimensions(defaultDimensions);
    environment.configureContext(context);
  };
}
