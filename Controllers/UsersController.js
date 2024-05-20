const UsersModel = require('./../Models/UsersModel');
const UsersPostModel = require('./../Models/UsersPostModel');
const path = require('path');
const fs = require('fs');
const user_files = path.join(__dirname, './../public/users');
const mongodb = require('mongodb');
const bcrypt = require("bcrypt");
const moment = require('moment-timezone');
function currentDateTime(t) {
    const now = new Date();
    let file_ = t.split(".");
    let ex = file_[file_.length - 1];
    return [`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`, ex];
}


async function deleteIs(id) {
    let deleteis = await UsersModel.deleteOne({ _id: new mongodb.ObjectId(id) });
    return deleteis;
}
async function updateIs(id, data) {
    let updateis = await UsersModel.updateOne({ _id: new mongodb.ObjectId(id) }, { $set: data });
    return updateis;
}
async function findUser(id) {
    let data = await UsersModel.findById({ _id: new mongodb.ObjectId(id) });
    return data;
}
async function Allusers(req, resp) {
    let { page, size } = req.query;
    if (!page) {
        page = 1;
    }
    if (!size) {
        size = 5;
    }
    let limit = parseInt(size);
    UsersModel.paginate({}, { page: page, limit: limit })
        .then((result) => {
            let newlist = [];
            let docsdata = result.docs;
            docsdata.forEach(element => {
                newlist.push(
                    {
                        "_id": element._id,
                        "name": element.name,
                        "phone": element.phone,
                        "email": element.email,
                        "photo": element.photo,
                        "password": element.password,
                        "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                        "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                        "__v": element.__v,
                        "wsstatus": element.wsstatus,
                        "tokens": element.tokens,
                    }
                );
            });
            return resp.status(200).json({ "status": 200, "message": "Data successfully fetched.", "list": result, 'newlist': newlist });
        })
        .catch((error) => {
            return resp.status(400).json({ "status": 400, "message": "Failed to fetched.", "error": error });
        });
}

async function UsersList(req, resp) {
    try {
        var { } = req.query;
        let list;
        // list = await UsersModel.find({});
        list = await UsersModel.aggregate().sort({ 'name': 1 })
            .facet({
                result: [
                    // {
                    //     $match: {'name': { $regex: new RegExp('bidy'), $options: "i" } }
                    // },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "email": 1,
                            "phone": 1,
                            "created_at": 1,
                            "updated_at": 1,
                        }
                    }
                ],
            })
            .exec();
        let resetdata = [];
        let docsdata = list[0].result;
        docsdata.forEach(element => {
            resetdata.push(
                {
                    "_id": element._id,
                    "name": element.name,
                    "email": element.email,
                    "phone": element.phone,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                }
            );
        });
        return resp.status(200).json({ "status": 200, "message": "succes", "error": '', 'list': resetdata });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}

async function UserDetail(req, resp) {
    let { id } = req.query;
    if (!id) {
        return resp.status(200).json({ 'status': 400, 'message': 'id required.' });
    }
    try {
        let data = await UsersModel.findById({ _id: new mongodb.ObjectId(id) });
        if (data == null) {
            return resp.status(200).json({ "status": 400, "message": "User record not found..!!", "user": data });
        } else {
            return resp.status(200).json({ "status": 200, "message": "Successfully fetched.", "user": data });
        }
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!.", "error": error.message })
    }
}


