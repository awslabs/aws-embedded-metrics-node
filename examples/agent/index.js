const { metricScope, Unit, StorageResolution } = require('aws-embedded-metrics');

const doWork = metricScope(metrics => async event => {
  metrics.putDimensions({ Operation: 'Agent' });
  metrics.putMetric('ExampleMetric', 100, Unit.Milliseconds);
  metrics.putMetric('ExampleHighResolutionMetric', 10, Unit.Milliseconds, StorageResolution.High);
  metrics.setProperty('RequestId', '422b1569-16f6-4a03-b8f0-fe3fd9b100f8');
});

doWork();
