#!/usr/bin/env bash

rootdir=$(git rev-parse --show-toplevel)
rootdir=${rootdir:-$(pwd)} # in case we are not in a git repository (Code Pipelines)

cd $rootdir
source $rootdir/bin/utils.sh

new_version=$(cat package.json | jq '.version' --raw-output)
echo "Deploying $new_version to NPM"

rm -rf node_modules/
# we need to do this so that eslint doesn't try to stat the directory
# and blow up on too many symlinks
rm -rf examples/agent/node_modules/
rm -rf examples/ecs-firelens/node_modules/
rm -rf examples/lambda/src/node_modules/
rm -rf examples/testing/node_modules/

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc
npm whoami

# if the version is a pre-release, tag it with "next"
if [[ $new_version == *"-"* ]]; then
    echo "New version is a pre-release, tagging as next"
    npm publish --tag next
    check_exit
else
    echo "New version is NOT a pre-release, tagging as latest."
    npm publish
    check_exit
fi