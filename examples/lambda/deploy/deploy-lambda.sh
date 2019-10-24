#!/usr/bin/env bash
#
# usage:
# ./deploy/deploy-lambda.sh { LAMBDA_ARN } { region }

rootdir=$(git rev-parse --show-toplevel)

LIB_PATH=$rootdir
ZIP_PATH=$rootdir/examples/lambda/artifacts
SRC_PATH=$rootdir/examples/lambda/src
NODE_MODULES_PATH=$rootdir/examples/lambda/src/node_modules
AWS_LAMBDA_ARN=$1
REGION=$2

rm "$ZIP_PATH.zip"

###################################
# Copy current version over to node_modules
###################################

mkdir $NODE_MODULES_PATH
cp -r $LIB_PATH/lib $NODE_MODULES_PATH/aws-embedded-metrics

###################################
# Compress the bundle
###################################

pushd $SRC_PATH
pwd
zip -r $ZIP_PATH .
popd

###################################
# Deploy Lambda
###################################

echo "Updating function code with archive at $ZIP_PATH.zip..."
aws lambda update-function-code \
    --function-name $AWS_LAMBDA_ARN \
    --region $REGION \
    --zip-file fileb://$ZIP_PATH.zip

###################################
# Cleanup temp files
###################################
rm -rf $NODE_MODULES_PATH
rm "$ZIP_PATH.zip"
