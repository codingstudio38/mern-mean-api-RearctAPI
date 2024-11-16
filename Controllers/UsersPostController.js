const UsersModel = require('../Models/UsersModel');
const UsersPostModel = require('../Models/UsersPostModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const xl_files = path.join(__dirname, './../public/xl-files');
const export_xl = path.join(__dirname, './../public/export-xl');
const export_pdf = path.join(__dirname, './../public/pdf-export');
const thumbnail_path = path.join(__dirname, './../public/thumbnail');
const postvideo_path = path.join(__dirname, './../public/video_file');
const Healper = require("./Healper");
const ejs = require('ejs');
const mongodb = require('mongodb');
const readXlsxFile = require('read-excel-file/node');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const pdf = require("pdf-creator-node");
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { response } = require('express');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: 'onlinemessages0001@gmail.com', pass: 'kyirsizurahpppbh' }
});
function currentDateTime(t) {
    const now = new Date();
    let file_ = t.split(".");
    let ex = file_[file_.length - 1];
    return [`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`, ex];
}

async function ImportUserPostExcel(req, resp) {
    try {
        if (req.files) {
            let fileIs = req.files.xl_file;
            let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
            fileIs.mv(`${xl_files}/${file_name}`, function (err) {
                if (err) {
                    return resp.status(400).json(err);
                } else {
                    let exFile = `${xl_files}/${file_name}`;
                    readXlsxFile(exFile).then((rows) => {
                        rows.shift();
                        let data = new Array();
                        rows.forEach((row) => {
                            data.push({ userid: row[0], title: row[1], type: row[2], content: row[3] });
                        });
                        UsersPostModel.insertMany(data).then((respons) => {
                            return resp.status(200).json(respons);
                        }).catch((error) => {
                            return resp.status(400).json(error);
                        })
                    })
                }
            })
        } else {
            return resp.status(400).json({ 'status': 'failed..!', 'message': "Please upload an excel file!" });
        }
    } catch (error) {
        resp.status(400).json(error);
    }
}

