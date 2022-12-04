require('dotenv').config();
const port = process.env.PORT;
const path = require('path');
const Fileupload = require('express-fileupload');
var cors = require('cors')
const express = require('express');
const multer = require('multer');
const { Allusers, CreateNew, UpdateUser, DeleteUser, UserDetail, UserLogin, UserLogout, DownloadFile } = require('./Controllers/UsersController');
const { ImportUserPostExcel, ExportUserPostExcel, UsersPostList, UsersPost, SendMail } = require('./Controllers/UsersPostController');
const Auth = require('./middleware/Auth');
const GeneralAuth = require('./middleware/GeneralAuth');

const app = express();
app.use(express.json());
app.use(Fileupload());
app.use(cors())
app.use("/users-file", express.static('./public/users/'))

app.get('/', (req, resp) => {
    resp.json({ 'message': "It's wotking" });
});

app.get("/download/user/:filename", DownloadFile);

app.post('/create', GeneralAuth, CreateNew);

app.post('/login', GeneralAuth, UserLogin);

app.put('/update', Auth, UpdateUser);

app.get('/logout', Auth, UserLogout);

app.get('/user', Auth, UserDetail);

app.get('/users-list', Auth, Allusers);

app.delete('/user', Auth, DeleteUser);

app.get('/users/post-list', Auth, UsersPostList);

app.get('/users/post', Auth, UsersPost);

app.post('/upload-xl/', Auth, ImportUserPostExcel);

app.get('/export-xl/', Auth, ExportUserPostExcel);

app.get('/users/send-mail', Auth, SendMail);

app.get('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

app.put('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

app.post('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

app.delete('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

app.listen(port);