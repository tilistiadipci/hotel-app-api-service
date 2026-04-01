let io;

module.exports = {
	init: (server) => {
		const { Server } = require("socket.io");

		io = new Server(server, {
			cors: {
				origin: "*",
			},
		});

		io.on("connection", (socket) => {
			console.log("Client connected:", socket.id);

			// TV register dirinya
			socket.on("join", (playerSerial) => {
				const roomName = `player-${playerSerial}`;

				socket.join(roomName);

				console.log(`Socket ${socket.id} join room ${roomName}`);
			});

			socket.on("disconnect", () => {
				console.log("Client disconnected:", socket.id);
			});
		});

		return io;
	},

	getIO: () => {
		if (!io) {
			throw new Error("Socket.io not initialized");
		}
		return io;
	},
};