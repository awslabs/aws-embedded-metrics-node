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

## Docker

With Docker images, using the `awslogs` log driver will send your container logs to CloudWatch Logs. All you have to do is write to STDOUT and your EMF logs will be processed.

[Official Docker documentation for `awslogs` driver](https://docs.docker.com/config/containers/logging/awslogs/)

## ECS and Fargate

With ECS and Fargate, you can use the `awsfirelens` (recommended ) or `awslogs` log driver to have your logs sent to CloudWatch Logs on your behalf. After configuring the options for your preferred log driver, you may write your EMF logs to STDOUT and they will be processed.

[`awsfirelens` documentation](https://github.com/aws/amazon-cloudwatch-logs-for-fluent-bit)

[ECS documentation on `awslogs` log driver](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html)

## Fluent Bit and Fluentd

Fluent Bit can be used to collect logs and push them to CloudWatch Logs. After configuring the Amazon CloudWatch Logs output plugin, you may write your EMF logs to STDOUT and they will be processed.

[Getting Started with Fluent Bit](https://docs.fluentbit.io/manual/installation/getting-started-with-fluent-bit)

[Amazon CloudWatch output plugin for Fluent Bit](https://docs.fluentbit.io/manual/pipeline/outputs/cloudwatch)

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

## EKS
### Install dependencies
```sh
npm i
```

### Deployment

1. Create a new EKS cluster using [eksctl](https://docs.aws.amazon.com/eks/latest/userguide/eksctl.html).
```sh
eksctl create cluster --name eks-demo
```

2. Build and push the docker image. You will want to use your own Dockerhub repository.
```sh
docker login
docker build . -t <username>/eks-demo:latest --platform linux/amd64
docker push <username>/eks-demo
```

3. Set the container image name in `kubernetes/deployment.yaml` and apply the configuration to your cluster.
```sh
kubectl apply -f kubernetes/
kubectl get deployment eks-demo
```

4. Add CloudWatch permissions to the worker nodes.
```sh
# Get the IAM role name for the worker nodes (NodeRole):
aws eks describe-nodegroup --cluster-name eks-demo --nodegroup-name <nodegroup_name>

# Attach the CloudWatchAgentServerPolicy to the role:
aws iam attach-role-policy --role-name <node_role> --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
```


5. To test, naviagate to your ELB endpoint for the cluster. This will generate EMF logs in your AWS account.
```sh
# Get endpoint
kubectl get svc eks-demo

# Ping the endpoint
curl http://<endpoint>.<region>.elb.amazonaws.com/ping
```

6. To update, re-build, push changes and delete the running pod.

```sh
docker build . -t <username>/eks-demo:latest --platform linux/amd64
docker push <username>/eks-demo
kubectl delete pod <pod_name>
```