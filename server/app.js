const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const config = require('./config');
const connectDB = require('./config/db');
const { initializeSocket } = require('./utils/socketManager');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');


// --- DATABASE CONNECTION ---
connectDB();

const app = express();

// --- CORE MIDDLEWARE ---
app.use(cors({
    origin: '*', // Change to frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'Expires'
    ]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- API ROUTES ---
app.get('/', (req, res) => {
    res.send('Welcome to the HealthCare HMS API');
});

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);


// --- ERROR HANDLING MIDDLEWARE ---
app.use(notFound);
app.use(errorHandler);


// --- SERVER & SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this
        methods: ["GET", "POST"]
    }
});

// Initialize Socket.IO manager
initializeSocket(io);

const PORT = config.port || 8000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});