async function UsersPostList(req, resp) {
    try {
        var { page, size, data, userid = '', skip, limit } = req.query;

        if (!page) {
            page = 1;
        }
        if (parseInt(page) <= 0) {
            page == 1;
        }
        if (!size) {
            size = 5;
        }
        if (parseInt(size) <= 0) {
            size == 5;
        }
        page = parseInt(page);
        limit = parseInt(size);
        skip = (page - 1) * limit;
        let query = {};
        if (userid !== "") {
            query = {
                result: [
                    { $match: { userid: new mongodb.ObjectId(userid) } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $addFields: {
                            userid: {
                                $toObjectId: "$userid"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userid',
                            foreignField: '_id',
                            as: 'user_field',
                        }
                    },
                    { $unwind: '$user_field' },
                    {
                        "$project": {
                            "thumnail": 1,
                            "video_file": 1,
                            "_id": 1,
                            "userid": 1,
                            "title": 1,
                            "type": 1,
                            "content": 1,
                            "created_at": 1,
                            'updated_at': 1,
                            "user_field.name": 1,
                            "user_field.photo": 1
                        }
                    }
                ],
                totalCount: [
                    { $match: { userid: new mongodb.ObjectId(userid) } },
                    { $count: 'total' },
                ]
            };
        } else {
            query = {
                result: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $addFields: {
                            userid: {
                                $toObjectId: "$userid"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userid',
                            foreignField: '_id',
                            as: 'user_field',
                        }
                    },
                    { $unwind: '$user_field' },
                    {
                        "$project": {
                            "thumnail": 1,
                            "video_file": 1,
                            "_id": 1,
                            "userid": 1,
                            "title": 1,
                            "type": 1,
                            "content": 1,
                            "created_at": 1,
                            'updated_at': 1,
                            "user_field.name": 1,
                            "user_field.photo": 1
                        }
                    }
                ],
                totalCount: [
                    { $count: 'total' },
                ]
            };
        }
        data = await UsersPostModel.aggregate().sort({ 'created_at': -1 })
            .facet(query)
            .exec();
        var totalDocs = parseInt(data[0].totalCount[0].total);
        let c = CalculatData(totalDocs, limit, page);
        let resetdata_is = [];
        let docsdata = data[0].result;

        let filedata = new Promise((resolve, reject) => {
            let resetdata = [];
            try {
                docsdata.forEach(async element => {
                    let thumnailPath = path.join(__dirname, `./../public/thumbnail/${element.thumnail}`);
                    let fdtl = await Healper.FileInfo(thumnailPath);
                    fdtl['file_path'] = `${process.env.APP_URL}post-thumbnail/${element.thumnail ? element.thumnail : ''}`;
                    let video_filePath = path.join(__dirname, `./../public/video_file/${element.video_file}`);
                    let fdtl__ = await Healper.FileInfo(video_filePath);
                    fdtl__['file_path'] = `${process.env.APP_URL}post-videos/${element.video_file ? element.video_file : ''}`;
                    let user_filePath = path.join(__dirname, `./../public/users/${element.user_field.photo}`);
                    let user_file = await Healper.FileInfo(user_filePath);
                    user_file['file_path'] = `${process.env.APP_URL}users-file/${element.user_field.photo ? element.user_field.photo : ''}`;
                    resetdata.push(
                        {
                            thumnail_filedetails: fdtl,
                            video_file_filedetails: fdtl__,
                            "_id": element._id,
                            "userid": element.userid,
                            "user_filedetails": user_file,
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
            resetdata_is = datais;
        }).catch((error) => {
            throw new Error(error);
        });

        let res = {
            docs: resetdata_is,
            totalDocs: totalDocs,
            limit: limit,
            page: page,
            pagingCounter: c.pagingCounter,
            nextPage: c.nextPage,
            totalPages: c.totalpage,
            hasNextPage: c.hasNextPage,
            hasPrevPage: c.hasPrevPage,
            prevPage: c.prevPage,
            first_page_link: 1,
            last_page_link: c.totalpage,
            prev_page_link: c.prevPage,
            next_page_link: c.nextPage,
            page_links: c.page_links
        }
        return resp.status(200).json({ "status": 200, "message": "Data successfully fetched.", "list": res });
    } catch (error) {
        return resp.status(500).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}

function CalculatData(total, limit, page) {
    var totalpage, nextPage, pagingCounter, hasNextPage, hasPrevPage, prevPage, page_links, skip;
    skip = (page - 1) * limit;
    if (total % limit === 0) {
        totalpage = total / limit;
    } else {
        let num = total / limit + " ";
        let num_ = num.split(".");
        totalpage = parseInt(num_[0]) + 1;
    }
    nextPage = parseInt(page + 1);
    pagingCounter = skip + 1;
    if (page * limit < total) {
        hasNextPage = true;
        nextPage = nextPage;
    } else {
        hasNextPage = false;
        nextPage = null;
    }
    if (page <= 1) {
        hasPrevPage = false;
        prevPage = null;
    } else {
        hasPrevPage = true;
        prevPage = parseInt(page - 1);
    }
    page_links = [];
    for (let i = 1; i <= totalpage; i++) {
        if (page == i) {
            page_links.push({ 'link': i, active: true });
        } else {
            page_links.push({ 'link': i, active: false });
        }
    }
    return { 'totalpage': totalpage, 'nextPage': nextPage, 'pagingCounter': pagingCounter, 'hasNextPage': hasNextPage, 'hasPrevPage': hasPrevPage, 'prevPage': prevPage, 'page_links': page_links };

}

async function UsersPost(req, resp) {
    var data;
    let { userid } = req.query;
    if (userid) {
        data = await UsersPostModel.find({ "userid": userid });
        return resp.status(200).json(data);
    } else {
        return resp.status(400).json({ 'status': 'failed..!', 'message': 'id required.' });
    }
}

async function GetPostById(req, resp) {
    let { rowid } = req.params;//req.query;
    let user = {}, total_user = 0, data = {}, total = 0;
    try {
        total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) }).countDocuments()
        data = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) });
        if (total > 0) {
            data = {
                _id: data[0]._id,
                userid: data[0].userid,
                title: data[0].title,
                type: data[0].type,
                thumnail: data[0].thumnail,
                video_file: data[0].video_file,
                content: data[0].content,
                created_at: data[0].created_at,
                updated_at: data[0].updated_at,
                __v: data[0].__v
            };
            let thumnailPath = path.join(__dirname, `./../public/thumbnail/${data.thumnail}`);
            let fdtl = await Healper.FileInfo(thumnailPath);
            fdtl['file_path'] = `${process.env.APP_URL}post-thumbnail/${data.thumnail ? data.thumnail : ''}`;

            let video_filePath = path.join(__dirname, `./../public/video_file/${data.video_file}`);
            let fdtl__ = await Healper.FileInfo(video_filePath);
            fdtl__['file_path'] = `${process.env.APP_URL}post-videos/${data.video_file ? data.video_file : ''}`;

            data['thumnail_filedetails'] = fdtl;
            data['video_file_filedetails'] = fdtl__;

            total_user = await UsersModel.find({ '_id': new mongodb.ObjectId(data.userid) }).countDocuments();
            user = await UsersModel.find({ '_id': new mongodb.ObjectId(data.userid) });

            if (total_user > 0) {
                user = user[0];
                let user_filePath = path.join(__dirname, `./../public/users/${user.photo}`);
                let user_file = await Healper.FileInfo(user_filePath);
                user_file['file_path'] = `${process.env.APP_URL}users-file/${user.photo ? user.photo : ''}`;
                data['user_field'] = {
                    "name": user.name,
                    "photo": user.photo
                };
                data['user_filedetails'] = user_file;
            } else {
                data['user_field'] = {
                    "name": "",
                    "photo": ""
                };
                data['user_filedetails'] = {
                    "filetype_st": "",
                    "filetype": "",
                    "filesize": "",
                    "file_path": ""
                };
            }
        }
        return resp.status(200).json({ "status": 200, "message": "Success", "error": '', 'result': data, "total": total });
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}

async function DeletePostById(req, resp) {
    let { rowid } = req.params;//req.query;
    try {
        let total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) }).countDocuments()
        let data = await UsersPostModel.deleteOne({ '_id': new mongodb.ObjectId(rowid) });
        return resp.status(200).json({ "status": 200, "message": "Successfully deleted", "error": '', 'result': data, "total": total });
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}


