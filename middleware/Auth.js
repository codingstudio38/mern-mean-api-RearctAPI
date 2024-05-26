const jwt = require('jsonwebtoken');
const UsersModel = require('./../Models/UsersModel');
const mongodb = require('mongodb');
async function Auth(req, resp, next) {
    try {
        const _token = req.headers['authorization'];
        var allowlist = ['http://localhost:4200', 'http://localhost:3000'];
        // if (allowlist.indexOf(req.header('Origin')) == -1) {
        //     return resp.status(400).json({ "status": 400, "message": "Access denied..!!" });
        // } 
        if (!_token) {
            return resp.status(401).json({ "status": 401, "message": "Unauthorized" });
        }
        let ex_token = _token.split(' ');
        ex_token = ex_token.length == 2 ? ex_token[1] : '';
        const varifyUsers = jwt.verify(ex_token, process.env.SECRET_KEY);
        if (!varifyUsers) {
            return resp.status(401).json({ "status": 401, "message": "Invalid token detected..!!" });
        }
        const user = await UsersModel.findOne({ _id: new mongodb.ObjectId(varifyUsers._id) });
        const _check = user.tokens.filter((items, index) => {
            return items.token == ex_token;
        });
        if (_check.length === 0) {
            return resp.status(401).json({ "status": 401, "message": "Token has been expired. Please logged in again." });
        }
        req.token = ex_token;
        req.user = user;
        next();
    } catch (error) {
        return resp.status(401).json({ "status": 401, "message": "Failed..!!", "error": error });
    }
}

function noCache(req, resp, next) {
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const origin = `${protocol}://${host}`;
        console.log(`Current path URL: ${origin} -- ${req.originalUrl}`);
        resp.setHeader('Surrogate-Control', 'no-store');
        resp.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        resp.setHeader('Pragma', 'no-cache');
        resp.setHeader('Expires', '0');
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
}
module.exports = Auth;