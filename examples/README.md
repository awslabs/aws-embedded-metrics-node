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

## FireLens on ECS

You can deploy the example by running the following:

```sh
# create an ECR repository for the example image
aws ecr create-repository --repository-name <image-name> --region <region>

# create an S3 bucket for the Fluent-Bit configuration
aws s3api create-bucket --bucket <bucket-name> --region <region>

# create ECS cluster
# create ECS task definition
# create ECS service

# deploy
./examples/ecs-firelens/publish.sh \
  <account-id> \
  <region> \
  <image-name> \
  <s3-bucket> \
  <ecs-cluster-name> \
  <ecs-task-family> \
  <ecs-service-name>
```

### Example Metrics

```json
{
  "_aws": {
    "Timestamp": 1583902595342,
    "CloudWatchMetrics": [
      {
        "Dimensions": [[ "ServiceName", "ServiceType" ]],
        "Metrics": [{ "Name": "ProcessingTime", "Unit": "Milliseconds" }],
        "Namespace": "aws-embedded-metrics"
      }
    ]
  },
  "ServiceName": "example",
  "ServiceType": "AWS::ECS::Container",
  "Method": "GET",
  "Url": "/test",
  "containerId": "702e4bcf1345",
  "createdAt": "2020-03-11T04:54:24.981207801Z",
  "startedAt": "2020-03-11T04:54:25.594413051Z",
  "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/emf-examples:latest",
  "cluster": "emf-example",
  "taskArn": "arn:aws:ecs:<region>:<account-id>:task/2fe946f6-8a2e-41a4-8fec-c4983bad8f74",
  "ProcessingTime": 5
}
```
