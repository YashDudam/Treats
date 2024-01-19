#!/usr/bin/env bash

WORKING_DIRECTORY="~/www/cs1531deploy"

USERNAME="h13b-crunchie"
SSH_HOST="ssh-h13b-crunchie.alwaysdata.net"

scp -r ./package.json ./package-lock.json ./tsconfig.json ./src ./dataStore.json "$USERNAME@$SSH_HOST:$WORKING_DIRECTORY"
ssh "$USERNAME@$SSH_HOST" "cd $WORKING_DIRECTORY && npm install --only=production"
