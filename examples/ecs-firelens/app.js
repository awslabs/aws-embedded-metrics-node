const Koa = require('koa');
const app = new Koa();

const { metricScope, Unit } = require('aws-embedded-metrics');

app.use(
  metricScope(metrics => async (ctx, next) => {
    const start = Date.now();

    await next();

    ctx.body = `Hello World ... ${ctx.method} ${ctx.url}\n`;

    metrics.setProperty('Method', ctx.method);
    metrics.setProperty('Url', ctx.url);
    metrics.putMetric('ProcessingTime', Date.now() - start, Unit.Milliseconds);

    // send application logs to stdout, FireLens will send this to a different LogGroup
    console.log('Completed Request');
  }),
);

app.listen(3000);
