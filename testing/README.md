
### testing

**how to spin up a local sphinx simnet stack**

- sphinx-tribes
- sphinx-auth
- sphinx-meme
- btcd
- 4x LND (alice, bob, casey, proxy)
- sphinx-proxy
- 4x relay

**alice** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/alice.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/alice-db.json"

**bob** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/bob.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/bob-db.json"

**casey** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/casey.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/casey-db.json"

**proxy** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/proxy.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/proxy-db.json"

