const express = require('express');
const router = express.Router();
const produtosService = require('../services/produtosService');

// Middleware de autenticação
const auth = require('../middleware/auth');

// Obter todos os produtos
router.get('/', async (req, res) => {
  try {
    const { categoria, disponivel, destaque } = req.query;
    let filtro = {};
    
    if (categoria) filtro.categoria = categoria;
    if (disponivel !== undefined) filtro.disponivel = disponivel === 'true';
    if (destaque !== undefined) filtro.destaque = destaque === 'true';
    
    const produtos = await produtosService.obterTodos(filtro);
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar produtos', error: error.message });
  }
});

// Obter produtos por categoria
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const produtos = await produtosService.obterPorCategoria(req.params.categoria);
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar produtos por categoria', error: error.message });
  }
});

// Obter produtos em destaque
router.get('/destaques', async (req, res) => {
  try {
    const produtos = await produtosService.obterDestaques();
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar produtos em destaque', error: error.message });
  }
});

// Obter produto por ID
router.get('/:id', async (req, res) => {
  try {
    const produto = await produtosService.obterPorId(req.params.id);
    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar produto', error: error.message });
  }
});

// Criar novo produto (requer autenticação de admin/gerente)
router.post('/', auth(['admin', 'gerente']), async (req, res) => {
  try {
    const produto = await produtosService.criar(req.body);
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ mensagem: 'Erro ao criar produto', error: error.message });
  }
});

// Atualizar produto existente (requer autenticação de admin/gerente)
router.put('/:id', auth(['admin', 'gerente']), async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    const produto = await produtosService.atualizar(req.params.id, req.body);
    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar produto', error: error.message });
  }
});

// Atualizar disponibilidade do produto
router.patch('/:id/disponibilidade', auth(['admin', 'gerente']), async (req, res) => {
  try {
    const { disponivel } = req.body;
    if (disponivel === undefined) {
      return res.status(400).json({ mensagem: 'O campo disponível é obrigatório' });
    }
    
    const produto = await produtosService.obterPorId(req.params.id);
    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' });
    }
    
    produto.disponivel = disponivel;
    produto.updatedAt = Date.now();
    await produtosService.atualizar(req.params.id, produto);
    
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar disponibilidade', error: error.message });
  }
});

// Excluir produto (requer autenticação de admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await produtosService.excluir(req.params.id);
    res.json({ mensagem: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir produto', error: error.message });
  }
});

module.exports = router;