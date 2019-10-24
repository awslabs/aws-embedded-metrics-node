# Examples

## Lambda

You can deploy the Lambda example by running:

```sh
export AWS_REGION=us-west-2
export LAMBDA_ARN="arn:aws:lambda:$AWS_REGION:<AccountId>:function:<FunctionName>"
./examples/lambda/deploy/deploy-lambda.sh $LAMBDA_ARN $AWS_REGION
```

## Agent

In order to run this example you will need the CloudWatch Agent running locally. 
The easiest way to do this is by running it in a Docker container using the following script.
Alternatively, you can find installation instructions [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/install-CloudWatch-Agent-on-EC2-Instance.html).

```sh
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_REGION=us-west-2
./bin/start-agent.sh
```

Run the example:

```
./examples/agent/run.sh
```