#!/usr/bin/env bash
#
# Run integration tests against a CW Agent. 
# We first create the necessary 
# 
# usage:
#   export AWS_ACCESS_KEY_ID=
#   export AWS_SECRET_ACCESS_KEY=
#   export AWS_REGION=us-west-2
#   ./run-integ-tests.sh

rootdir=$(git rev-parse --show-toplevel)
rootdir=${rootdir:-$(pwd)} # in case we are not in a git repository (Code Pipelines)

tempfile="$rootdir/test/integ/agent/.temp"

###################################
# Configure and start the agent
###################################

$rootdir/bin/start-agent.sh

###################################
# Wait for the agent to boot
###################################

echo "Waiting for agent to start."
tail -f $tempfile | sed '/Loaded outputs: cloudwatchlogs/ q'
containerId=$(docker ps -q)
echo "Agent started in container: $containerId."

###################################
# Run tests
###################################

cd $rootdir
npm run exec-integ
status_code=$?

###################################
# Cleanup
###################################

cat $tempfile
docker stop $containerId
rm -rf $tempfile
rm -rf ./.aws/credentials
rm -rf ./.aws/config

exit $status_code