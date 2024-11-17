const path = require('path');
const fs = require('fs');
const mime = require('mime');
const os = require('os');
const CryptoJS = require('crypto-js');
const data_secretKey = 'bc665a1f223dba15f5fbf5df08838647';  // 16-byte key
const data_ivString = 'bc66-f223-dba1-8647-2345-fd45-dfg3';
const moment = require('moment-timezone');

const data_decrypt = async (encryptedData) => {
    const iv = CryptoJS.enc.Utf8.parse(data_ivString);
    const key = CryptoJS.enc.Utf8.parse(data_secretKey);
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedText;
};


const data_encrypt = async (data) => {
    const iv = CryptoJS.enc.Utf8.parse(data_ivString);
    const key = CryptoJS.enc.Utf8.parse(data_secretKey);
    const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
};

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

async function FileInfo(filePath) {
    try {
        if (filePath == "" || filePath == undefined || filePath == null) return { filetype_st: '', filetype: '', filesize: '' };
        if (fs.existsSync(`${filePath}`)) {
            const filedata = fs.statSync(filePath);
            const size = filedata.size;
            const fileType = mime.getType(filePath);
            let filetype_st = path.extname(filePath)
            filetype_st = filetype_st.replace('.', '', filetype_st).toLowerCase();
            return { filetype_st: filetype_st, filetype: fileType, filesize: size };
        } else {
            return { filetype_st: '', filetype: '', filesize: '' };
        }
    } catch (error) {
        throw new Error(error);
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
async function GetallFilelist(filePath) {
    try {
        fs.readdir(filePath, (err, files) => {
            return files;
            // files.forEach((item, index) => {
            //     console.log(`file ${index} - ${item}`);
            // })
        })
    } catch (error) {
        throw new Error(error.message);
    }
}


function PaginationData(data, total, limitis, pageis) {
    try {
        var totalpage, nextPage, record_from, record_to, hasNextPage, hasPrevPage, prevPage, page_links, skip, currentPage = 0, previous = 0, lastPage = 0, page = 0, limit = 0;
        page = parseInt(pageis);
        limit = parseInt(limitis);
        skip = (page - 1) * limit;
        previous = page - 1;
        // if (total % limit === 0) {
        //     totalpage = Math.ceil(total / limit) ;
        // } else {
        //     let num = total / limit + " ";
        //     let num_ = num.split(".");
        //     totalpage = parseInt(num_[0]) + 1;
        // }
        currentPage = page;
        totalpage = Math.ceil(total / limit);
        lastPage = totalpage;
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
            nextPage = 0;
        }
        if (page <= 1) {
            hasPrevPage = false;
            prevPage = 0;
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
        let page_links_new = [];

        for (let i = 1; i <= totalpage; i++) {
            if (i >= currentPage - 2 && i <= currentPage + 2) {
                if (i === currentPage) {
                    page_links_new.push({ 'link': i, active: true });
                } else {
                    page_links_new.push({ 'link': i, active: false });
                }
            }
        }


        return { docs: data, 'totalpage': totalpage, 'nextPage': nextPage, 'record_from': record_from, 'record_to': record_to, 'hasNextPage': hasNextPage, 'hasPrevPage': hasPrevPage, 'prevPage': prevPage, total: total, current_page: page, page_links_new: page_links_new };
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
async function getIPAddress() {
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = '';
    // console.log('networkInterfaces', networkInterfaces)
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        // console.log('interfaces', interfaces)
        for (const iface of interfaces) {
            // console.log('iface', iface);
            if (iface.family === 'IPv4' && !iface.internal) {
                ipAddress = iface.address;
                break;
            }
        }

        if (ipAddress) {
            break;
        }
    }

    return ipAddress;
}

async function DateTime(datetime, timezome, formart) {
    try {
        const full_date_time = moment(datetime).tz(timezome).format(formart == '' ? 'YYYY-MM-DD HH:mm:ss A' : formart);
        const year = moment(datetime).tz(timezome).format('YYYY');
        const month = moment(datetime).tz(timezome).format('MM');
        const day = moment(datetime).tz(timezome).format('DD');
        const hours = moment(datetime).tz(timezome).format('HH');
        const minutes = moment(datetime).tz(timezome).format('mm');
        const second = moment(datetime).tz(timezome).format('ss');
        return { 'full_date_time': full_date_time, 'year': year, 'month': month, 'day': day, 'hours': hours, 'minutes': minutes, 'second': second };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { FileExists, DeleteFile, FileInfo, ReadFile, PaginationData, getIPAddress, GetallFilelist, data_decrypt, data_encrypt, DateTime };