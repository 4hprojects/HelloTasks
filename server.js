require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/db');
const { attachUser } = require('./middleware/authMiddleware');
const { startDueDateReminder } = require('./jobs/dueDateReminder');
const { generateToken, verifyCsrf } = require('./utils/csrf');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts — please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

connectDB();
startDueDateReminder();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.APP_ENV === 'production'
  }
}));

app.use(attachUser);
app.use(verifyCsrf);

app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;
  res.locals.currentPath = req.path;
  res.locals.turnstileSiteKey = process.env.CLOUDFLARE_TURNSTILE_SITE_KEY || '';
  res.locals.csrfToken = generateToken(req);
  next();
});

app.get('/', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.use('/', authLimiter, require('./routes/authRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/tasks', require('./routes/allTasksRoutes'));
app.use('/projects', require('./routes/projectRoutes'));
app.use('/projects/:projectId/tasks', require('./routes/taskRoutes'));

app.use((req, res) => {
  res.status(404).render('errors/404', { title: '404 Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', { title: '500 Server Error' });
});

app.listen(PORT, () => {
  console.log(`HelloTasks running on http://localhost:${PORT}`);
});
