const UsersModel = require("../Models/UsersModel");
const UsersChatModel = require("../Models/UsersChatModel");
const path = require("path");
const fs = require("fs");
const mongodb = require("mongodb");
const chat_files = path.join(__dirname, "./../public/chat-files");
const request = require("request");
const { parentPort, Worker } = require("worker_threads");
const moment = require("moment-timezone");
const WebsocketController = require("./WebsocketController");
const Healper = require("./Healper");
function currentDateTime(t) {
    const now = new Date();
    let file_ = t.split(".");
    let ex = file_[file_.length - 1];
    return [
        `${now.getFullYear()}-${now.getMonth() + 1
        }-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`,
        ex,
    ];
}
async function deleteIs(id) {
    let deleteis = await UsersChatModel.deleteOne({
        _id: new mongodb.ObjectId(id),
    });
    return deleteis;
}
async function updateIs(id, data) {
    let updateis = await UsersChatModel.findByIdAndUpdate(
        { _id: new mongodb.ObjectId(id) },
        { $set: data },
        { new: true, useFindAndModify: false }
    );
    return updateis;
}

async function SaveChat(req, resp) {
    try {
        // await UsersChatModel.deleteMany({});
        // let allwsclients = WebsocketController.clients;
        // let data_ = {
        //     type: "datafromws",
        //     code: 4000,
        //     msg: "hello from UsersChatController.js. New message has been seaved.",
        //     clientid: 'userID',
        // };

        // for (let key in allwsclients) {
        //     allwsclients[key].sendUTF(JSON.stringify(data_));
        // }
        var { from_user, to_user, message } = req.body;
        if (!from_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "from_user required." });
        }
        if (!to_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "to_user required." });
        }
        let intid = await UsersChatModel.find({}).countDocuments();
        intid = intid + 1;

        let NewChat = new UsersChatModel({
            from_user: from_user,
            to_user: to_user,
            message: message,
            sender: from_user,
            intid: intid,
            bookmark: false,
            read_status: 0,
        });
        NewChat.save(function (err, result) {
            if (err) {
                return resp
                    .status(400)
                    .json({ status: 400, message: "Failed..!!", error: err });
            } else {
                let id = result._id;
                if (req.files) {
                    let fileIs = req.files.chat_file;
                    let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]
                        }`;
                    fileIs.mv(`${chat_files}/${file_name}`, function (err) {
                        if (err) {
                            let deleteIS = deleteIs(id);
                            deleteIS.then((data) => {
                                return resp
                                    .status(200)
                                    .json({
                                        status: 400,
                                        message: "Failed to move file.",
                                        error: err,
                                    });
                            });
                        } else {
                            let updateIS = updateIs(id, {
                                chat_file: file_name,
                                updated_at: Date.now(),
                            });
                            updateIS.then((data) => {
                                return resp
                                    .status(200)
                                    .json({
                                        status: 200,
                                        message: "Message has been successfully sended.",
                                        update_data: data,
                                        data: result,
                                        lastid: id,
                                    });
                            });
                        }
                    });
                } else {
                    return resp
                        .status(200)
                        .json({
                            status: 200,
                            message: "Message has been successfully sended.",
                            update_data: result,
                            data: result,
                            lastid: id,
                        });
                }
            }
        });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!.", error: error.message });
    }
}

async function CurrentChatUser(req, resp) {
    try {
        var { from_user, to_user } = req.query;
        if (!from_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "from_user id required" });
        }
        if (from_user.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid from_user. from_user id must be 24 characters.",
                });
        }
        if (!to_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "to_user id required" });
        }
        if (to_user.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid to_user. to_user id must be 24 characters.",
                });
        }

        let update = await UsersChatModel.updateMany(
            {
                $and: [
                    { from_user: new mongodb.ObjectId(to_user) },
                    { to_user: new mongodb.ObjectId(from_user) },
                ],
            },
            { $set: { read_status: 1 } },
            { returnDocument: "after" }
        );
        let total = await UsersChatModel.find({
            $and: [
                { from_user: new mongodb.ObjectId(from_user) },
                { to_user: new mongodb.ObjectId(to_user) },
            ],
        }).countDocuments();

        let from_user_data = await UsersModel.findOne({
            _id: { $eq: new mongodb.ObjectId(to_user) },
        }).select({ name: 1, phone: 1, email: 1, photo: 1 });

        return resp
            .status(200)
            .json({
                status: 200,
                message: "Success",
                from_user_data: from_user_data,
                total: total,
                update: update,
            });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function ChatList(req, resp) {
    try {
        var { from_user, to_user, page = 1, limit = 10, start = 0 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        start = (page - 1) * limit;
        // console.log(page, limit, start);
        if (!from_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "from_user id required" });
        }
        if (from_user.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid from_user. from_user id must be 24 characters.",
                });
        }
        if (!to_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "to_user id required" });
        }
        if (to_user.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid to_user. to_user id must be 24 characters.",
                });
        }

        let total = await UsersChatModel.find({
            $and: [
                { from_user: new mongodb.ObjectId(from_user) },
                { to_user: new mongodb.ObjectId(to_user) },
            ],
        }).countDocuments();

        let total_records = await UsersChatModel.find({
            $or: [
                {
                    $and: [
                        { from_user: new mongodb.ObjectId(from_user) },
                        { to_user: new mongodb.ObjectId(to_user) },
                    ],
                },
                {
                    $and: [
                        { from_user: new mongodb.ObjectId(to_user) },
                        { to_user: new mongodb.ObjectId(from_user) },
                    ],
                },
            ],
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
                        {
                            $and: [
                                { from_user: new mongodb.ObjectId(from_user) },
                                { to_user: new mongodb.ObjectId(to_user) },
                            ],
                        },
                        {
                            $and: [
                                { from_user: new mongodb.ObjectId(to_user) },
                                { to_user: new mongodb.ObjectId(from_user) },
                            ],
                        },
                    ],
                },
            },
            {
                $project: {
                    from_user: 1,
                    to_user: 1,
                    message: 1,
                    chat_file: 1,
                    bookmark: 1,
                    sender: 1,
                    intid: 1,
                    created_at: 1,
                },
            },
            { $sort: { intid: -1 } },
            { $skip: start },
            { $limit: limit },

        ]);
        let alldata = chat_data.sort((a, b) => a.intid - b.intid);
        let pagination = Healper.PaginationData(alldata, total_records, limit, page);
        return resp
            .status(200)
            .json({
                status: 200,
                message: "Success",
                total: total,
                // chat_data: alldata,
                pagination: pagination,
            });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function FindChat(req, resp) {
    try {
        var { chatid, from_user, to_user } = req.query;
        if (!chatid) {
            return resp
                .status(200)
                .json({ status: 400, message: "chat id required" });
        }
        if (chatid.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid Id. id must be 24 characters.",
                });
        }

        let chat = await UsersChatModel.findOne({
            _id: new mongodb.ObjectId(chatid),
        }).select({
            from_user: 1,
            to_user: 1,
            message: 1,
            chat_file: 1,
            bookmark: 1,
            sender: 1,
            created_at: 1,
        });
        let total = await UsersChatModel.find({
            $and: [
                { from_user: new mongodb.ObjectId(from_user) },
                { to_user: new mongodb.ObjectId(to_user) },
            ],
        }).countDocuments();
        return resp
            .status(200)
            .json({ status: 200, message: "Success", chat: chat, total: total });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function UpdateUserWeStatus(req, resp) {
    try {
        var { status, userid } = req.body;
        if (!status) {
            return resp.status(200).json({ status: 400, message: "status required" });
        }
        if (!userid) {
            return resp.status(200).json({ status: 400, message: "id required" });
        }

        let updateis = await UsersModel.findByIdAndUpdate(
            { _id: new mongodb.ObjectId(userid) },
            {
                $set: { wsstatus: status },
            },
            { new: true, useFindAndModify: false }
        );
        return resp
            .status(200)
            .json({
                status: 200,
                message: "Successfully wsstatus updated",
                data: updateis,
            });
    } catch (error) {
        return resp
            .status(200)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function NodeJsRequest(req, resp) {
    try {
        var options = {
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/users",
            // headers: { 'Content-type': ' application/x-www-form-urlencoded' },
            // form: {
            //     "token": "mg3it8nmn78ey7l3",
            //     "to": "+918763699746",
            //     "body": "WhatsApp API on UltraMsg.com works good"
            // }
        };

        request(options, function (error, response, body) {
            if (error) return resp.status(200).json({ error: error, body: null });
            return resp.status(200).json({ error: error, body: JSON.parse(body) }); //"response": response,
        });
    } catch (error) {
        return resp.status(500).json({ error: error.message });
    }
}

async function UpdateReadStatus(req, resp) {
    try {
        let { from_id, to_id, status, objid } = req.body;
        if (objid == "") {
            return resp.status(200).json({ status: 400, message: "id required" });
        }
        let updateis = await UsersChatModel.updateOne(
            { _id: new mongodb.ObjectId(objid) },
            { $set: { read_status: status } },
            { returnDocument: "after" }
        ); // returnDocument: 'after', new: true, useFindAndModify: false, returnOriginal: false,

        return resp
            .status(200)
            .json({ status: 200, message: "Success", data: updateis });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function getnoofunseenchat(req, resp) {
    try {
        let { from_id, to_id } = req.body;
        if (from_id == "") {
            return resp
                .status(200)
                .json({ status: 400, message: "from id required" });
        }
        if (to_id == "") {
            return resp.status(200).json({ status: 400, message: "to id required" });
        }
        // let data = await UsersChatModel.aggregate().sort({ '_id': 1 }).facet({
        //     result: [
        //         {
        //             $match: {
        //                 $and: [
        //                     { 'from_user': new mongodb.ObjectId(from_id) },
        //                     { 'to_user': new mongodb.ObjectId(to_id) },
        //                     { 'read_status': 0 }
        //                 ]
        //             }
        //         },
        //         {
        //             $project: { from_user: 1, to_user: 1, message: 1, chat_file: 1, bookmark: 1, sender: 1, created_at: 1, read_status: 1 }
        //         },
        //         // {
        //         //     $limit: 1
        //         // },
        //         // { $sort: { _id: 1 } }
        //     ]
        // }).exec();
        let data = await UsersChatModel.aggregate([
            {
                $match: {
                    $and: [
                        { from_user: new mongodb.ObjectId(from_id) },
                        { to_user: new mongodb.ObjectId(to_id) },
                        { read_status: 0 },
                    ],
                },
            },
            {
                $project: {
                    from_user: 1,
                    to_user: 1,
                    message: 1,
                    chat_file: 1,
                    bookmark: 1,
                    sender: 1,
                    created_at: 1,
                    read_status: 1,
                },
            },
            { $sort: { _id: -1 } },
            {
                $limit: 1,
            },
        ]);
        let total = await UsersChatModel.find({
            $and: [
                { from_user: new mongodb.ObjectId(from_id) },
                { to_user: new mongodb.ObjectId(to_id) },
                { read_status: 0 },
            ],
        }).countDocuments();

        return resp
            .status(200)
            .json({
                status: 200,
                message: "Success",
                total: total,
                data: total > 0 ? data[0] : {},
            });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function withoutworkerthreads(req, resp) {
    try {
        let { p } = req.query;
        let j = 0;
        for (let i = 0; i < 10000000000; i++) {
            j++;
        }
        return resp.status(200).json({ status: 200, data: j, pid: process.pid });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function withworkerthreads(req, resp) {
    try {
        let { p } = req.query;
        const work = new Worker("./Controllers/heavy.js");
        work.on("message", (data) => {
            return resp.status(200).json({ status: 200, data: data });
        });
        work.on("error", (e) => {
            return resp.status(400).json({ status: 400, data: e.message });
        });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

async function testwithworkerthreads(req, resp) {
    try {
        return resp.status(200).json({ status: 200, data: true });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

module.exports = {
    SaveChat,
    ChatList,
    CurrentChatUser,
    FindChat,
    UpdateUserWeStatus,
    NodeJsRequest,
    UpdateReadStatus,
    getnoofunseenchat,
    withoutworkerthreads,
    withworkerthreads,
    testwithworkerthreads,
};
