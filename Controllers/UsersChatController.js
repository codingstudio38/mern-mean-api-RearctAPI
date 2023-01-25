const UsersModel = require('../Models/UsersModel');
const UsersChatModel = require('../Models/UsersChatModel');
const path = require('path');
const fs = require('fs');
const mongodb = require('mongodb');
const chat_files = path.join(__dirname, './../public/chat-files');
function currentDateTime(t) {
    const now = new Date();
    let file_ = t.split(".");
    let ex = file_[file_.length - 1];
    return [`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`, ex];
}
async function deleteIs(id) {
    let deleteis = await UsersChatModel.deleteOne({ _id: new mongodb.ObjectId(id) });
    return deleteis;
}
async function updateIs(id, data) {
    let updateis = await UsersChatModel.findByIdAndUpdate({ _id: new mongodb.ObjectId(id) }, { $set: data }, { new: true, useFindAndModify: false });
    return updateis;
}

async function SaveChat(req, resp) {
    try {
        var { from_user, to_user, message } = req.body;
        if (!from_user) {
            return resp.status(200).json({ 'status': 400, 'message': 'from_user required.' });
        }
        if (!to_user) {
            return resp.status(200).json({ 'status': 400, 'message': 'to_user required.' });
        }

        let NewChat = new UsersChatModel({
            from_user: from_user,
            to_user: to_user,
            message: message,
            sender: from_user,
            bookmark: false,
        });
        NewChat.save(function (err, result) {
            if (err) {
                return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": err });
            }
            else {
                let id = result._id;
                if (req.files) {
                    let fileIs = req.files.chat_file;
                    let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
                    fileIs.mv(`${chat_files}/${file_name}`, function (err) {
                        if (err) {
                            let deleteIS = deleteIs(id);
                            deleteIS.then((data) => {
                                return resp.status(200).json({ "status": 400, "message": "Failed to move file.", "error": err });
                            });
                        } else {
                            let updateIS = updateIs(id, { "chat_file": file_name, updated_at: Date.now() });
                            updateIS.then((data) => {
                                return resp.status(200).json({ "status": 200, "message": "Message has been successfully sended.", "update_data": data, "data": result, "lastid": id });
                            });
                        }
                    })
                } else {
                    return resp.status(200).json({ "status": 200, "message": "Message has been successfully sended.", "update_data": result, "data": result, "lastid": id });
                }
            }
        });

    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!.", "error": error })
    }
}

async function CurrentChatUser(req, resp) {
    try {
        var { from_user, to_user } = req.query;
        if (!from_user) {

            return resp.status(200).json({ "status": 400, "message": "from_user id required" });
        }
        if (from_user.length !== 24) {
            return resp.status(200).json({ "status": 400, "message": "Invalid from_user. from_user id must be 24 characters." });
        }
        if (!to_user) {
            return resp.status(200).json({ "status": 400, "message": "to_user id required" });
        }
        if (to_user.length !== 24) {
            return resp.status(200).json({ "status": 400, "message": "Invalid to_user. to_user id must be 24 characters." });
        }


        let total = await UsersChatModel.find({
            $and: [{ 'from_user': new mongodb.ObjectId(from_user) }, { 'to_user': new mongodb.ObjectId(to_user) }]
        }).countDocuments();

        let from_user_data = await UsersModel.findOne({ _id: { $eq: new mongodb.ObjectId(to_user) } }).select({ name: 1, phone: 1, email: 1, photo: 1 });

        return resp.status(200).json({ "status": 200, "message": "Success", "from_user_data": from_user_data, "total": total, });

    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error });
    }
}


async function ChatList(req, resp) {
    try {
        var { from_user, to_user } = req.query;
        if (!from_user) {

            return resp.status(200).json({ "status": 400, "message": "from_user id required" });
        }
        if (from_user.length !== 24) {
            return resp.status(200).json({ "status": 400, "message": "Invalid from_user. from_user id must be 24 characters." });
        }
        if (!to_user) {
            return resp.status(200).json({ "status": 400, "message": "to_user id required" });
        }
        if (to_user.length !== 24) {
            return resp.status(200).json({ "status": 400, "message": "Invalid to_user. to_user id must be 24 characters." });
        }


        let total = await UsersChatModel.find({
            $and: [{ 'from_user': new mongodb.ObjectId(from_user) }, { 'to_user': new mongodb.ObjectId(to_user) }]
        }).countDocuments();


        // let chat_data = await UsersChatModel.find({ $and: [{ 'from_user': new mongodb.ObjectId(from_user) }, { 'to_user': new mongodb.ObjectId(to_user) }], $or: [{ 'from_user': new mongodb.ObjectId(to_user) }, { 'to_user': new mongodb.ObjectId(from_user) }] });
        // {
        //     $or: [
        //         { $and: [{ 'from_user': new mongodb.ObjectId(from_user) }, { 'to_user': new mongodb.ObjectId(to_user) }] },
        //         { $and: [{ 'from_user': new mongodb.ObjectId(to_user) }, { 'to_user': new mongodb.ObjectId(from_user) }] }
        //     ]
        // }

        let chat_data = await UsersChatModel.aggregate([
            {
                $match: {
                    $or: [
                        { $and: [{ 'from_user': new mongodb.ObjectId(from_user) }, { 'to_user': new mongodb.ObjectId(to_user) }] },
                        { $and: [{ 'from_user': new mongodb.ObjectId(to_user) }, { 'to_user': new mongodb.ObjectId(from_user) }] }
                    ]
                }
            },
            {
                $project: { from_user: 1, to_user: 1, message: 1, chat_file: 1, bookmark: 1, sender: 1, created_at: 1 }
            },
            { $sort: { _id: 1 } }
        ])

        return resp.status(200).json({ "status": 200, "message": "Success", "total": total, "chat_data": chat_data });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error });
    }
}

async function FindChat(req, resp) {
    try {
        var { chatid, from_user, to_user } = req.query;
        if (!chatid) {
            return resp.status(200).json({ "status": 400, "message": "chat id required" });
        }
        if (chatid.length !== 24) {
            return resp.status(200).json({ "status": 400, "message": "Invalid Id. id must be 24 characters." });
        }

        let chat = await UsersChatModel.findOne({ '_id': new mongodb.ObjectId(chatid) }).select({ from_user: 1, to_user: 1, message: 1, chat_file: 1, bookmark: 1, sender: 1, created_at: 1 });
        let total = await UsersChatModel.find({
            $and: [{ 'from_user': new mongodb.ObjectId(from_user) }, { 'to_user': new mongodb.ObjectId(to_user) }]
        }).countDocuments();
        return resp.status(200).json({ "status": 200, "message": "Success", "chat": chat, "total": total });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error });
    }
}



module.exports = { SaveChat, ChatList, CurrentChatUser, FindChat };