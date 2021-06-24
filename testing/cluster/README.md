# Setup

### Clone Sphinx Repos
- clone all six Sphinx repos into a single dir

### Polar
- import Sphinx-Test-2 into Polar

### PostgreSQL
- make username postgres and password sphinx
- run cluster.sql to create tables

### Sphinx Proxy
- `go build`

### github.com/stakwork/lightning-onion
- just needs to be a sibling directory of sphinx-proxy

### Sphinx Auth
- `go build`

### Sphinx Mqtt
- `go build`
- ./plugins/auth/authhttp/http.json
```
{
    "auth": "http://localhost:9090/mqtt/auth",
    "acl": "http://localhost:9090/mqtt/acl",
    "super": "http://localhost:9090/mqtt/superuser"
}
```

### Sphinx Tribes
- `go build`

### Sphinx Meme
- `go build`

### Sphinx Relay
- `npm install`

# Testing
- set up cluster_config.json
- set path to Sphinx dir as config.path
- `node ./testing/cluster-test.js`

### arguments
- `--skip=bob` skip a node
- `--only=proxy,virtual-esp` only run nodes
- `--hardware` config proxy for external signing on hardware