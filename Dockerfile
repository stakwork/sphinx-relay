FROM node:12-buster-slim AS builder

WORKDIR /relay
RUN mkdir /relay/.lnd
COPY --chown=1000:1000 . .

RUN apt-get update

RUN apt install -y make python-minimal
RUN apt install -y g++ gcc libmcrypt-dev
RUN apt-get -y install git

RUN rm ./package-lock.json

RUN npm install bcrypt
RUN npm install --dev

RUN cp /relay/config/app.json /relay/dist/config/app.json
RUN cp /relay/config/config.json /relay/dist/config/config.json

RUN chown -R 1000:1000 /relay

FROM node:12-buster-slim

USER 1000

WORKDIR /relay

COPY --from=builder /relay .

EXPOSE 3300

ENV NODE_ENV production
ENV NODE_SCHEME http
ENV PORT 3300

CMD [ "node", "/relay/dist/app.js" ]
