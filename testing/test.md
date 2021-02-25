
### clear out proxy things

rm /Users/evanfeenstra/code/sphinx-proxy/badger/000000.vlog
rm /Users/evanfeenstra/code/sphinx-proxy/badger/KEYREGISTRY
rm /Users/evanfeenstra/code/sphinx-proxy/badger/LOCK
rm /Users/evanfeenstra/code/sphinx-proxy/badger/MANIFEST
rm /Users/Shared/sphinx-proxy.db

sqlite3 /Users/Shared/sphinx-proxy.db
delete from sphinx_contacts where id!=tenant;

### singup proxy nodes

*proxy*

node ./scripts/signup --pubkey=XXX

*alice*

node ./scripts/signup --port=3001 --pubkey=028a3a60f23793238d6a03becb7b746d7558c4ee30d9b2d8babb460a8a6b8ea21a

sqlite3 /Users/Shared/sphinx-alice.db
delete from sphinx_contacts where id!=tenant;

rm /Users/Shared/sphinx-alice.db

### sphinx-android/test-ava/test-run

npx ava test-01-checkSelf.js --verbose --serial --timeout=2m

npx ava test-02-contactTest.js --verbose --serial --timeout=2m

npx ava test-03-imageTest.js --verbose --serial --timeout=2m
