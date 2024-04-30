const path = require('path');
const fs = require('fs');
const user_files = path.join(__dirname, './../public/users');
const mongodb = require('mongodb');
const bcrypt = require("bcrypt");



function FileRD(req, resp) {
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


module.exports = { FileRD };