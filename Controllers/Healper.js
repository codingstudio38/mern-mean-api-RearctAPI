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

function PaginationData(total, limit, page) {
    try {
        var totalpage, nextPage, record_from, record_to, hasNextPage, hasPrevPage, prevPage, page_links, skip;
        skip = (page - 1) * limit;
        // if (total % limit === 0) {
        //     totalpage = Math.ceil(total / limit) ;
        // } else {
        //     let num = total / limit + " ";
        //     let num_ = num.split(".");
        //     totalpage = parseInt(num_[0]) + 1;
        // }
        totalpage = Math.ceil(total / limit);
        nextPage = parseInt(page + 1);
        record_from = skip + 1;
        record_to = record_from + limit - 1;
        if (record_to > total) {
            record_to = total;
        }
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
        return { 'totalpage': totalpage, 'nextPage': nextPage, 'record_from': record_from, 'record_to': record_to, 'hasNextPage': hasNextPage, 'hasPrevPage': hasPrevPage, 'prevPage': prevPage, 'page_links': page_links, total: total, current_page: page };
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

module.exports = { FileExists, DeleteFile, ReadFile, PaginationData };