async function SaveUsersPost(req, resp) {
    let { user, title, content } = req.body;
    var thumbnail_path_and_name = '', saveid = 0;
    // const session = await mongoose.startSession();
    try {
        // session.startTransaction();
        const newPost = new UsersPostModel({
            userid: user,
            title: title,
            type: 0,
            content: content,
        });
        const savedPost = await newPost.save();
        saveid = savedPost._id;
        if (req.files) {
            let fileIs = req.files.thumphoto;
            let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
            thumbnail_path_and_name = `${thumbnail_path}/${file_name}`;
            await fileIs.mv(`${thumbnail_path}/${file_name}`, function (err) {
                if (err) {
                    throw new Error(err);
                }
            });
            const update = await UsersPostModel.findByIdAndUpdate({ _id: new mongodb.ObjectId(saveid) }, { "thumnail": file_name, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') }, { new: true });
            // await session.commitTransaction();
            // session.endSession();
            return resp.status(200).json({ "status": 200, "message": "Post has been successfully saved and file updated.", "error": false, 'result': update });
        } else {
            // await session.commitTransaction();
            // session.endSession();
            return resp.status(200).json({ "status": 200, "message": "Post has been successfully saved.", "error": false, 'result': savedPost });
        }
    } catch (error) {
        // await session.abortTransaction();
        await UsersPostModel.deleteOne({ _id: new mongodb.ObjectId(saveid) })
        await Healper.DeleteFile(thumbnail_path_and_name);
        let m = thumbnail_path_and_name == "" ? "Failed..!! data has been deleted!" : "Failed..!! data and file has been deleted!";
        return resp.status(500).json({ status: 500, "message": m, "error": error.message });
    }
}


async function UpdateUserPost(req, resp) {
    let { rowid, userid, title, content } = req.body;
    let dataObj, total, olddata;
    var thumbnail_path_and_name = '';
    try {
        dataObj = { 'userid': userid, 'title': title, 'content': content, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') };
        total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) }).countDocuments();
        if (total <= 0) {
            return resp.status(200).json({ "status": 400, "message": "Record not found.", "error": '', 'result': '', 'total': total });
        }
        olddata = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) });
        olddata = olddata[0]
        let _update = await UsersPostModel.findByIdAndUpdate({ _id: new mongodb.ObjectId(rowid) }, { $set: dataObj }, { new: true, useFindAndModify: false });
        if (req.files) {
            let fileIs = req.files.thumphoto;
            let file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
            thumbnail_path_and_name = `${thumbnail_path}/${file_name}`;
            await fileIs.mv(`${thumbnail_path}/${file_name}`, function (err) {
                if (err) {
                    throw new Error(err);
                }
            });
            const update_ = await UsersPostModel.findByIdAndUpdate({ _id: new mongodb.ObjectId(rowid) }, { "thumnail": file_name, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') }, { new: true });
            let old_thumbnail_path_and_name = thumbnail_path + "/" + olddata.thumnail;
            await Healper.DeleteFile(old_thumbnail_path_and_name);//delete old file
            return resp.status(200).json({ "status": 200, "message": "Post has been successfully updated and file updated.", "error": false, 'result': update_ });
        } else {
            return resp.status(200).json({ "status": 200, "message": "Post has been successfully updated.", "error": '', 'result': _update, 'total': total });
        }
    } catch (error) {
        await Healper.DeleteFile(thumbnail_path_and_name);//delete old file
        let m = thumbnail_path_and_name == "" ? "Failed..!! failed to update!" : "Failed..!! failed to update and new file deleted!";
        return resp.status(500).json({ status: 500, "message": m, "error": error.message });
    }
}
// https://www.grapecity.com/blogs/how-to-generate-excel-spreadsheets-in-nodejs
// https://pspdfkit.com/blog/2021/how-to-generate-pdf-from-html-with-nodejs/

