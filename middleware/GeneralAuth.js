async function GeneralAuth(req, resp, next) {
    try {
        var allowlist = ['http://localhost:4200', 'http://localhost:3000'];
        // if (allowlist.indexOf(req.header('Origin')) == -1) {
        //     return resp.status(400).json({ "status": 400, "message": "Access denied..!!" });
        // }
        next();
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error });
    }
}

module.exports = GeneralAuth;