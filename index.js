const express = require('express')
const app = express()
const port = process.env.PORT || 5588
const server = require('http').createServer(app);
const path = require('path')
var siofu = require("socketio-file-upload");
const cors = require('cors')
const io = require('socket.io')(server, {

    
    cors: true,
    origins: ["http://192.168.1.34:*", "https://airdropio.vercel.app:*"],

})


const users = []
const hostdir = process.env.NODE_ENV === 'production' ? 'https://airdropserver.vercel.app/' : 'http://localhost:5588/'


app.use(express.static(path.join(__dirname, './public')))
app.use(siofu.router)
app.use(cors())


io.on('connection', (socket) => {


    var uploader = new siofu();
    var fs = require('fs');
    var dir = './public/uploads/' + socket.id;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    uploader.dir = dir;
    uploader.listen(socket);
    uploader.on("saved", function(event){
        
        const props = event.file.meta.props
        const file  =  hostdir + '/uploads/' + socket.id + '/' + event.file.name;
        const fileType = file.split('.').pop()
        const fileProp = {

            fileBaseUrl: file,
            fileName: event.file.name,
            fileSize: event.file.size,
            fileType: fileType,
            from_name: props.fromUser.name,
            from_id: props.fromUser.id,
            from_image: props.fromUser.image,
            to_name: props.toUser.name,
            to_id: props.toUser.id,
            to_image: props.toUser.image,
            date: new Date().toLocaleString()
        }
        socket.to(props.toUser.id).emit('file-recv', fileProp);
        // send file to client
    });



    // Join room

    socket.on('join-room', (data) => {

        socket.join(data.room)

        const n_user = {

            room : data.room,
            name: data.name,
            image: data.image,
            id: socket.id,
        }      

        users.push(n_user)
        
        socket.emit('you-have-joined-room', {

            message: `You have joined the room.`,
            id: socket.id,
            name: data.name,
            image: data.image,
            room: data.room,
            users
        }) 

        socket.broadcast.to(data.room).emit('joined-room', {

            message: `${data.name} has joined the room.`,
            users
        })
    })




    // Send message

    socket.on('send-message', (data) => {

        socket.to(data.to_id).emit('receive-message', {

            data
        })

    })





    // Socket disconnect

    socket.on('disconnect', () => {

        const user = users.find(user => user.id === socket.id)

        const fs = require('fs');
        if (fs.existsSync(dir)){
            fs.rmSync('./public/uploads/'+ socket.id, { recursive: true, force: true });
        }
        

        if (user) {

            const index = users.indexOf(user)
            users.splice(index, 1)

            io.to(user.room).emit('joined-room', {

                message: `${user.name} has left the room.`,
                users
            }) 
        }
    })
})



server.listen(port, () => {

    console.log(`Listening on ${port}`)
})