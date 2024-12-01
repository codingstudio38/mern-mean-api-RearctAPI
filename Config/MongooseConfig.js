const database = process.env.DATABASE_NAME;
const mongooseConnect = require('mongoose');
mongooseConnect.set('strictQuery', false);
mongooseConnect.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error:', err.message));
module.exports = mongooseConnect;  
