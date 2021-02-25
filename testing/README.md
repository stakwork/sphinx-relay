
### testing

**how to spin up a local sphinx simnet stack**

- sphinx-tribes (local auth plugin setup)
- sphinx-auth
- sphinx-meme (host=localhost:5000)
- btcd
- 4x simnet LND (alice, bob, casey, proxy)
- sphinx-proxy (bitcoin.simnet)
- 4x relay (alice, bob, casey, proxy)

**alice** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/alice.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/alice-db.json"

**bob** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/bob.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/bob-db.json"

**casey** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/casey.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/casey-db.json"

**proxy** 
node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx-relay/testing/configs/proxy.json" --db="/Users/evanfeenstra/code/sphinx-relay/testing/configs/proxy-db.json"