async function ExportUserPostExcel(req, resp) {
    try {


        const allPost = await UsersPostModel.find();
        const workSheetColumnName = [
            "USER ID", "TITLE", "TYPE", "CONTENT"
        ];
        const workSheetName = "UsersPost";
        let filename = `${currentDateTime("users-post.xlsx")[0]}.${currentDateTime("users-post.xlsx")[1]}`
        const filePath = `${export_xl}/${filename}`;
        const data = allPost.map((post) => {
            return [post.userid, post.title, post.type, post.content];
        })
        const workBook = xlsx.utils.book_new();
        const workBookData = [
            workSheetColumnName,
            ...data
        ];
        const workSheet = xlsx.utils.aoa_to_sheet(workBookData);
        xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
        xlsx.writeFile(workBook, filePath);
        if (fs.existsSync(`${filePath}`)) {
            return resp.download(filePath, filename,
                (err) => {
                    if (err) {
                        return resp.status(200).json({
                            status: 200,
                            error: err.message,
                            message: "Problem downloading the file"
                        })
                    } else {
                        DeleteFile(filePath).then((resdata) => {
                            // console.log(resdata);//after download response file will be deleted
                        })
                    }
                });
        } else {
            resp.status(400).json({ status: 400, message: "Downloads directory not found", "download": `${export_xl}/${filename}` })
        }
        //return resp.status(200).json({ "message": "File successfully generated.", "download": `${export_xl}/${filename}` });
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}


async function DeleteFile(filePath) {
    if (fs.existsSync(`${filePath}`)) {
        fs.unlinkSync(`${filePath}`, (err) => {
            if (err) return { status: 404, msg: "Failed to delete file!!" };
        });
        return { status: 200, msg: "success" };
    } else {
        return { status: 404, msg: "Downloads directory not found" };
    }
}


async function SendMail(req, resp) {
    try {
        let datatime = moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
        const templateData = {
            name: "Bidyut",
            otp: "12345"
        };

        const emailTemplate = await ejs.renderFile(path.join(__dirname, './../views/emailTemplate.ejs'), templateData);
        let mailOption = {
            from: "onlinemessages0001@gmail.com",
            to: "mondalbidyut38@gmail.com",
            subject: `Mail test || ${datatime}`,
            // text: "for test",
            html: emailTemplate,
            attachments: [
                {
                    filename: '2024-5-2_19-40-38-453.pdf', // Name of the attachment
                    path: path.join(__dirname, './../public/pdf-export/2024-5-2_19-40-38-453.pdf') // Path to the file
                }
            ]
        }
        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                return resp.status(200).json({ status: 400, message: 'failed!', result: error });
            }
            return resp.status(200).json({ status: 200, message: 'success', result: info });
        });
    } catch (error) {
        return resp.status(200).json({ status: 400, message: error.message, result: '' });
    }
}


