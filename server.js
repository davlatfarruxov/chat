const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')
const messageFormat = require('./utils/message')
const {joinUser, getCurrentUser, leftUser, getRoomUsers} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Set static folder
app.use(express.static(path.join(__dirname, 'public')))


io.on('connection', socket => {
    const botName = 'Chatbot'

    
    socket.on('joinRoom', ({username, room})=>{
        const user = joinUser(socket.id, username, room)
        
        socket.join(user.room)

        //  Welcoming new user
        socket.emit('message', messageFormat(botName, 'Welcome to Chat App'))
    
        //  Inform others when anew user connects to the chat
        socket.broadcast.to(user.room).emit('message', messageFormat(botName, `${user.username} joined to the chat`))
        //  Send user online info
        io.to(user.room).emit('roomUser', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })



    //  Runs when user disconnects
    socket.on('disconnect', ()=>{
        const user = leftUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', messageFormat(botName, `${user.username}user left the chat`))
            
        }
        //  Send user online info
        io.to(user.room).emit('roomUser', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })


    //  Listen to chat messsage event 
    socket.on('chatMessage', (message)=>{
        const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message', messageFormat(user.username, message))
    })
})

const PORT = process.env.PORT || 3000


server.listen(PORT, ()=>{
    console.log(`Server running on port: ${PORT}`);
})

