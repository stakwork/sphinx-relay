**alice proxy CLN**

in sphinx-swarm run `cargo run --bin cln`

in sphinx-rs/vls-mqtt use local .env and `cargo run`

in sphinx-proxy run `./cln/creds.sh`

`./sphinx-proxy --mode cln`

node ./dist/app.js --config="/Users/evanfeenstra/code/sphinx/sphinx-relay/testing/cln/alice.json" --db="/Users/evanfeenstra/code/sphinx/sphinx-relay/testing/cln/alice-db.json"
