
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

function currentDateTime(t) {
    const now = new Date();
    let file_ = t.split(".");
    let ex = file_[file_.length - 1];
    return [`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`, ex];
}

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
        let { watch } = req.query;
        let total = 0, data = {};
        if (!watch) return resp.status(200).json({ "status": 200, "message": "video id required!", "data": false });

        watch = await Healper.data_decrypt(decodeURIComponent(watch)); //Healper.data_encrypt()
        total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(watch) }).countDocuments();
        if (total <= 0) return resp.status(200).json({ "status": 200, "message": "file not exists!!", "data": false });
        data = await UsersPostModel.find({ '_id': new mongodb.ObjectId(watch) });
        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = path.join(__dirname, `./../public/video_file/${data[0].video_file}`);
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return resp.status(200).json({ "status": 200, "message": "file not exists!!", "data": false });
        const getFileInfo = await Healper.FileInfo(filepath);
        FileSize = getFileInfo.filesize;
        FileType = getFileInfo.filetype;
        let range = req.headers.range;
        if (!range) return resp.status(200).json({ "status": 200, "message": 'headers range required!', "data": false });
        const CHUNK_SIZE = 10 ** 6; // 1MB chunk size
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, FileSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${FileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        // Respond with the 206 Partial Content status
        resp.writeHead(206, headers);
        // Create a stream to read the video file chunk
        const videoStream = fs.createReadStream(filepath, { start, end });
        // Pipe the video stream to the response
        videoStream.pipe(resp);


        // // let d = await Healper.ReadFile(filepath, 'utf8');
        // const stream = fs.createReadStream(filepath);
        // stream.on('data', (chunk) => {
        //     // resp.writeHead(206, header);
        //     return resp.write(chunk);
        //     // return resp.status(200).json({ "status": 200, "message": "success", "data": chunk });
        // });
        // stream.on("end", () => { resp.end(); });
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

async function NodeJSPlayVideo(req, resp) {
    try {
        console.log(await Healper.getIPAddress());
        // console.log(req.headers['x-forwarded-for']);
        // console.log(req.connection.remoteAddress);
        let data = [];
        resp.render("video", data);
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
                    resolve(resetdata);
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
        let pdata = Healper.PaginationData(data, total, limit, page);
        return resp.status(200).json({ "status": 200, "message": 'success', "data": data, pagination: pdata });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}

async function nodejSPHPpagination(req, resp) {
    try {
        let { name = '', page = 1, limit = 5 } = req.query;
        let queryis = {}, total = 0, from = 0;
        page = parseInt(page) <= 0 ? 1 : parseInt(page);
        limit = parseInt(limit) <= 0 ? 5 : parseInt(limit);
        from = (page - 1) * limit;
        if (name !== '') {
            queryis = {
                $and: [
                    { title: { $regex: new RegExp(name), $options: "i" } },
                ],
            }
        }

        listdata = await UsersPostModel.find(
            queryis
        )
            .select({ _id: 1, userid: 1, content: 1, title: 1, created_at: 1, updated_at: 1 })
            .skip(from)
            .limit(limit)
            .sort({ title: 1 });

        total = await UsersPostModel.find(queryis).countDocuments();
        let docsdata = [];
        listdata.forEach(element => {
            docsdata.push(
                {
                    "_id": element._id,
                    "userid": element.userid,
                    "content": element.content,
                    "title": element.title,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                }
            );
        });

        let pdata = Healper.PaginationData(docsdata, total, limit, page);
        return resp.status(200).json({ "status": 200, "message": 'success', "data": pdata });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}

async function CallModelMethod(req, resp) {
    try {
        let { name = '' } = req.query;
        let usermodel = new UsersModel();
        let data = await usermodel.findByName(name);
        return resp.status(200).json({ "status": 200, "message": 'success', "data": data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}


async function ExportPDF(req, resp) {
    try {
        let { title = '', action = 'preview' } = req.query;

        let data, html, posts, pdfoptions, pdfoutput, filename, filePath;
        let query = {};
        if (title !== "") {
            query = {
                'title': { $regex: new RegExp(title), $options: "i" }
            }
        }
        // console.log(moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss a'));
        posts = await UsersPostModel.find(
            query
        );

        let postset = [];
        let filedata = new Promise((resolve, reject) => {
            let resetdata = [];
            try {
                posts.forEach(async element => {
                    resetdata.push(
                        {
                            "_id": element._id,
                            "userid": element.userid,
                            "title": element.title,
                            "type": element.type,
                            "content": element.content,
                            "thumnail": element.thumnail,
                            "video_file": element.video_file,
                            "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                            "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                            "user_field": element.user_field,
                        }
                    );

                });
                resolve(resetdata);
            } catch (error) {
                reject(error.message);
            }
        });
        await filedata.then((datais) => {
            postset = datais;
        }).catch((error) => {
            throw new Error(error);
        });
        data = { "posts": postset };
        // return resp.render("pdfttem-new", data);

        html = await ejs.renderFile(path.join(__dirname, "./../views/pdfttem-new.ejs"), data, "utf8");

        // html = fs.readFileSync(path.join(__dirname, "./../views/pdfttem.html"), "utf8");
        pdfoptions = {
            // css: {
            //     'thead': {
            //         display: 'table-header-group',
            //     },
            // },
            format: "A4",
            orientation: "portrait",
            border: "4mm",
            header: {
                height: "10mm",
                contents: '<div style="text-align: center;">BIDYUT</div>'
            },
            footer: {
                height: "10mm",
                contents: {
                    first: '<span style="color: black;">{{page}}</span>/<span>{{pages}}</span>',
                    //2: 'Second Page', // Any page number is working. 1-based index
                    default: '<span style="color: black;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                    last: '<span style="color: black;">{{page}}</span>/<span>{{pages}}</span>'
                }
            }
        };
        filename = `${currentDateTime("output.pdf")[0]}.${currentDateTime("output.pdf")[1]}`;

        filePath = `${export_pdf}/${filename}`;
        pdfoutput = {
            html: html,
            data: {
                posts: posts,
            },
            path: filePath,
            type: action == 'create' ? "pdf" : action == 'download' ? 'buffer' : 'buffer', // "stream" || "buffer" || "pdf" ("" defaults to pdf)
        };

        if (action == 'create') {
            if (!fs.existsSync(export_pdf)) {
                // await fs.mkdir(export_pdf, { recursive: true });
                fs.mkdirSync(export_pdf);
            }
            pdf.create(pdfoutput, pdfoptions).then((data) => {
                if (fs.existsSync(`${filePath}`)) {
                    return resp.status(200).json({ status: 200, message: "success", "download": `http://localhost:5000/pdf-files/${filename}` });
                } else {
                    resp.status(200).json({ status: 500, message: "Downloads directory not found", "download": '' })
                }
            }).catch((error) => {
                return resp.status(200).json({ status: 500, 'pdffile': '', message: error.message });
            });
        } else if (action == 'download') {
            const pdfBuffer = await pdf.create(pdfoutput, pdfoptions);
            resp.setHeader("Content-Type", "application/pdf");
            resp.setHeader("Content-Disposition", `attachment; filename="${filename}"`); // Use `attachment;` for download
            return resp.send(pdfBuffer);
        } else {
            const pdfBuffer = await pdf.create(pdfoutput, pdfoptions);
            resp.setHeader("Content-Type", "application/pdf");
            resp.setHeader("Content-Disposition", `inline; filename="${filename}"`); // Use `attachment;` for download
            return resp.send(pdfBuffer);
        }

    } catch (error) {
        return resp.status(200).json({ status: 500, "message": "Failed..!!", "error": error.message });
    }
}

async function IframeTest(req, resp) {
    try {
        let { title = '' } = req.query;
        let data = {};
        return resp.render("test", data);

    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}



module.exports = { FileRD, NodeJSStreams, NodeJScluster, NodeJSAsynchronousFunctioan, CallModelMethod, NodeJSPlayVideo, nodejSPHPpagination, ExportPDF, IframeTest };