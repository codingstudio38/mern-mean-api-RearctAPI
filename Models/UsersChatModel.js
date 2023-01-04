const mongooseConnect = require('../Config/MongooseConfig');
const UsersChat = new mongooseConnect.Schema({
    from_user: { type: 'ObjectId', required: true, trim: true },
    to_user: { type: 'ObjectId', required: true, trim: true },
    message: { type: String, required: false, trim: true, default: null },
    chat_file: { type: String, required: false, trim: true, default: null },
    bookmark: { type: Boolean, required: false, default: false },
    sender: { type: String, required: true, trim: true },
    created_at: { type: Date, required: true, default: new Date() },//Date.now()
    updated_at: { type: Date, required: false, default: null },
});
const UsersChatModel = mongooseConnect.model('users_chat', UsersChat);
module.exports = UsersChatModel;