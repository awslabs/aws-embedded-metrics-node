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
   * Checks if every value of the given dimension is a string
   * 
   * @param {Array} the array of dimensions sets ([{dimensionName: 'dimensionValue'}])
   * @returns {boolean}
   */
  private static checkDimensionValueTypes(dimensionSets : Array<Record<string, string>>) : boolean {
    return dimensionSets.every((dimensionSet : Record<string, string>) => {
      const dimensionNames : Array<string> = Object.keys(dimensionSet);
      return dimensionNames.every((dimensionName : string) => {
        return typeof dimensionSet[dimensionName] === "string";
      });
    });
  }

  /**
   * Returns an array of all the existing dimension keys
   * 
   * @returns {Array}
   */
  private getExistingDimensionNames() : Array<string> {
    let existingDimensionNames : Array<string> = [];
    this.context.getDimensions().forEach((existingDimensionSet : Record<string, string>) => {
      const dimensionNames : Array<string> = Object.keys(existingDimensionSet);
      existingDimensionNames = existingDimensionNames.concat(dimensionNames); 
    });
    return existingDimensionNames;
  }

  /**
   * Check if the given dimension already contains a property that is not representing the value of an existing dimension
   * 
   * @param {Array} the array of dimensions sets ([{dimensionName: 'dimensionValue'}])
   * @returns {boolean}
   */
  private checkDimensionPropertyConflicts(dimensionSets : Array<Record<string, string>>) : boolean {
    let dimensionNames : Array<string> = [];
    dimensionSets.forEach((dimensionSet : Record<string, string>) => {
      dimensionNames = dimensionNames.concat(Object.keys(dimensionSet));
    });
    //Make sure to exclude the existing dimensions from the validator
    const existingDimensionNames : Array<string> = this.getExistingDimensionNames();
    return dimensionNames.filter((dimensionName : string) => {
      return !existingDimensionNames.includes(dimensionName);
    }).every((dimensionName : string) => {
      return !Object.keys(this.context.properties).includes(dimensionName);
    });
  }

  /**
   * Checks if the provided dimension sets are valid. Logs warnings if something isn't right
   * 
   * @param {Array} the array of dimensions sets ([{dimensionName: 'dimensionValue'}])
   **/
  private validateDimensionSets(dimensionSets : Array<Record<string, string>>) : void {
    //Make sure that all the dimensions' values are strings
    if (!MetricsLogger.checkDimensionValueTypes(dimensionSets)){
      console.warn('One of the provided dimensions contains a value that is not a string' + JSON.stringify(dimensionSets));
    }
    //Give a warning when the given dimension is new AND there is a property that has the same name
    if (!this.checkDimensionPropertyConflicts(dimensionSets)){
      console.warn('One of the provided dimensions already has a corresponding property in the root node. You might observe undefined behaviour depending on the property: ' + JSON.stringify(dimensionSets));
    }
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
    await sink.accept(this.context);
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
    const existingDimensionNames : Array<string> = this.getExistingDimensionNames();
    if (existingDimensionNames.includes(key)){
      console.warn('You are trying to set a property that overwrites the value of an existing dimension: ' + key);
    }
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
    this.validateDimensionSets([dimensions]);
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
    this.validateDimensionSets(dimensionSets);
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
   * Set the timestamp of metrics emitted in this context.
   *
   * If not set, the timestamp will default to new Date() at the point
   * the context is constructed.
   *
   * If set, timestamp will preserved across calls to flush().
   *
   * @param timestamp
   */
  public setTimestamp(timestamp: Date | number): MetricsLogger {
    this.context.setTimestamp(timestamp);
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
