// ================================
// Backend Server
// ================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const { syncDb } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportsRoutes');
const verifyRoutes = require('./routes/verifyRoutes');

const app = express();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';


// ================================
// CORS CONFIGURATION
// ================================

const configuredOrigins = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
    'http://localhost:3000',
    'https://traffic-violation-reporting.vercel.app'
]);

configuredOrigins.forEach((origin) => allowedOrigins.add(origin));

function isAllowedOrigin(origin) {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;

    try {
        const { hostname, protocol } = new URL(origin);
        return protocol === 'https:' && hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
}

app.use(cors({
    origin: function (origin, callback) {

        // Allow requests with no origin
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }

    },

    credentials: true,

    methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ]
}));


// ================================
// BODY PARSING
// ================================

app.use(express.json({
    limit: '10mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));


// ================================
// RATE LIMITING
// ================================

const rateLimit = require('express-rate-limit');

const reportLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many submissions. Please wait 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/report', reportLimiter);


// ================================
// SESSION
// ================================

if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(session({

    secret:
        process.env.SESSION_SECRET ||
        'civialert_dev_secret',

    resave: false,

    saveUninitialized: false,

    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: isProduction ? 'none' : 'lax'
    }

}));


// ================================
// STATIC UPLOADS
// ================================

app.use(
    '/uploads',
    express.static(
        path.join(__dirname, 'uploads')
    )
);


// ================================
// ROUTES
// ================================

app.use('/auth', authRoutes);

app.use('/report', reportRoutes);
app.use('/verify', verifyRoutes);


// ================================
// HEALTH CHECK
// ================================

app.get('/health', (req, res) => {

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });

});


// ================================
// ROOT ROUTE
// ================================

app.get('/', (req, res) => {

    res.send('CivicAlert Backend is running 🚀');

});


// ================================
// GLOBAL ERROR HANDLER
// ================================

app.use((err, req, res, next) => {

    console.error(err.stack);

    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        'body' in err
    ) {

        return res.status(400).json({
            error: 'Invalid JSON format'
        });

    }

    res.status(500).json({
        error:
            err.message ||
            'Internal server error'
    });

});


// ================================
// START SERVER
// ================================

async function start() {

    await syncDb();

    app.listen(PORT, () => {

        console.log(
            `🚀 CivicAlert API running at http://localhost:${PORT}`
        );

        console.log(
            `📁 Uploads served at http://localhost:${PORT}/uploads`
        );

    });

}

start();