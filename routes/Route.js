const express = require('express');
const routeapp = new express.Router;
const UsersController = require('./../Controllers/UsersController');
const UsersPostController = require('./../Controllers/UsersPostController');
const UsersChatController = require('./../Controllers/UsersChatController');
const Auth = require('./../middleware/Auth');
const GeneralAuth = require('./../middleware/GeneralAuth');


routeapp.get('/', (req, resp) => {
    resp.json({ 'message': "It's wotking" });
});

routeapp.get("/download/user/:filename", UsersController.DownloadFile);

routeapp.post('/create', GeneralAuth, UsersController.CreateNew);

routeapp.post('/login', GeneralAuth, UsersController.UserLogin);

routeapp.put('/update', Auth, UsersController.UpdateUser);

routeapp.get('/logout', Auth, UsersController.UserLogout);

routeapp.get('/user', Auth, UsersController.UserDetail);

routeapp.get('/users-list', Auth, UsersController.Allusers);

routeapp.get('/all-users', Auth, UsersController.UsersList);

routeapp.delete('/user', Auth, UsersController.DeleteUser);

routeapp.get('/users-chat-list', Auth, UsersController.UserChatList);

routeapp.get('/users/post-list', Auth, UsersPostController.UsersPostList);

routeapp.get('/users/post', Auth, UsersPostController.UsersPost);

routeapp.post('/users/save-post', Auth, UsersPostController.SaveUsersPost);

routeapp.get('/users/post-byid/:rowid', Auth, UsersPostController.GetPostById);

routeapp.get('/users/delete-post-byid/:rowid', Auth, UsersPostController.DeletePostById);

routeapp.post('/users/update-post', Auth, UsersPostController.UpdateUserPost);

routeapp.post('/upload-xl/', Auth, UsersPostController.ImportUserPostExcel);

routeapp.get('/export-xl/', Auth, UsersPostController.ExportUserPostExcel);

routeapp.get('/users/send-mail', Auth, UsersPostController.SendMail);

routeapp.post('/save-user-chat', Auth, UsersChatController.SaveChat);

routeapp.get('/chat-list', Auth, UsersChatController.ChatList);

routeapp.get('/current-chat-user', Auth, UsersChatController.CurrentChatUser);

routeapp.get('/find-chat', Auth, UsersChatController.FindChat);



routeapp.get('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

routeapp.put('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

routeapp.post('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});

routeapp.delete('*', (req, res) => {
    res.status(404).json({ 'status': 404, 'message': 'route not found..!!' });
});


module.exports = routeapp;