import { metricScope } from '../../../src/logger/MetricScope';
import Sleep from '../../utils/Sleep';
import Configuration from '../../../src/config/Configuration';
import os = require('os');
import CloudWatch = require('aws-sdk/clients/cloudwatch');
const cwmClient = new CloudWatch();

const now = () => new Date().getTime();
const startTime = new Date();
const timeoutMillis = 120_000;

const serviceName = `IntegrationTests-${os.hostname()}`;
const serviceType = 'AutomatedTest';
const logGroupName = 'aws-emf-node-integ';

Configuration.serviceName = serviceName;
Configuration.serviceType = serviceType;
Configuration.logGroupName = logGroupName;
Configuration.debuggingLoggingEnabled = true;

const dimensionKey = 'Operation';
const dimensionValue = 'Integ-Test-Agent';
const dimensions: Record<string, string> = {};
dimensions[dimensionKey] = dimensionValue;

const metricExists = async (metricName: string, expectedSampleCount: number): Promise<boolean> => {
  const request = {
    Namespace: 'aws-embedded-metrics',
    MetricName: metricName,
    Dimensions: [
      { Name: 'ServiceName', Value: serviceName },
      { Name: 'ServiceType', Value: serviceType },
      { Name: 'LogGroup', Value: logGroupName },
      { Name: dimensionKey, Value: dimensionValue },
    ],
    Period: 60,
    StartTime: new Date(startTime.getTime() - 5000),
    EndTime: new Date(now()),
    Statistics: ['SampleCount'],
  };

  const result = await cwmClient.getMetricStatistics(request).promise();

  if (result && result.Datapoints && result.Datapoints.length > 0) {
    const samples = result.Datapoints.map(dataPoint => dataPoint.SampleCount || 0).reduce((total, i) => total + i);
    console.log(`Received ${samples} samples.`);
    return samples === expectedSampleCount;
  }

  return false;
};

const waitForMetricExistence = async (metricName: string, expectedSampleCount: number): Promise<void> => {
  let attempts = 0;
  while (!(await metricExists(metricName, expectedSampleCount))) {
    console.log('No metrics yet. Sleeping before trying again. Attempt #', attempts++);
    await Sleep(2000);
  }
};

test(
  'end to end integration test with agent over UDP',
  async () => {
    // arrange
    const metricName = 'UDP-SingleFlush';
    const expectedSamples = 1;
    Configuration.agentEndpoint = 'udp://0.0.0.0:25888';

    const doWork = metricScope(metrics => () => {
      metrics.putDimensions(dimensions);
      metrics.putMetric(metricName, 100, 'Milliseconds');
    });

    // act
    doWork();

    // assert
    await waitForMetricExistence(metricName, expectedSamples);
  },
  timeoutMillis,
);

test(
  'multiple flushes over TCP connection that cross over idle timeout',
  async () => {
    // arrange
    const idleTimeout = 500;
    const metricName = 'TCP-MultipleFlushes';
    const expectedSamples = 2;

    Configuration.agentEndpoint = 'tcp://0.0.0.0:25888';

const doWork = metricScope(metrics => () => {
  metrics.putDimensions(dimensions);
  metrics.putMetric(metricName, 100, 'Milliseconds');
  metrics.setProperty('RequestId', '422b1569-16f6-4a03-b8f0-fe3fd9b100f8');
});

// act
doWork();
doWork();
await Sleep(idleTimeout);
doWork();

    // assert
    await waitForMetricExistence(metricName, expectedSamples);
  },
  timeoutMillis,
);
