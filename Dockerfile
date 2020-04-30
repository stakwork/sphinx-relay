FROM golang:1.13-alpine as builder

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

# Pass a tag, branch or a commit using build-arg.  This allows a docker
# image to be built from a specified Git state.  The default image
# will use the Git tip of master by default.
ARG checkout="v0.9.0-beta"
# ARG checkout="master"

# Install dependencies and build the binaries.
RUN apk add --no-cache --update alpine-sdk git make gcc openssh-client

# RUN mkdir /root/.ssh/
# ADD id_rsa /root/.ssh/id_rsa
# RUN touch /root/.ssh/known_hosts
# RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
# RUN git clone git@github.com:stakwork/lnd-lean.git /go/src/github.com/lightningnetwork/lnd

RUN git clone https://github.com/lightningnetwork/lnd /go/src/github.com/lightningnetwork/lnd
RUN cd /go/src/github.com/lightningnetwork/lnd \
&&  git checkout $checkout \
&&  make \
&&  make install tags="signrpc walletrpc chainrpc invoicesrpc"

# Start a new, final image.
FROM alpine as final

RUN mkdir /relay/
WORKDIR /relay/

VOLUME /relay/.lnd

# Add bash and ca-certs, for quality of life and SSL-related reasons.
RUN apk --no-cache add \
    bash \
    ca-certificates

# Copy the binaries from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

RUN apk add --update nodejs nodejs-npm sqlite

COPY package.json .
RUN npm install
RUN npm install nodemon --save-dev
RUN npm install express --save-dev
RUN npm install webpack webpack-cli --save-dev

RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python
RUN npm install --quiet node-gyp -g

RUN npm install sqlite3 --build-from-source --save-dev
RUN npm install --save-dev sequelize
RUN npm rebuild
COPY . .
RUN npm run tsc
