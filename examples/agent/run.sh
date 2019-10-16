#!/usr/bin/env bash

export AWS_EMF_ENABLE_DEBUG_LOGGING=true
export AWS_EMF_LOG_GROUP_NAME=AgentDemo
export AWS_EMF_LOG_STREAM_NAME=local
export AWS_EMF_SERVICE_NAME=Demo
export AWS_EMF_SERVICE_TYPE=local
npm start