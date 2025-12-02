const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { httpLogger } = require('./middlewares/httpLogger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');
dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(httpLogger);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
// Désactiver la politique de contenu de sécurité pour permettre les requêtes cross-origin
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:'],
    },
  })
);
// Désactiver la protection contre le clicjacking pour permettre l'affichage dans les iframes
app.use(helmet.frameguard({ action: 'deny' }));
// Désactiver la protection contre le cross-site scripting (XSS)
app.use(helmet.xssFilter({ setOnOldIE: true }));
// Désactiver la protection contre le sniffing de type MIME
app.use(helmet.noSniff());
// Désactiver l'entête X-Powered-By
app.disable('x-powered-by');

// Limiter les requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    success: false,
    status: 429,
    message: "Trop de requêtes, veuillez patienter."
  },
  standardHeaders: true,
  legacyHeaders: false
},
  (err, req, res, next) => {
    if (err) {
      logger.error(`Erreur lors de la limitation des requêtes: ${err.message}`);
      return res.status(500).json({
        success: false,
        status: 500,
        message: "Erreur interne du serveur"
      });
    }
    next();
  });

app.use(limiter);

// Valider les body JSON
app.use(express.json());
// Valider les body encodés en URL
app.use(express.urlencoded({ extended: true }));
// Bloquer les requêtes trop volumineuses
app.use(express.json({ limit: '10kb' }));
// Bloquer les requêtes malformées
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Requête malformée' });
  }
  next();
});

//  Intégration des routes
const routes = [
  './routes/taskRoutes',
];
routes.forEach(r => app.use('/', require(r)));

// Lister routes
function listRoutes(app) {
  const routesList = [];
  app._router.stack.forEach(m => {
    if (m.handle?.stack?.length) {
      const moduleName = m.handle.routeName || 'anonyme';
      m.handle.stack.forEach(l => {
        if (l.route && l.route.path) {
          const methods = Object.keys(l.route.methods).map(m => m.toUpperCase()).join(', ');
          routesList.push({ path: l.route.path, methods, from: moduleName });
        }
      });
    }
  });
  routesList.sort((a, b) => a.path.localeCompare(b.path));
  console.log('\n📋 Liste des routes disponibles :');
  routesList.forEach(r => console.log(`🔹 [${r.methods}] ${r.path} (depuis ${r.from})`));
}

listRoutes(app);

// health
app.get('/', (req, res) => res.json({ status: 'ok', service: 'todo-api' }));

// Page non trouvée
app.use(notFoundHandler);

// Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const TaskController = require('./controllers/taskController');
    TaskController.getAllTasks();
    app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Connexion à la base de données échouée', err);
    process.exit(1);
  });
