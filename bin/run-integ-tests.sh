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
tempfile=".temp"

###################################
# Configure and start the agent
###################################

cd $rootdir/test/integ/agent
echo "[AmazonCloudWatchAgent]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
" > ./.aws/credentials

echo "[profile AmazonCloudWatchAgent]
region = $AWS_REGION
" > ./.aws/config

docker build -t agent:latest .
docker run  -p 25888:25888/udp \
    -e AWS_REGION=$AWS_REGION \
    -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    agent:latest &> $tempfile &

###################################
# Wait for the agent to boot
###################################

echo "Waiting for agent to start."
tail -f $tempfile | sed '/Output \[cloudwatchlogs\] buffer/ q'
containerId=$(docker ps -q)
echo "Agent started in container: $containerId."

###################################
# Run tests
###################################

cd $rootdir
npm run exec-integ

###################################
# Cleanup
###################################

docker stop $containerId
rm -rf $tempfile
rm -rf ./.aws/credentials
rm -rf ./.aws/config
