#!/bin/bash

# enable recursive globbing with **
shopt -s globstar

# to be able to restore proto/ and not lose work it has to be clean
if git status -s | grep '^ ..proto/' > /dev/null; then
	echo "the proto dir must be staged or clean to generate types. 'git add' or 'git restore' the dir"
	exit 1
fi

# start clean
rm -rf src/grpc/types

# https://github.com/protobufjs/protobuf.js/issues/1799
sed -Ei '/^ +\/\/.*/d' proto/*.proto

cd proto
dirs=$(find -type d)
cd ..

# generate types to tmp dir
for d in $dirs
do
	npx proto-loader-gen-types \
		--keepCase \
		--longs=String \
		--enums=String \
		--defaults \
		--oneofs \
		--grpcLib=@grpc/grpc-js \
		--outDir=src/grpc/types/"$d" \
		proto/"$d"/*.proto || exit 1
done

# undo `sed` on the proto dir
git restore proto

cd src/grpc/types

# for every just generated ts file,
# change the extension to .d.ts to not flood dist with empty files
# however, if there is an enum in the file it should be compiled
ls **/*.ts | while read f
do
	if ! grep const "$f" > /dev/null; then
		mv "$f" "$(echo "$f" | sed 's/ts$/d.ts/')"
	fi
done

# type fixes for eslint:
# replace empty interfaces with { [k: string]: never }
# replace any with unknown in some generated type
sed -zi 's/{\n}/{ [k: string]: never }/g;s/Constructor extends new (...args: any) => any/Constructor extends new (...args: unknown[]) => unknown/g' **/*.ts

cd ../../../proto

# array of names of the .proto files without their extension
protos=$(ls **/*.proto | sed 's/\..*$//')

cd ../src/grpc

# header of generated file, notice one redirect symbol (>), this creates a fresh file with this content
echo -e "// Generated file. Do not edit. Edit the template proto.ts.template instead.\n" > proto.ts

# loop through lines of the template file and echo lines to the generated file. >> is used here to append it
cat proto.ts.template | while read line
do
	if echo "$line" | grep -E '{{name}}|{{path}}' > /dev/null 2>&1; then
		# this line contains {{name}} or {{path}}
		for p in $protos
		do
			n=$(basename "$p")
			echo "$line" | sed "s|{{name}}|${n^}|g;s|{{path}}|$p|g"
		done
	else
		# just write, nothing special
		echo "$line"
	fi
done >> proto.ts

# run prettier on the just generated files
npx pretty-quick