async function ExportUserPostPDF(req, resp) {
    try {
        let data, html, posts, pdfoptions, pdfoutput, filename, filePath;
        posts = await UsersPostModel.find();
        data = { "posts": posts };
        // return resp.render("pdfttem", data);
        html = await ejs.renderFile(path.join(__dirname, "./../views/pdfttem.ejs"), data, "utf8");
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
            path: filePath,//"./public/pdf-expor/" + filename,
            type: "pdf", // "stream" || "buffer" || "" ("" defaults to pdf)
        };
        pdf.create(pdfoutput, pdfoptions).then((res) => {
            // return resp.status(200).json({ status: 200, 'pdffile': res, 'filePath': filePath, message: 'success' });
            if (fs.existsSync(`${filePath}`)) {
                resp.set({
                    "Content-Type": "application/pdf",
                    "Content-Length": html.length
                })
                return resp.sendFile(filePath);// for preview
                // return resp.download(filePath, filename,
                //     (err) => {
                //         if (err) {
                //             return resp.status(200).json({
                //                 status: 200,
                //                 error: err.message,
                //                 message: "Problem while downloading the file"
                //             })
                //         } else {
                //             DeleteFile(filePath).then((resdata) => {
                //                 // console.log(resdata);//after download response file will be deleted
                //             })
                //         }
                //     });
            } else {
                resp.status(400).json({ status: 400, message: "Downloads directory not found", "download": filePath })
            }
        }).catch((error) => {
            return resp.status(200).json({ status: 400, 'pdffile': '', message: error.message });
        });
        // console.log(html);

    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}



async function UpdatePostVideos(req, resp) {
    let { postid } = req.body;
    var new_file_path = '', old_file_name = '';
    try {
        if (postid.length < 24) return resp.status(200).json({ "status": 400, "message": "invalid id", 'result': [] });
        const total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(postid) }).countDocuments();
        if (total <= 0) {
            return resp.status(200).json({ "status": 400, "message": "Post not found!", 'result': [] });
        }
        let postdata = await UsersPostModel.find({ '_id': new mongodb.ObjectId(postid) });
        postdata = postdata[0];
        old_file_name = postdata.video_file;
        if (req.files) {
            const fileIs = req.files.postvideo;
            const file_name = `${currentDateTime(fileIs.name)[0]}.${currentDateTime(fileIs.name)[1]}`;
            new_file_path = `${postvideo_path}/${file_name}`;
            await fileIs.mv(`${postvideo_path}/${file_name}`, function (err) {
                if (err) {
                    throw new Error(err);
                }
            });
            const update = await UsersPostModel.findByIdAndUpdate({ _id: new mongodb.ObjectId(postid) }, { "video_file": file_name, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') }, { new: true });
            await Healper.DeleteFile(`${postvideo_path}/${old_file_name}`);
            return resp.status(200).json({ "status": 200, "message": "Post has been successfully saved and file updated.", "error": false, 'result': update });
        } else {
            return resp.status(200).json({ "status": 400, "message": "file not found!", 'result': [] });
        }

    } catch (error) {
        await Healper.DeleteFile(new_file_path);
        return resp.status(500).json({ status: 500, "message": 'Failed..!!', "error": error.message });
    }
}

module.exports = { ImportUserPostExcel, ExportUserPostExcel, UsersPostList, UsersPost, SendMail, SaveUsersPost, GetPostById, DeletePostById, UpdateUserPost, ExportUserPostPDF, UpdatePostVideos };