

```sh

node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/alice.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/alice-db.json"

node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/bob.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/bob-db.json"

node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/charlie.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/charlie-db.json"

node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/orange.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/greenlight/orange-db.json"

sqlite3 /Users/Shared/sphinx-alice-greenlight.db

```


node ./dist/app.js --config="/home/pi/charlie.json" --db="/home/pi/charlie-db.json"



http://rpcuser:rpcpass@34.65.140.45:8332

https://github.com/ElementsProject/lightning/blob/8167af553e3c9c95142caecc22030f78eacd6fca/contrib/pyln-testing/pyln/testing/utils.py#L1036-L1045

https://github.com/ElementsProject/lightning/blob/8167af553e3c9c95142caecc22030f78eacd6fca/plugins/bcli.c#L612-L617




./lightning

make

./configure

cd contrib/libhsmd_node

change to "Darwin" in the Makefile

make

change the npm install to "node-gyp rebuild binding-Darwin.gyp"

in relay, "npm link ../lightning/contrib/libhsmd_node"