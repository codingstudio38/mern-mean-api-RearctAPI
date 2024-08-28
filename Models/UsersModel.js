const mongooseConnect = require('./../Config/MongooseConfig');
const mongoosePaginate = require("mongoose-paginate-v2");
const jwt = require('jsonwebtoken');
const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersSchema = new mongooseConnect.Schema({
    name: { type: String, required: false, trim: true, default: "auto generate name by mongo" },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    photo: { type: String, required: false, trim: true, default: null },
    password: { type: String, required: true },
    wsstatus: { type: Number, required: false, default: 0 },
    tokens: [{
        token: {
            type: String, required: true
        }
    }],
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
UsersSchema.methods.generateAuthToken = async function () {
    try {
        const _token = jwt.sign({ _id: new mongodb.ObjectId(this._id) }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: _token })
        await this.save();
        return _token;
    } catch (error) {
        throw new Error(error);
    }
}
UsersSchema.methods.findByName = async function (name) {
    try {
        let queryis = {};
        if (name !== '') {
            queryis = {
                $or: [
                    { name: { $regex: new RegExp(name), $options: "i" } },
                ],
            }
        }
        return await mongoose.model('users').find(queryis);
    } catch (error) {
        throw new Error(error);
    }
};
UsersSchema.plugin(mongoosePaginate);
const UsersModel = mongooseConnect.model('users', UsersSchema);
module.exports = UsersModel;