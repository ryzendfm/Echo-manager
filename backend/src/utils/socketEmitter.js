/**
 * Socket.io emission utilities.
 * Requires `io` and `userSocketMap` to be set on the Express app via app.set().
 * Access them from req.app in controllers/helpers.
 */

function emitToUser(io, userSocketMap, userId, event, data) {
    const socketIds = userSocketMap.get(String(userId));
    if (socketIds) {
        for (const socketId of socketIds) {
            io.to(socketId).emit(event, data);
        }
    }
}

function emitToUsers(io, userSocketMap, userIds, event, data) {
    for (const userId of userIds) {
        emitToUser(io, userSocketMap, userId, event, data);
    }
}

module.exports = { emitToUser, emitToUsers };
