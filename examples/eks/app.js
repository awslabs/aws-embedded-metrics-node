const Koa = require('koa');
const app = new Koa();

const { metricScope, Configuration, Unit, StorageResolution } = require('aws-embedded-metrics');

Configuration.serviceName = 'EKS-Demo';
Configuration.serviceType = 'AWS::EKS::Cluster';
Configuration.logStreamName = process.env.HOSTNAME;

app.use(
  metricScope(metrics => async (ctx, next) => {
    const start = Date.now();

    await next();

    ctx.body = `Hello World ... ${ctx.method} ${ctx.url}\n`;

    metrics.setProperty('Method', ctx.method);
    metrics.setProperty('Url', ctx.url);
    metrics.putMetric('ProcessingTime', Date.now() - start, Unit.Milliseconds);
    metrics.putMetric('ProcessingLatency', 100, Unit.Milliseconds, StorageResolution.High);
  }),
);

app.listen(3000);
