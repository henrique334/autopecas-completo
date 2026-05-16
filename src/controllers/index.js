const { getDb, salvarDb } = require('../config/database');
const { toObjs } = require('../config/helpers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../middlewares/auth');

// ─── AUTH ────────────────────────────────────────────
async function login(req, res) {
  try {
    const db = await getDb();
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios.' });
    const users = toObjs(db.exec(`SELECT * FROM usuarios WHERE email = ?`, [email.toLowerCase()]));
    if (!users.length || !bcrypt.compareSync(senha, users[0].senha_hash))
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    const u = users[0];
    const token = jwt.sign({ id: u.id, nome: u.nome, email: u.email }, SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: { id: u.id, nome: u.nome, email: u.email } });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

// ─── CATEGORIAS ──────────────────────────────────────
async function listarCategorias(req, res) {
  try {
    const db = await getDb();
    const result = db.exec(`
      SELECT c.*, COUNT(p.id) as total_pecas FROM categorias c
      LEFT JOIN pecas p ON p.categoria_id = c.id AND p.ativo = 1
      GROUP BY c.id ORDER BY c.nome
    `);
    res.json(toObjs(result));
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function criarCategoria(req, res) {
  try {
    const db = await getDb();
    const { nome, icone } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
    db.run(`INSERT INTO categorias (nome, icone) VALUES (?, ?)`, [nome, icone || '🔧']);
    salvarDb();
    res.status(201).json({ mensagem: 'Categoria criada!' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function deletarCategoria(req, res) {
  try {
    const db = await getDb();
    db.run(`DELETE FROM categorias WHERE id = ?`, [req.params.id]);
    salvarDb();
    res.json({ mensagem: 'Removida!' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

// ─── PEÇAS ───────────────────────────────────────────
async function listarPecas(req, res) {
  try {
    const db = await getDb();
    const { q, categoria_id, marca, preco_min, preco_max, condicao, page = 1, limit = 12 } = req.query;
    let sql = `SELECT p.*, c.nome as categoria_nome, c.icone as categoria_icone
               FROM pecas p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.ativo = 1`;
    const params = [];
    if (q) { sql += ` AND (p.nome LIKE ? OR p.modelo_carro LIKE ? OR p.marca_carro LIKE ?)`; const l=`%${q}%`; params.push(l,l,l); }
    if (categoria_id) { sql += ` AND p.categoria_id = ?`; params.push(categoria_id); }
    if (marca) { sql += ` AND p.marca_carro LIKE ?`; params.push(`%${marca}%`); }
    if (condicao) { sql += ` AND p.condicao = ?`; params.push(condicao); }
    if (preco_min) { sql += ` AND p.preco >= ?`; params.push(+preco_min); }
    if (preco_max) { sql += ` AND p.preco <= ?`; params.push(+preco_max); }

    const total = toObjs(db.exec(sql.replace('SELECT p.*, c.nome as categoria_nome, c.icone as categoria_icone','SELECT COUNT(*) as total'), params))[0]?.total || 0;
    sql += ` ORDER BY p.criado_em DESC LIMIT ? OFFSET ?`;
    params.push(+limit, (+page - 1) * +limit);

    res.json({ pecas: toObjs(db.exec(sql, params)), total, pagina: +page, total_paginas: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function buscarPeca(req, res) {
  try {
    const db = await getDb();
    const r = toObjs(db.exec(`SELECT p.*, c.nome as categoria_nome FROM pecas p LEFT JOIN categorias c ON p.categoria_id=c.id WHERE p.id=? AND p.ativo=1`, [req.params.id]));
    if (!r.length) return res.status(404).json({ erro: 'Não encontrada.' });
    res.json(r[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function criarPeca(req, res) {
  try {
    const db = await getDb();
    const { nome, descricao, categoria_id, marca_carro, modelo_carro, ano_inicio, ano_fim, preco, condicao, estoque } = req.body;
    if (!nome || !preco) return res.status(400).json({ erro: 'Nome e preço obrigatórios.' });
    db.run(`INSERT INTO pecas (nome,descricao,categoria_id,marca_carro,modelo_carro,ano_inicio,ano_fim,preco,condicao,estoque) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [nome, descricao, categoria_id, marca_carro, modelo_carro, ano_inicio, ano_fim, preco, condicao||'Bom Estado', estoque||1]);
    salvarDb();
    const id = toObjs(db.exec(`SELECT last_insert_rowid() as id`))[0].id;
    res.status(201).json({ mensagem: 'Peça cadastrada!', id });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function atualizarPeca(req, res) {
  try {
    const db = await getDb();
    const { nome, descricao, categoria_id, marca_carro, modelo_carro, ano_inicio, ano_fim, preco, condicao, estoque, ativo } = req.body;
    db.run(`UPDATE pecas SET nome=?,descricao=?,categoria_id=?,marca_carro=?,modelo_carro=?,ano_inicio=?,ano_fim=?,preco=?,condicao=?,estoque=?,ativo=? WHERE id=?`,
      [nome, descricao, categoria_id, marca_carro, modelo_carro, ano_inicio, ano_fim, preco, condicao, estoque, ativo??1, req.params.id]);
    salvarDb();
    res.json({ mensagem: 'Atualizada!' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function deletarPeca(req, res) {
  try {
    const db = await getDb();
    db.run(`UPDATE pecas SET ativo=0 WHERE id=?`, [req.params.id]);
    salvarDb();
    res.json({ mensagem: 'Removida!' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

// ─── CONSULTAS ───────────────────────────────────────
async function criarConsulta(req, res) {
  try {
    const db = await getDb();
    const { nome, whatsapp, marca_carro, modelo_ano, peca_desejada, informacoes } = req.body;
    if (!nome || !whatsapp || !peca_desejada) return res.status(400).json({ erro: 'Nome, WhatsApp e peça são obrigatórios.' });
    const tel = whatsapp.replace(/\D/g,'');
    if (tel.length < 10) return res.status(400).json({ erro: 'WhatsApp inválido.' });
    db.run(`INSERT INTO consultas (nome,whatsapp,marca_carro,modelo_ano,peca_desejada,informacoes) VALUES (?,?,?,?,?,?)`,
      [nome.trim(), tel, marca_carro, modelo_ano, peca_desejada.trim(), informacoes]);
    salvarDb();
    const msg = encodeURIComponent(`Olá! Sou ${nome} (${whatsapp}). Preciso de: ${peca_desejada}. Carro: ${modelo_ano||marca_carro||'não informado'}.`);
    res.status(201).json({ mensagem: 'Consulta enviada! Entraremos em contato em breve.', whatsapp_link: `https://wa.me/5511999999999?text=${msg}` });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function listarConsultas(req, res) {
  try {
    const db = await getDb();
    const { status, page=1, limit=20 } = req.query;
    let sql = `SELECT * FROM consultas WHERE 1=1`;
    const params = [];
    if (status) { sql += ` AND status=?`; params.push(status); }
    const total = toObjs(db.exec(sql.replace('SELECT *','SELECT COUNT(*) as total'), params))[0]?.total || 0;
    sql += ` ORDER BY criado_em DESC LIMIT ? OFFSET ?`;
    params.push(+limit, (+page-1)*+limit);
    res.json({ consultas: toObjs(db.exec(sql, params)), total });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

async function atualizarStatusConsulta(req, res) {
  try {
    const db = await getDb();
    const { status } = req.body;
    if (!['novo','em_atendimento','finalizado','cancelado'].includes(status))
      return res.status(400).json({ erro: 'Status inválido.' });
    db.run(`UPDATE consultas SET status=? WHERE id=?`, [status, req.params.id]);
    salvarDb();
    res.json({ mensagem: 'Status atualizado!' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

// ─── DASHBOARD ───────────────────────────────────────
async function dashStats(req, res) {
  try {
    const db = await getDb();
    const v = (r) => toObjs(db.exec(r))[0];
    const totalPecas    = v(`SELECT COUNT(*) as n FROM pecas WHERE ativo=1`)?.n || 0;
    const totalConsultas= v(`SELECT COUNT(*) as n FROM consultas`)?.n || 0;
    const novas         = v(`SELECT COUNT(*) as n FROM consultas WHERE status='novo'`)?.n || 0;
    const valorEstoque  = v(`SELECT COALESCE(SUM(preco*estoque),0) as n FROM pecas WHERE ativo=1`)?.n || 0;

    const ultCons = toObjs(db.exec(`SELECT * FROM consultas ORDER BY criado_em DESC LIMIT 5`));
    const porCat  = toObjs(db.exec(`SELECT c.nome,c.icone,COUNT(p.id) as total FROM categorias c LEFT JOIN pecas p ON p.categoria_id=c.id AND p.ativo=1 GROUP BY c.id ORDER BY total DESC`));

    res.json({ total_pecas: totalPecas, total_consultas: totalConsultas, consultas_novas: novas,
      valor_estoque: valorEstoque, ultimas_consultas: ultCons, pecas_por_categoria: porCat });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}

module.exports = {
  login,
  listarCategorias, criarCategoria, deletarCategoria,
  listarPecas, buscarPeca, criarPeca, atualizarPeca, deletarPeca,
  criarConsulta, listarConsultas, atualizarStatusConsulta,
  dashStats
};
