#!/usr/bin/env bash

rootdir=$(git rev-parse --show-toplevel)

pushd $rootdir/examples/agent
export AWS_EMF_LOG_GROUP_NAME=AgentDemo
export AWS_EMF_LOG_STREAM_NAME=local
export AWS_EMF_SERVICE_NAME=Demo
export AWS_EMF_SERVICE_TYPE=local
node index.js
popd