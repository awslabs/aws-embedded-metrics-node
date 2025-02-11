#!/usr/bin/env bash
#
# Run integration tests against a CW Agent. 
# We first create the necessary 
# 
# usage:
#   export AWS_ACCESS_KEY_ID=
#   export AWS_SECRET_ACCESS_KEY=
#   export AWS_REGION=us-west-2
#   ./start-agent.sh

rootdir=$(git rev-parse --show-toplevel)
rootdir=${rootdir:-$(pwd)} # in case we are not in a git repository (Code Pipelines)

tempfile="$rootdir/test/integ/agent/.temp"

###################################
# Configure and start the agent
###################################

# Check if IAM user credentials exist
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "No IAM user credentials found, assuming we are running on CodeBuild pipeline, falling back to IAM role.."

    # Store the AWS STS assume-role output and extract credentials
    CREDS=$(aws sts assume-role \
        --role-arn $Code_Build_Execution_Role_ARN \
        --role-session-name "session-$(uuidgen)" \
        --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
        --output text \
        --duration-seconds 3600)

    # Parse the output into separate variables
    read AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN <<< $CREDS

    # Export the variables
    export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
    
    CREDENTIALS_CONTENT="[AmazonCloudWatchAgent]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
aws_session_token = $AWS_SESSION_TOKEN"
else
    echo "Using provided IAM user credentials..."
    CREDENTIALS_CONTENT="[AmazonCloudWatchAgent]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY"
fi

pushd $rootdir/test/integ/agent
echo "$CREDENTIALS_CONTENT" > ./.aws/credentials

echo "[profile AmazonCloudWatchAgent]
region = $AWS_REGION
" > ./.aws/config

docker build -t agent:latest .
docker run  -p 25888:25888/udp -p 25888:25888/tcp  \
    -e AWS_REGION=$AWS_REGION \
    -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    agent:latest &> $tempfile &
popd
