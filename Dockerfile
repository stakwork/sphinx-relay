FROM golang:1.13-alpine as builder
LABEL maintainer="gonzaloaune@stakwork.com"

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
&&  make install tags="signrpc walletrpc chainrpc invoicesrpc experimental"

# Start a new, final image.
FROM alpine as final

EXPOSE 80
EXPOSE 9735/tcp
EXPOSE 9735/udp
EXPOSE 10009/tcp
EXPOSE 10009/udp

ENV NODE_ALIAS mynodealias
ENV NODE_ENV production

# Add bash and ca-certs, for quality of life and SSL-related reasons.
RUN apk --no-cache add \
    bash \
    ca-certificates

# Copy the binaries from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

RUN apk add --update nodejs nodejs-npm sqlite git supervisor

RUN git clone https://github.com/stakwork/sphinx-relay /relay/
RUN cd /relay && git checkout feature/docker

WORKDIR /relay/

RUN npm install
RUN npm install nodemon --save-dev
RUN npm install express --save-dev
RUN npm install webpack webpack-cli --save-dev

RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python
RUN npm install --quiet node-gyp -g

RUN npm install sqlite3 --build-from-source --save-dev
RUN npm install --save-dev sequelize
RUN npm rebuild
RUN npm run tsc

VOLUME /relay/.lnd

COPY ./lnd.conf.sample /relay/.lnd/lnd.conf

RUN mkdir -p /var/log/supervisor
COPY ./supervisord.conf /etc/supervisord.conf
COPY ./lnd_supervisor.conf /etc/supervisor.d/lnd_supervisor.ini
COPY ./relay_supervisor.conf /etc/supervisor.d/relay_supervisor.ini
CMD ["/usr/bin/supervisord"]
