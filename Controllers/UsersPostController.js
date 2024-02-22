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
        var { page, size, data, skip, limit } = req.query;
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
        data = await UsersPostModel.aggregate().sort({ 'created_at': -1 })
            .facet({
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
                            "_id": 1,
                            "userid": 1,
                            "title": 1,
                            "type": 1,
                            "content": 1,
                            "created_at": 1,
                            "user_field.name": 1,
                            "user_field.photo": 1
                        }
                    }
                ],
                totalCount: [{ $group: { _id: null, total: { $sum: 1 } } }]
            })
            .exec();
        var totalDocs = parseInt(data[0].totalCount[0].total);
        let c = CalculatData(totalDocs, limit, page);
        let res = {
            docs: data[0].result,
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
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
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
    try {
        let total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) }).countDocuments()
        let data = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) });
        if (total > 0) {
            data = data[0];
        } else {
            data = {};
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
    let { user, title, type, content } = req.body;
    try {
        let NewPost = new UsersPostModel({
            userid: user,
            title: title,
            type: type,
            content: content,
        }).save(function (err, result) {
            if (err) return resp.status(200).json({ "status": 400, "message": "Failed to save..!!", "error": err });
            return resp.status(200).json({ "status": 200, "message": "Post has been successfully saved.", "error": '', 'result': result });
        });
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
    }
}


async function UpdateUserPost(req, resp) {
    let { rowid, userid, title, type, content } = req.body;
    let dataObj, total;
    try {
        dataObj = { 'userid': userid, 'title': title, 'type': type, 'content': content, };
        total = await UsersPostModel.find({ '_id': new mongodb.ObjectId(rowid) }).countDocuments();
        if (total <= 0) {
            return resp.status(200).json({ "status": 400, "message": "Record not found.", "error": '', 'result': '', 'total': total });
        }
        let update = await UsersPostModel.findByIdAndUpdate({ _id: new mongodb.ObjectId(rowid) }, { $set: dataObj }, { new: true, useFindAndModify: false });

        if (!update) return resp.status(200).json({ "status": 400, "message": "Failed to update..!!", "error": update });
        return resp.status(200).json({ "status": 200, "message": "Post has been successfully updated.", "error": '', 'result': update, 'total': total });
    } catch (error) {
        return resp.status(400).json({ status: 400, "message": "Failed..!!", "error": error.message });
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
    let mailOption = {
        from: "onlinemessages0001@gmail.com",
        to: "mondalbidyut38@gmail.com",
        subject: 'Mail test',
        text: "for test"
    }
    transporter.sendMail(mailOption, (error, info) => {
        if (error) {
            return resp.status(400).json(error);
        }
        return resp.status(200).json(info);
    });
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
                return resp.download(filePath, filename,
                    (err) => {
                        if (err) {
                            return resp.status(200).json({
                                status: 200,
                                error: err.message,
                                message: "Problem while downloading the file"
                            })
                        } else {
                            DeleteFile(filePath).then((resdata) => {
                                // console.log(resdata);//after download response file will be deleted
                            })
                        }
                    });
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





module.exports = { ImportUserPostExcel, ExportUserPostExcel, UsersPostList, UsersPost, SendMail, SaveUsersPost, GetPostById, DeletePostById, UpdateUserPost, ExportUserPostPDF };