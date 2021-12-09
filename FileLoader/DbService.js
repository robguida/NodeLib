require('dotenv').config();
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../configs/' + env + '.js');
let DbService = new Sequelize(config.db.database, config.db.user, config.db.password, config.db);
module.exports = DbService;
