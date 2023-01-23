const { metricScope, Unit, Configuration, StorageResolution } = require('aws-embedded-metrics');

let version = '';
try {
  const json = require('./node_modules/aws-embedded-metrics/package.json');
  version = json.version || 'Unknown';
} catch (_) {}

let init = true;

Configuration.logGroupName = '/Canary/NodeJS/CloudWatchAgent/Metrics';

const recordMetric = metricScope(metrics => () => {
  if (init) {
    metrics.putMetric('Init', 1, Unit.Count);
    init = false;
  }

  const memoryUsage = process.memoryUsage();

  metrics.setNamespace('Canary');
  metrics.setDimensions({ Runtime: 'NodeJS', Platform: 'ECS', Agent: 'CloudWatchAgent', Version: version });
  metrics.putMetric('Invoke', 1, Unit.Count);

  metrics.putMetric('Memory.HeapTotal', memoryUsage.heapTotal, Unit.Bytes);
  metrics.putMetric('Memory.HeapUsed', memoryUsage.heapUsed, Unit.Bytes, StorageResolution.High);
  metrics.putMetric('Memory.RSS', memoryUsage.rss, Unit.Bytes);
});

// delay the start so that the CW Agent has time to startup
// the better option would be to configure a health check
// on the agent and link it to the ECS dependsOn config
// additionally, we should implement a circular buffer
// in the AgentSink to allow retries on transient failures
setTimeout(() =>
  setInterval(() => 
    recordMetric(), 
  100), 
5000);
