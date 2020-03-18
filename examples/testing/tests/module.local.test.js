// this test demonstrates how you can use local environment override
// to avoid mocking entirely
// you can use this if you're not interested in making assertions
// about the metrics being logged
// the metrics will be serialized and sent to stdout

// set the environment override to Local which just logs to stdout
// this needs to be done prior to importing any modules
// because environment detection starts as soon as the 
// aws-embedded-metrics module is loaded
process.env.AWS_EMF_ENVIRONMENT = 'Local';

const { usingScope } = require('../src/module');

// now we'll begin testing our actual methods
test('usingScope test', async () => {
  // arrange
  const count = Math.random() * 100;
  const accountId = Math.random() * 100;
  const requestId = '1e2171fa-fe92-4b20-b44d-43f908beda14';

  // act
  await usingScope({ accountId, count }, { requestId });

  // assert
  // I don't have anything I need to assert...
});