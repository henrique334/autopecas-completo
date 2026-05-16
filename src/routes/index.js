const express = require('express');
const r = express.Router();
const c = require('../controllers');
const { autenticar } = require('../middlewares/auth');
const { chat } = require('../controllers/chatbotController');

r.post('/auth/login',              c.login);

r.get('/categorias',               c.listarCategorias);
r.post('/categorias',              autenticar, c.criarCategoria);
r.delete('/categorias/:id',        autenticar, c.deletarCategoria);

r.get('/pecas',                    c.listarPecas);
r.get('/pecas/:id',                c.buscarPeca);
r.post('/pecas',                   autenticar, c.criarPeca);
r.put('/pecas/:id',                autenticar, c.atualizarPeca);
r.delete('/pecas/:id',             autenticar, c.deletarPeca);

r.post('/consultas',               c.criarConsulta);
r.get('/consultas',                autenticar, c.listarConsultas);
r.patch('/consultas/:id/status',   autenticar, c.atualizarStatusConsulta);

r.get('/dashboard',                autenticar, c.dashStats);

// Chatbot IA
r.post('/chat',                    chat);

module.exports = r;
