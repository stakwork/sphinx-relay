FROM node:12-buster-slim AS builder

WORKDIR /relay
RUN mkdir /relay/.lnd
RUN touch /relay/connection_string.txt
RUN chmod 777 /relay/connection_string.txt
RUN cp config/app.json dist/config/app.json
RUN cp config/config.json dist/config/config.json
COPY . .

RUN apt-get update

RUN apt install -y make python-minimal
RUN apt install -y g++ gcc libmcrypt-dev

RUN npm install bcrypt
RUN npm install

FROM node:12-buster-slim

USER 1000

WORKDIR /relay

COPY --from=builder /relay .

EXPOSE 3300

ENV NODE_ENV production
ENV NODE_SCHEME http
ENV PORT 3300

CMD [ "node", "/relay/dist/app.js" ]
