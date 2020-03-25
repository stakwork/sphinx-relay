"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];
const sequelize = new sequelize_typescript_1.Sequelize(Object.assign(Object.assign({}, config), { logging: process.env.SQL_LOG === 'true' ? console.log : false, models: [__dirname + '/ts'] }));
exports.sequelize = sequelize;
const models = sequelize.models;
exports.models = models;
//# sourceMappingURL=index.js.map