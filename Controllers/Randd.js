
const UsersModel = require('../Models/UsersModel');
const UsersPostModel = require('../Models/UsersPostModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const xl_files = path.join(__dirname, './../public/xl-files');
const export_xl = path.join(__dirname, './../public/export-xl');
const export_pdf = path.join(__dirname, './../public/pdf-export');
const ejs = require('ejs');
const mongodb = require('mongodb');
const readXlsxFile = require('read-excel-file/node');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const pdf = require("pdf-creator-node");
const user_files = path.join(__dirname, './../public/users');
const bcrypt = require("bcrypt");
const Healper = require("./Healper");
const mime = require('mime');
const moment = require('moment-timezone');
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: 'onlinemessages0001@gmail.com', pass: 'uellirjjzdfpqyeo' }
});

async function FileRD(req, resp) {
    try {
        if (req.files) {
            let fileIs, filename, filesize, filetype, data = {};
            fileIs = req.files.photo;
            // console.log(fileIs);
            filename = fileIs.name;
            filesize = (fileIs.size / 1024) / 1024;//mb
            filetype = fileIs.mimetype;
            data['filename'] = filename;
            data['filesize'] = parseFloat(filesize.toFixed(2));
            data['filetype'] = filetype;
            return resp.status(200).json({ "status": 200, "message": "success", "data": data });
            // fileIs.mv(`${user_files}/${file_name}`, function (err) {
            //     if (err) {

            //     } else {

            //     }
            // })
        } else {
            return resp.status(200).json({ "status": 200, "message": "file not found", "data": [] });
        }
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": [] });
    }
}


async function NodeJSStreams(req, resp) {
    try {
        let filepath = '', filedata = '';
        filepath = path.join(__dirname, './../public/multifiles/mycon.txt');
        let c = await Healper.FileExists(filepath);
        if (!c) return resp.status(200).json({ "status": 200, "message": "failed", "data": false });
        // let d = await Healper.ReadFile(filepath, 'utf8');
        // return resp.status(200).json({ "status": 200, "message": "success", "data": d });
        const stream = fs.createReadStream(filepath, 'utf-8');
        stream.on('data', (chunk) => {
            return resp.write(chunk);
            // return resp.status(200).json({ "status": 200, "message": "success", "data": chunk });
        });
        stream.on("end", () => { resp.end(); });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}


async function NodeJScluster(req, resp) {
    try {
        return resp.status(200).json({ "status": 200, "message": "success", "data": process.pid });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}


async function NodeJSAsynchronousFunctioan(req, resp) {
    try {
        let { name = '', page = 1, limit = 5 } = req.query;
        let data = [], queryis = {}, total = 0, from = 0;
        page = parseInt(page) <= 0 ? 1 : parseInt(page);
        limit = parseInt(limit) <= 0 ? 5 : parseInt(limit);
        from = (page - 1) * limit;
        if (name !== '') {
            queryis = {
                $or: [
                    { name: { $regex: new RegExp(name), $options: "i" } },
                    { email: { $regex: new RegExp(name), $options: "i" } },
                ],
            }
        }

        listdata = await UsersModel.find(
            queryis
        )
            .select({ _id: 1, name: 1, phone: 1, email: 1, photo: 1, created_at: 1, updated_at: 1 })
            .skip(from)
            .limit(limit)
            .sort({ name: 1 });

        total = await UsersModel.find(
            queryis
        )
            .select({ _id: 1, name: 1, phone: 1, email: 1, photo: 1 })
            .countDocuments();

        let pdata = Healper.PaginationData(total, limit, page);
        let filedata = new Promise((resolve, reject) => {
            let resetdata = [];
            listdata.forEach(async element => {
                try {
                    let filePath = path.join(__dirname, `./../public/users/${element.photo}`);
                    let fdtl = await Healper.FileInfo(filePath);
                    resetdata.push({
                        _id: element._id, name: element.name, phone: element.phone, email: element.email, photo: element.photo, filedetails: fdtl,
                        "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                        "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    });
                    resolve(resetdata)
                } catch (error) {
                    reject(error.message);
                }
            });
        });
        await filedata.then((datais) => {
            data = datais;
        }).catch((error) => {
            throw new Error(error);
        });
        return resp.status(200).json({ "status": 200, "message": 'success', "data": data, pagination: pdata });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}

module.exports = { FileRD, NodeJSStreams, NodeJScluster, NodeJSAsynchronousFunctioan };