async function CreateNew(req, resp) {
    try {
        var { name, phone, email, password } = req.body;
        if (!name) {
            return resp.status(200).json({ 'status': 400, 'message': 'name required.' });
        }
        if (!phone) {
            return resp.status(200).json({ 'status': 400, 'message': 'phone no required.' });
        }
        if (!email) {
            return resp.status(200).json({ 'status': 400, 'message': 'email id required.' });
        }
        if (!password) {
            return resp.status(200).json({ 'status': 400, 'message': 'password required.' });
        }

        const email_check = await UsersModel.find({ email: { $eq: email } }).countDocuments();
        if (email_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Email Id already exist. Try different." });
        }
        const phone_check = await UsersModel.find({ phone: { $eq: phone } }).countDocuments();
        if (phone_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Phone no already exist. Try different.", "total": phone_check });
        }
        let salt = await bcrypt.genSalt(10);//genSaltSync(10)
        let password_ = await bcrypt.hash(password, salt);//hashSync(password,salt);
        let NewUser = new UsersModel({
            name: name,
            phone: phone,
            email: email,
            password: password_,
        });
        NewUser.save(function (err, result) {
            if (err) {
                return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": err.message });
            }
            else {
                let id = result._id;
                if (req.files) {
                    let fileIs = req.files.photo;
                    let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
                    fileIs.mv(`${user_files}/${file_name}`, function (err) {
                        if (err) {
                            let deleteIS = deleteIs(id);
                            deleteIS.then((data) => {
                                return resp.status(200).json({ "status": 400, "message": "Failed to move file.", "error": err.message });
                            });
                        } else {
                            let updateIS = updateIs(id, { "photo": file_name, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') });
                            updateIS.then((data) => {
                                let useris = findUser(id);
                                useris.then((user) => {
                                    return resp.status(200).json({ "status": 200, "message": "Successfully created.", "data": user });
                                });
                            });
                        }
                    })
                } else {
                    return resp.status(200).json({ "status": 200, "message": "Successfully created.", "data": result });
                }
            }
        });

    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!.", "error": error.message })
    }
}



function removeoldFiles(path) {
    if (fs.existsSync(`${path}`)) {
        fs.unlinkSync(`${path}`, (err) => {
            if (err) {
                return "New file successfully uploaded. Failed to remove old file..!!";
            }
        });
        return "New file successfully uploaded. Old file successfully removed.";
    } else {
        return 'New file successfully uploaded. Old file directory not found.';
    }
}



async function UpdateUser(req, resp) {
    var oldfile_sms, updated_data;
    var { name, phone, email, password, oldphoto, id } = req.body;
    if (!name) {
        return resp.status(200).json({ 'status': 400, 'message': 'name required.' });
    }
    if (!phone) {
        return resp.status(200).json({ 'status': 400, 'message': 'phone no required.' });
    }
    if (!email) {
        return resp.status(200).json({ 'status': 400, 'message': 'email id required.' });
    }
    if (!oldphoto) {
        return resp.status(200).json({ 'status': 400, 'message': 'old photo name required.' });
    }
    if (!id) {
        return resp.status(200).json({ 'status': 400, 'message': 'id required.' });
    }
    try {


        const email_check = await UsersModel.find({ $and: [{ _id: { $ne: new mongodb.ObjectId(id) } }, { email: { $eq: email } }] }).countDocuments();
        if (email_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Email Id already exist. Try different." });
        }
        const phone_check = await UsersModel.find({ $and: [{ _id: { $ne: new mongodb.ObjectId(id) } }, { phone: { $eq: phone } }] }).countDocuments();
        if (phone_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Phone no already exist. Try different.", "total": phone_check });
        }

        let salt = await bcrypt.genSalt(10);
        let pass = await bcrypt.hash(password, salt);
        if (req.files) {
            let fileIs = req.files.photo;
            let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
            fileIs.mv(`${user_files}/${file_name}`, function (err) {
                if (err) {
                    return resp.status(400).json({ 'status': 400, "error_": err.message, "message": "Failed to move file..!!" });
                } else {
                    oldfile_sms = removeoldFiles(`${user_files}/${oldphoto}`);
                    if (!password) {
                        updated_data = { "name": name, "phone": phone, "email": email, "photo": file_name, "updated_at": Date.now() };
                    } else {
                        updated_data = { "name": name, "phone": phone, "email": email, "password": pass, "photo": file_name, "updated_at": Date.now() };
                    }
                    let updateIS = updateIs(id, updated_data);
                    updateIS.then((data) => {
                        let useris = findUser(id);
                        useris.then((user) => {
                            return resp.status(200).json({ 'status': 200, "message": "Successfully updated.", "user": user, "file": oldfile_sms });
                        });
                    });
                }
            })
        } else {
            if (!password) {
                updated_data = { "name": name, "phone": phone, "email": email, "updated_at": Date.now() };
            } else {
                updated_data = { "name": name, "phone": phone, "email": email, "password": pass, updated_at: Date.now() };
            }
            let updateIS = updateIs(id, updated_data);
            updateIS.then((data) => {
                let useris = findUser(id);
                useris.then((user) => {
                    return resp.status(200).json({ 'status': 200, "message": "Successfully updated.", "user": user });
                });
            });
        }
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}




async function DeleteUser(req, resp) {
    try {
        if (req.query.id) {
            let data = await UsersModel.deleteOne({ _id: new mongodb.ObjectId(req.query.id) });
            let data_post = await UsersPostModel.deleteMany({ 'userid': { $eq: new mongodb.ObjectId(req.query.id) } });
            return resp.status(200).json({ "status": 200, "message": "Record has been successfully deleted.", "data": data });
        } else {
            return resp.status(200).json({ "status": 400, "message": "Failed. User Id required." });
        }
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}


async function UserLogin(req, resp) {
    var { email_id, password } = req.body;
    try {
        if (!email_id) {
            return resp.status(200).json({ "status": 400, "message": "Email id required..!!" });
        }
        const user = await UsersModel.findOne({ email: email_id });
        if (user == null) {
            return resp.status(200).json({ "status": 400, "message": "User does not exist" });
        } else {
            const validPassword = await bcrypt.compare(password, user.password);
            if (validPassword) {
                const token = await user.generateAuthToken();
                const U = { 'email': user.email, 'name': user.name, 'phone': user.phone, 'photo': user.photo, '_id': user._id, 'token': token, "token_type": "Bearer" }
                return resp.status(200).json({ "status": 200, "message": "Successfully logged in.", "user": U });
            } else {
                return resp.status(200).json({ "status": 400, "message": "Invalid Password" });
            }
        }
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }

}
async function UserLogout(req, resp) {
    try {
        // req.user.tokens = req.user.tokens.filter((items, index) => {
        //     return items.token !== req.token;
        // }) 
        req.user.tokens = [];
        await req.user.save();
        return resp.status(200).json({ "status": 200, "message": "Successfully logged out." });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}
async function DownloadFile(req, resp) {
    const filePath = user_files + "/" + req.params.filename;
    if (fs.existsSync(`${filePath}`)) {
        resp.download(filePath, req.params.filename,
            (err) => {
                if (err) {
                    resp.status(200).json({
                        error: err,
                        msg: "Problem downloading the file"
                    })
                }
            });
    } else {
        resp.status(404).json({ status: 404, msg: "Downloads directory not found" })
    }
}

async function UserChatList(req, resp) {
    try {
        var { name } = req.query;
        if (!name) {
            let data = await UsersModel.find().select({ _id: 1, name: 1, photo: 1, wsstatus: 1 }).sort({ name: 1 });
            return resp.status(200).json({ "status": 200, "message": "Success", "data": data });
        }
        if (name == "") {
            let data = await UsersModel.find().select({ _id: 1, name: 1, photo: 1, wsstatus: 1 }).sort({ name: 1 });
            return resp.status(200).json({ "status": 200, "message": "Success", "data": data });
        }
        let data = await UsersModel.aggregate([{ $match: { 'name': { $regex: new RegExp(name), $options: "i" } } }, { $project: { _id: 1, name: 1, photo: 1 } }]);
        return resp.status(200).json({ "status": 200, "message": "Success", "data": data });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}


async function GetDataFromModal(req, resp) {
    try {
        let { name } = req.query;
        let totalusers, data;
        totalusers = await UsersModel.find().countDocuments();
        data = await UsersModel.UserNameEmailPhone();
        return resp.status(200).json({ "status": 200, "message": "Success", "data": data, "total": totalusers });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}

async function UpdateUserWsStatus(userid, Status) {
    try {
        if (userid == "") {
            console.log('ws user id required');
            return 0;
        }
        let updateis = await UsersModel.updateOne({ _id: userid }, { $set: { wsstatus: Status } });
        console.log({ "status": 200, "message": "Success ws status updated" });//, "data": updateis 
        return 1;
    } catch (error) {
        console.log({ "status": 400, "message": "Failed to update es status" });//, "error": error.message 
        return 0;
    }
}

async function NumberofActiveUserWs(req, resp) {
    try {
        var { status } = req.body;
        let data = await UsersModel.find({ wsstatus: status });
        return resp.status(200).json({ "status": 200, "message": "Success", data: data });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}

module.exports = { Allusers, CreateNew, UpdateUser, DeleteUser, UserDetail, UserLogin, UserLogout, DownloadFile, UserChatList, UsersList, GetDataFromModal, UpdateUserWsStatus, NumberofActiveUserWs };