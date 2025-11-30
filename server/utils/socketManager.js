let io = null;

const initializeSocket = (socketIoInstance) => {
    io = socketIoInstance;

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join_user_room', (data) => {
            const userId = data.user_id;
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`SID ${socket.id} joined room for user ${userId}`);
            }
        });

        socket.on('join_pharmacy_room', () => {
            socket.join('pharmacy_queue');
            console.log(`SID ${socket.id} joined pharmacy queue room`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

const notifyUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

const notifyPharmacy = (event, data) => {
    if (io) {
        io.to('pharmacy_queue').emit(event, data);
    }
};

module.exports = {
    initializeSocket,
    notifyUser,
    notifyPharmacy
};