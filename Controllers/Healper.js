const path = require('path');
const fs = require('fs');

async function FileExists(filePath) {
    try {
        if (filePath == "" || filePath == undefined || filePath == null) return false;
        if (fs.existsSync(filePath)) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

async function DeleteFile(filePath) {
    try {
        if (filePath == "" || filePath == undefined || filePath == null) return false;
        if (fs.existsSync(`${filePath}`)) {
            fs.unlinkSync(`${filePath}`, (err) => {
                if (err) return false;
                return true;
            });
        } else {
            return false;
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

async function ReadFile(filePath, type) {
    try {
        return new Promise((resolve, reject) => {
            fs.readFile(`${filePath}`, type, (err, data) => {
                if (err) throw new Error('failed to read file!!');
                resolve(data)
            });
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

// fs.writeFileSync(filepath, "test test test");

// fs.appendFile(filepath, " modify modify modify modify", (err) => {
//     if (!err) console.log("file is updated.");
// });

//  fs.rename(filepath, `${dirPath}/newtest.txt`, (err) => {
//     if (!err) console.log("file name is updated.");
//  })

module.exports = { FileExists, DeleteFile, ReadFile };