const { metricScope, Unit, StorageResolution} = require('aws-embedded-metrics');

const doWork = metricScope(metrics => async event => {
  metrics.putDimensions({ Operation: 'Agent' });
  metrics.putMetric('ExampleMetricHigh', 100, Unit.Milliseconds);
  metrics.putMetric('ExampleMetricHigh', 101, Unit.Milliseconds,StorageResolution.High);
  metrics.setProperty('RequestId', '422b1569-16f6-4a03-b8f0-fe3fd9b100f8');
});

const dodummyWork = metricScope(metrics => async event => {
  metrics.putDimensions({ Operation: 'Agent' });
  metrics.putMetric('ExampleMetricHigh', 102, Unit.Milliseconds, StorageResolution.High);
  metrics.putMetric('ExampleMetricHigh', 103, Unit.Milliseconds, StorageResolution.High);
  metrics.setProperty('RequestId', '422b1569-16f6-4a03-b8f0-fe3fd9b100f8');
});

doWork();
// dodummyWork();
// doWork();
