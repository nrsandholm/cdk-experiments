#!/bin/bash

aws secretsmanager create-secret --name=auth-token-cdk-experiments --secret-string=$1