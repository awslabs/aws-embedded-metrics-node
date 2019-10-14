import { MetricsContext } from '../logger/MetricsContext';
import { ISink } from '../sinks/Sink';

/**
 * A runtime environment (e.g. Lambda, EKS, ECS, EC2)
 */
export interface IEnvironment {
  /**
   * Determines whether or not we are executing in this environment
   */
  probe(): boolean;

  /**
   * Get the environment name. This will be used to set the ServiceName dimension.
   */
  getName(): string;

  /**
   * Get the environment type. This will be used to set the ServiceType dimension.
   */
  getType(): string;

  /**
   * Configure the context with environment properties.
   *
   * @param context
   */
  configureContext(context: MetricsContext): void;

  /**
   * Create the appropriate sink for this environment.
   */
  createSink(): ISink;
}
