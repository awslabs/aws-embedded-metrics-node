import { metricScope } from '../../../src/scopes/MetricScope';
import Sleep from '../../utils/Sleep';
import Configuration from '../../../src/config/Configuration';
const os = require('os');
import CloudWatch = require('aws-sdk/clients/cloudwatch');
const cwmClient = new CloudWatch();

const now = () => new Date().getTime();
const startTime = new Date();
const timeoutSeconds = 120;

const serviceName = `IntegrationTests-${os.hostname()}`;
const serviceType = 'AutomatedTest';
const logGroupName = 'aws-emf-node-integ';

test(
  'end to end integration test with agent',
  async () => {
    // arrange
    Configuration.serviceName = serviceName;
    Configuration.serviceType = serviceType;
    Configuration.logGroupName = logGroupName;

    const doWork = metricScope(metrics => () => {
      metrics.putDimensions({ Operation: 'Agent' });
      metrics.putMetric('ExampleMetric', 100, 'Milliseconds');
      metrics.setProperty('RequestId', '422b1569-16f6-4a03-b8f0-fe3fd9b100f8');
    });

    // act
    doWork();

    // assert
    let attempts = 0;
    while (!(await metricExists())) {
      console.log('No metrics yet. Sleeping before trying again. Attempt #', attempts++);
      await Sleep(2000);
    }
  },
  timeoutSeconds * 1000,
);

const metricExists = async (): Promise<boolean> => {
  const request = {
    Namespace: 'aws-embedded-metrics',
    MetricName: 'ExampleMetric',
    Dimensions: [
      { Name: 'ServiceName', Value: serviceName },
      { Name: 'ServiceType', Value: serviceType },
      { Name: 'LogGroup', Value: logGroupName },
      { Name: 'Operation', Value: 'Agent' },
    ],
    Period: 60,
    StartTime: new Date(startTime.getTime() - 5000),
    EndTime: new Date(now()),
    Statistics: ['SampleCount', 'Average'],
  };

  const result = await cwmClient.getMetricStatistics(request).promise();

  if (result && result.Datapoints) {
    return result.Datapoints.length > 0;
  }

  console.warn(result);

  return false;
};
