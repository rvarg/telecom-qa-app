// Punto de entrada para Vercel: exporta la misma app Express definida
// en server/app.js (sin llamar a listen — Vercel se encarga de invocarla
// como función serverless en cada request a /api/*).
module.exports = require('../server/app');
