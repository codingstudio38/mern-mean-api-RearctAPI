const mongooseConnect = require('../Config/MongooseConfig');
const moment = require('moment-timezone');
const UsersChat = new mongooseConnect.Schema({
    from_user: { type: 'ObjectId', required: true, trim: true },//mongoose.Schema.Types.ObjectId
    to_user: { type: 'ObjectId', required: true, trim: true },
    message: { type: String, required: false, trim: true, default: null },
    chat_file: { type: String, required: false, trim: true, default: null },
    from_bookmark: { type: Boolean, required: false, default: false },
    to_bookmark: { type: Boolean, required: false, default: false },
    sender: { type: String, required: true, trim: true },
    read_status: { type: Number, required: false, default: 0 },
    intid: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//Date.now()
    updated_at: { type: Date, required: false, default: null },
});
const UsersChatModel = mongooseConnect.model('users_chat', UsersChat);
module.exports = UsersChatModel;