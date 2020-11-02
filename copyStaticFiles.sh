#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

mkdir -p ./dist/test/fixtures
cp -r test/fixtures ./dist/test
cp DigiCertSHA2SecureServerCA.pem dist
