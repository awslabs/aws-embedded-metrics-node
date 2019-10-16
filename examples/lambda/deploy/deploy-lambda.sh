#!/usr/bin/env bash
#
# usage:
# ./deploy/deploy-lambda.sh { LAMBDA_ARN } { region }

rootdir=$(git rev-parse --show-toplevel)

LIB_PATH=$rootdir
ZIP_PATH=$rootdir/examples/lambda/artifacts
SRC_PATH=$rootdir/examples/lambda/src

AWS_LAMBDA_ARN=$1
REGION=$2

rm "$ZIP_PATH.zip"

pushd $SRC_PATH
pwd
zip -r $ZIP_PATH .
popd

echo "Updating function code with archive at $ZIP_PATH.zip..."
aws lambda update-function-code \
    --function-name $AWS_LAMBDA_ARN \
    --region $REGION \
    --zip-file fileb://$ZIP_PATH.zip
