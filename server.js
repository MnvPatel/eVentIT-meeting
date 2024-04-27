const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    // Listen for user-disconnected event
    socket.on("user-disconnected", (userName) => {
      // Broadcast the user-disconnected event to other users in the room
      socket.to(roomId).broadcast.emit("user-left", userName);
    });
    socket.on("user-left", (userName) => {
      // Find and remove the video element associated with the user who left
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video) => {
        if (video.getAttribute("data-user") === userName) {
          video.remove();
        }
      });
    });
  });
});

server.listen(process.env.PORT || 3030);
