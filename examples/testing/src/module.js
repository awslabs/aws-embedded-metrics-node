const { metricScope, createMetricsLogger, Unit } = require('aws-embedded-metrics');

const usingScope = metricScope(metrics => async (event, ctx) => {
  metrics.putDimensions({ Service: 'Aggregator' });
  metrics.putMetric('EventCount', event.count, Unit.Count);
  metrics.setProperty('AccountId', event.accountId);
  metrics.setProperty('RequestId', ctx.requestId);
});

const usingCreateLogger = async (event, ctx) => {
  const metrics = createMetricsLogger();
  metrics.putDimensions({ Service: 'Aggregator' });
  metrics.putMetric('EventCount', event.count, Unit.Count);
  metrics.setProperty('AccountId', event.accountId);
  metrics.setProperty('RequestId', ctx.requestId);
  await metrics.flush();
};

module.exports = { usingScope, usingCreateLogger };
