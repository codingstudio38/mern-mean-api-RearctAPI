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
        const varifyUsers = jwt.verify(_token, process.env.SECRET_KEY);
        if (!varifyUsers) {
            return resp.status(401).json({ "status": 401, "message": "Invalid token detected..!!" });
        }
        const user = await UsersModel.findOne({ _id: new mongodb.ObjectId(varifyUsers._id) });
        const _check = user.tokens.filter((items, index) => {
            return items.token == _token;
        });
        if (_check.length === 0) {
            return resp.status(401).json({ "status": 401, "message": "Token has been expired. Please logged in again." });
        }
        req.token = _token;
        req.user = user;
        next();
    } catch (error) {
        return resp.status(401).json({ "status": 401, "message": "Failed..!!", "error": error });
    }
}

module.exports = Auth;