const mongooseConnect = require('../Config/MongooseConfig');
const mongoosePaginate = require("mongoose-paginate-v2");
const moment = require('moment-timezone');
const UsersPostSchema = new mongooseConnect.Schema({
    userid: { type: 'ObjectId', required: true, trim: true },//mongoose.Schema.Types.ObjectId
    title: { type: String, required: false, trim: true, default: null },
    type: { type: String, required: false, trim: true, default: null },
    thumnail: { type: String, required: false, trim: true, default: null },
    video_file: { type: String, required: false, trim: true, default: null },
    content: { type: String, required: false, trim: true, default: null },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//Date.now()new Date()
    updated_at: { type: Date, required: false, default: null },
    video_status: { type: Number, required: false, default: 0 },
});
UsersPostSchema.plugin(mongoosePaginate);
const UsersPostModel = mongooseConnect.model('users_posts', UsersPostSchema);
module.exports = UsersPostModel;