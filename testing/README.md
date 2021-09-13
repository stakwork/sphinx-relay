## testing

### E2E

Because there are many moving parts involved in the sphinx stack,
most testing for relay is done in a pseudo-e2e environment. The easiest
way to develop and test sphinx relay is by running a
[sphinx-stack](https://github.com/stakwork/sphinx-stack) which will
spin up a full regtest network and sphinx components ontop of it.
There are tests that can be run against sphinx-stack available in the
[electron desktop app](https://github.com/stakwork/sphinx-win-linux-desktop).

Follow the instructions in the sphinx stack repo for more information.

### Integration tests

Some of the components in relay have integration tests written for them.
These similarly require a running test network. To setup your environment
and run these tests, follow these instructions:

#### Setup

(these instructions assume you're developing in sphinx-relay and want to test
against your changes)

1. Spin up a `no-alice` version of sphinx stack by running
   `docker-compose -f ./alts/no-alice.yml --project-directory . up -d`
   in that repo
1. Update the configs `/testing/stack/alice.json` and `/testing/stack/alice-db.json`
   to point to your sphinx-stack repo's alice configs, namely for tls cert, macaroon, and
   db storage values
1. In the sphinx-relay repo, run `npm run build -- --watch` to watch for changes
   in the repo and rebuild.
1. In another terminal session run the relay server, pointing to the stack configs:
   `node ./dist/app.js --config="testing/stack/alice.json" --db="testing/stack/alice-db.json"`
   (run with `nodemon` to automatically rerun on code changes)
1. Wait until the `sphinx-stack/relay/NODES.json` has been loaded up with the network's relay
   nodes' details. Most importantly we want the `authToken`s. This is triggered by your relay node
   pinging the network.
1. When the configs are loaded up, copy the contents of `sphinx-stack/relay/NODES.json` and paste
   to `sphinx-relay/src/tests/configs/nodes.json`

#### Run tests

Once you've done the above, you can run the tests with [ava](https://github.com/avajs/ava).

```
npm run test
```

The tests expect both the relay server and sphinx-stack from the setup steps above
to be running.
