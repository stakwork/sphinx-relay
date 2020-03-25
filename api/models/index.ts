import {Sequelize} from 'sequelize-typescript';

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];

const sequelize = new Sequelize({
  ...config,
  logging: process.env.SQL_LOG==='true' ? console.log : false,
  models: [__dirname + '/ts']
})
const models = sequelize.models

export {
  sequelize,
  models,
}
