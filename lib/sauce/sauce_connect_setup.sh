#!/bin/bash

set -e

# Setup and start Sauce Connect for your TravisCI build
# This script requires your .travis.yml to include the following two private env variables:
# SAUCE_USERNAME
# SAUCE_ACCESS_KEY
# Follow the steps at https://saucelabs.com/opensource/travis to set that up.
#
# Curl and run this script as part of your .travis.yml before_script section:
# before_script:
#   - curl https://gist.github.com/santiycr/5139565/raw/sauce_connect_setup.sh | bash

CONNECT_URL="http://saucelabs.com/downloads/Sauce-Connect-latest.zip"
CONNECT_DIR="/tmp/sauce-connect-$RANDOM"
CONNECT_DOWNLOAD="Sauce_Connect.zip"

if [[ -z "${LOGS_DIR}" ]]; then
  LOGS_DIR="/tmp/fineuploader-build/logs"
fi
mkdir -p $LOGS_DIR

CONNECT_LOG="$LOGS_DIR/sauce-connect.log"
CONNECT_STDOUT="$LOGS_DIR/sauce-connect.stdout"
CONNECT_STDERR="$LOGS_DIR/sauce-connect.stderr"
CONNECT_READYFILE="$LOGS_DIR/sauce-connect.ready-$RANDOM"
CONNECT_PID_FILE="$LOGS_DIR/sauce-connect.pid"

# Get Connect and start it
mkdir -p $CONNECT_DIR
cd $CONNECT_DIR
echo "Downloading Sauce-Connect"
curl -# $CONNECT_URL -o $CONNECT_DOWNLOAD
echo "got it!"
unzip $CONNECT_DOWNLOAD > /dev/null
rm $CONNECT_DOWNLOAD



ARGS=""

# Set tunnel-id only on Travis, to make local testing easier.
if [ ! -z "$TRAVIS_JOB_NUMBER" ]; then
  #ARGS="$ARGS --tunnel-identifier $TRAVIS_JOB_NUMBER"
  echo $TRAVIS_JOB_NUMBER
fi
if [ ! -z "$SAUCE_CONNECT_READY_FILE" ]; then
  ARGS="$ARGS --readyfile $SAUCE_CONNECT_READY_FILE"
fi


echo "Starting Sauce Connect in the background, logging into:"
echo "  $CONNECT_LOG"
echo "  $CONNECT_STDOUT"
echo "  $CONNECT_STDERR"
echo "  $CONNCT_PID"


#2> $CONNECT_STDERR 1> $CONNECT_STDOUT &

if [[ ! -z "$SAUCE_USERNAME" && ! -z "$SAUCE_ACCESS_KEY" ]]; then
    java -jar Sauce-Connect.jar \
      $SAUCE_USERNAME $SAUCE_ACCESS_KEY \
      $ARGS \
      --logfile $CONNECT_LOG \
      --readyfile $CONNECT_READYFILE 2> $CONNECT_STDERR 1> $CONNECT_STDOUT &

    #CONNECT_PID=$!
    #touch $CONNECT_PID_FILE
    #echo $CONNECT_PID > $CONNECT_PID_FILE
else
    echo "Requires SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables"
fi


