const UsersModel = require('../Models/UsersModel');
const UsersPostModel = require('../Models/UsersPostModel');
const path = require('path');
const fs = require('fs');
const xl_files = path.join(__dirname, './../public/xl-files');
const export_xl = path.join(__dirname, './../public/export-xl');
const mongodb = require('mongodb');
const readXlsxFile = require('read-excel-file/node');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
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
        if (page == 0) {
            page == 1;
        }
        if (!size) {
            size = 5;
        }
        if (size == 0) {
            size == 1;
        }
        page = parseInt(page);
        limit = parseInt(size);
        skip = (page - 1) * limit;
        data = await UsersModel.aggregate().sort({ 'created_at': -1 })
            .facet({
                result: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $addFields: {
                            _id: {
                                $toObjectId: "$_id"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'users_posts',
                            localField: '_id',
                            foreignField: 'userid',
                            as: 'post',
                        }
                    },
                    { $unwind: '$post' },
                    {
                        "$project": {
                            "_id": 0,
                            "name": 1,
                            "photo": 1,
                            "post._id": 1,
                            "post.userid": 1,
                            "post.title": 1,
                            "post.type": 1,
                            "post.content": 1,
                            "post.created_at": 1
                        }
                    }
                ],
            })
            .exec();
        // return resp.status(200).json(data);
        //var totalDocs = parseInt(data[0].totalCount[0].total);
        var totalDocs = await UsersPostModel.find().countDocuments();
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
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error });
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

// https://www.grapecity.com/blogs/how-to-generate-excel-spreadsheets-in-nodejs
// https://pspdfkit.com/blog/2021/how-to-generate-pdf-from-html-with-nodejs/

async function ExportUserPostExcel(req, resp) {
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
    return resp.status(200).json({ "message": "File successfully generated.", "download": `${export_xl}/${filename}` });
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


module.exports = { ImportUserPostExcel, ExportUserPostExcel, UsersPostList, UsersPost, SendMail };