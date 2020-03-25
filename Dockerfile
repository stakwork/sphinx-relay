FROM node:8
RUN apt-get update
RUN apt-get install -f sqlite3
USER node
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
WORKDIR /home/node
COPY package.json .
RUN npm install
RUN npm install -g nodemon --save-dev
RUN npm install -g express --save-dev
RUN npm install -g webpack webpack-cli --save-dev
RUN npm install -g sqlite3 --build-from-source --save-dev
RUN npm install -g --save-dev sequelize
RUN npm rebuild
COPY . .