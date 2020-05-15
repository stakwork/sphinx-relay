FROM golang:1.13-alpine as builder
LABEL maintainer="gonzaloaune@stakwork.com"

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

# Pass a tag, branch or a commit using build-arg.  This allows a docker
# image to be built from a specified Git state.  The default image
# will use the Git tip of master by default.
ARG checkout="v0.10.0-beta"
# ARG checkout="master"

# Install dependencies and build the binaries.
RUN apk add --no-cache --update alpine-sdk git make gcc openssh-client

RUN git clone https://github.com/lightningnetwork/lnd /go/src/github.com/lightningnetwork/lnd
RUN cd /go/src/github.com/lightningnetwork/lnd \
&&  git checkout $checkout \
&&  make \
&&  make install tags="signrpc walletrpc chainrpc invoicesrpc experimental"

# Start a new, final image.
FROM alpine as final

EXPOSE 80
EXPOSE 9735

ENV NODE_ENV production
ENV NODE_SCHEME http

# Add bash and ca-certs, for quality of life and SSL-related reasons.
RUN apk --no-cache add bash ca-certificates

# Copy the binaries from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

RUN apk add --no-cache --update nodejs nodejs-npm sqlite git supervisor

RUN git clone https://github.com/stakwork/sphinx-relay /relay/

WORKDIR /relay/

RUN git checkout feature/docker

RUN npm install
RUN npm install nodemon --save-dev
RUN npm install express --save-dev
RUN npm install webpack webpack-cli --save-dev

RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python jq git curl
RUN npm install --quiet node-gyp -g

RUN npm install sqlite3 --build-from-source --save-dev
RUN npm install --save-dev sequelize
RUN npm rebuild
RUN npm run tsc
RUN npm cache clean --force

VOLUME /relay/.lnd

COPY ./docker/lnd.conf.sample /relay/.lnd/lnd.conf

RUN shuf -n 6 ./docker/unique-peer.txt >> /relay/.lnd/lnd.conf

RUN git clone https://github.com/stakwork/sphinx-keysend-test/ /sphinx-keysend/
WORKDIR /sphinx-keysend/
RUN git checkout binary
RUN npm install

WORKDIR /relay/

RUN mkdir -p /var/log/supervisor
COPY ./docker/supervisord.conf /etc/supervisord.conf
COPY ./docker/lnd_supervisor.conf /etc/supervisor.d/lnd_supervisor.ini
COPY ./docker/relay_supervisor.conf /etc/supervisor.d/relay_supervisor.ini

ENTRYPOINT [ "./docker/entrypoint.sh" ]
