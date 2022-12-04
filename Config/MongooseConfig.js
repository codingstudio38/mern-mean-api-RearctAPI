const database = process.env.DATABASE_NAME;
const mongooseConnect = require('mongoose');
mongooseConnect.connect(database);
module.exports = mongooseConnect;
