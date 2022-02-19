const express = require('express')
const app = express()
const port = process.env.PORT || 5588
const server = require('http').createServer(app);
const path = require('path')
var siofu = require("socketio-file-upload");
const io = require('socket.io')(server, {

    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }

})


app.use(express.static(path.join(__dirname, './public')))


server.listen(port, () => {

    console.log(`Listening on ${port}`)
})