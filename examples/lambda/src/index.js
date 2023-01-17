const { metricScope, StorageResolution } = require('aws-embedded-metrics');

const aggregator = metricScope(metrics => async event => {
  console.log('received message');
  metrics.putDimensions({ Service: 'Aggregator' });
  metrics.putMetric('ProcessingLatency', 100, 'Milliseconds');
  metrics.putMetric('CPU Utilization', 87, 'Percent', StorageResolution.High);
  metrics.setProperty('AccountId', '123456789012');
  metrics.setProperty('RequestId', '422b1569-16f6-4a03-b8f0-fe3fd9b100f8');
  metrics.setProperty('DeviceId', '61270781-c6ac-46f1-baf7-22c808af8162');
  metrics.setProperty('Payload', {
    sampleTime: 123456789,
    temperature: 273.0,
    pressure: 101.3,
  });
  console.log('completed aggregation successfully.');
});

exports.handler = aggregator;
