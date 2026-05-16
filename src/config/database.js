const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../data/autopecas.db');
let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
    criarTabelas();
    popularDados();
    salvarDb();
  }
  return db;
}

function salvarDb() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function criarTabelas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      icone TEXT DEFAULT '🔧',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pecas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      categoria_id INTEGER,
      marca_carro TEXT,
      modelo_carro TEXT,
      ano_inicio INTEGER,
      ano_fim INTEGER,
      preco REAL NOT NULL,
      condicao TEXT DEFAULT 'Bom Estado',
      estoque INTEGER DEFAULT 1,
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      marca_carro TEXT,
      modelo_ano TEXT,
      peca_desejada TEXT NOT NULL,
      informacoes TEXT,
      status TEXT DEFAULT 'novo',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function popularDados() {
  db.run(`INSERT INTO categorias (nome, icone) VALUES
    ('Motor','⚙️'),('Câmbio','🔄'),('Lataria','🚗'),
    ('Elétrica','⚡'),('Ar-Condicionado','❄️'),('Rodas','🛞'),
    ('Suspensão','🔩'),('Freios','🛑'),('Faróis','💡'),
    ('Vidros','🪟'),('Interior','🪑'),('Bateria','🔋');
  `);

  db.run(`INSERT INTO pecas (nome,descricao,categoria_id,marca_carro,modelo_carro,ano_inicio,ano_fim,preco,condicao,estoque) VALUES
    ('Motor 1.0 Flex','Motor completo testado, funcionando perfeitamente. Baixa quilometragem.',1,'Volkswagen','Gol G5',2009,2014,1800,'Bom Estado',2),
    ('Câmbio Automático','Câmbio automático 4 marchas revisado e testado.',2,'Toyota','Corolla',2015,2019,2500,'Ótimo Estado',1),
    ('Farol Dianteiro LED','Farol original sem riscos, encaixe perfeito.',9,'Honda','Civic',2017,2021,650,'Semi-Novo',3),
    ('Amortecedor Dianteiro Par','Par de amortecedores originais com bom funcionamento.',7,'Chevrolet','Onix',2013,2020,320,'Bom Estado',4),
    ('Compressor de A/C','Compressor testado e aprovado.',5,'Hyundai','HB20',2012,2019,480,'Ótimo Estado',2),
    ('Jogo de Rodas Aro 17','4 rodas sem amassados ou trincas.',6,'Ford','Fusion',2014,2018,1200,'Semi-Novo',1),
    ('Caixa de Câmbio Manual','5 marchas em ótimo estado.',2,'Fiat','Palio',2010,2016,900,'Bom Estado',2),
    ('Parachoque Dianteiro','Original sem furos, pronto para pintar.',3,'Volkswagen','Fox',2012,2018,280,'Bom Estado',5),
    ('Alternador','Testado no banco, carregando perfeitamente.',4,'Renault','Sandero',2011,2020,350,'Ótimo Estado',3),
    ('Banco do Motorista Couro','Couro sintético sem rasgos.',11,'Toyota','Hilux',2016,2022,750,'Semi-Novo',1);
  `);

  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT INTO usuarios (nome, email, senha_hash) VALUES ('Administrador','admin@autopecas.com','${senhaHash}');`);
}

module.exports = { getDb, salvarDb };
