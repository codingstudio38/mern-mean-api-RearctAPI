const mongooseConnect = require('../Config/MongooseConfig');
const mongoosePaginate = require("mongoose-paginate-v2");
const UsersPostSchema = new mongooseConnect.Schema({
    userid: { type: 'ObjectId', required: true, trim: true },
    title: { type: String, required: false, trim: true, default: null },
    type: { type: String, required: false, trim: true, default: null },
    content: { type: String, required: false, trim: true, default: null },
    created_at: { type: Date, required: true, default: Date.now() },
    updated_at: { type: Date, required: false, default: null },
});
UsersPostSchema.plugin(mongoosePaginate);
const UsersPostModel = mongooseConnect.model('users_posts', UsersPostSchema);
module.exports = UsersPostModel;