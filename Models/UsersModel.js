const mongooseConnect = require('./../Config/MongooseConfig');
const mongoosePaginate = require("mongoose-paginate-v2");
const jwt = require('jsonwebtoken');
const mongodb = require('mongodb');
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
    created_at: { type: Date, required: true, default: Date.now() },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
UsersSchema.methods.generateAuthToken = async function () {
    try {
        const _token = jwt.sign({ _id: new mongodb.ObjectId(this._id) }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: _token })
        await this.save();
        return _token;
    } catch (error) {
        return error;
    }
}
UsersSchema.methods.UserNameEmailPhone = async function () {
    try {
        let data = await this.findOne()
            .select({ name: 1, photo: 1, email: 1 }).sort({ name: 1 });
        return data;
    } catch (error) {
        throw error;
    }
}
UsersSchema.plugin(mongoosePaginate);
const UsersModel = mongooseConnect.model('users', UsersSchema);
module.exports = UsersModel;