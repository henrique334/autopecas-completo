require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const routes    = require('./src/routes');
const { getDb } = require('./src/config/database');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API ───────────────────────────────────────────
app.use('/api', routes);

// ── Frontend (serve arquivos estáticos) ──────────
app.use(express.static(path.join(__dirname, 'public')));

// Qualquer rota não-API serve o index.html
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  }
});

// ── Iniciar ───────────────────────────────────────
(async () => {
  await getDb(); // cria banco + seed na primeira execução
  app.listen(PORT, () => {
    console.log('\n════════════════════════════════════════');
    console.log('  🔧  AutoPeças Sucata');
    console.log('════════════════════════════════════════');
    console.log(`  🌐  Site:    http://localhost:${PORT}`);
    console.log(`  📡  API:     http://localhost:${PORT}/api`);
    console.log(`  📦  Banco:   ./data/autopecas.db`);
    console.log(`  🔑  Admin:   admin@autopecas.com / admin123`);
    console.log('════════════════════════════════════════\n');
  });
})();
