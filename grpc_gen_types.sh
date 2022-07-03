#!/bin/bash

sed -Ei '/^ +\/\/.*/d' proto/*.proto
npx proto-loader-gen-types --keepCase --longs=String --enums=String --defaults --oneofs --grpcLib=grpc --outDir=src/lightning/grpc_types proto/*.proto
git restore proto
