const path = require('path');
const fs = require('fs');
const user_files = path.join(__dirname, './../public/users');
const mongodb = require('mongodb');
const bcrypt = require("bcrypt");
const Healper = require("./Healper");


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

module.exports = { FileRD, NodeJSStreams };