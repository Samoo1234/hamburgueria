const express = require('express');
const router = express.Router();
const mesasService = require('../services/mesasService');

// Middleware de autenticação
const auth = require('../middleware/auth');

// Obter todas as mesas
router.get('/', auth(), async (req, res) => {
  try {
    const mesas = await mesasService.obterTodas();
    res.json(mesas);
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar mesas', error: error.message });
  }
});

// Obter mesas por status
router.get('/status/:status', auth(), async (req, res) => {
  try {
    const mesas = await mesasService.obterPorStatus(req.params.status);
    res.json(mesas);
  } catch (error) {
    console.error('Erro ao buscar mesas por status:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar mesas por status', error: error.message });
  }
});

// Obter mesas por garçom
router.get('/garcom/:id', auth(), async (req, res) => {
  try {
    const mesas = await mesasService.obterPorGarcom(req.params.id);
    res.json(mesas);
  } catch (error) {
    console.error('Erro ao buscar mesas por garçom:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar mesas por garçom', error: error.message });
  }
});

// Obter mesa por ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const mesa = await mesasService.obterPorId(req.params.id);
    if (!mesa) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada' });
    }
    res.json(mesa);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar mesa', error: error.message });
  }
});

// Criar nova mesa (requer autenticação de admin/gerente)
router.post('/', auth(['admin', 'gerente']), async (req, res) => {
  try {
    const mesa = await mesasService.criar(req.body);
    res.status(201).json(mesa);
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(500).json({ mensagem: 'Erro ao criar mesa', error: error.message });
  }
});

// Atualizar mesa existente (requer autenticação de admin/gerente)
router.put('/:id', auth(['admin', 'gerente']), async (req, res) => {
  try {
    const mesa = await mesasService.atualizar(req.params.id, req.body);
    if (!mesa) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada' });
    }
    res.json(mesa);
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar mesa', error: error.message });
  }
});

// Atualizar status da mesa
router.patch('/:id/status', auth(['admin', 'gerente', 'garcom']), async (req, res) => {
  try {
    const { status, garcomId } = req.body;
    if (!status) {
      return res.status(400).json({ mensagem: 'Status é obrigatório' });
    }
    
    const mesa = await mesasService.atualizarStatus(req.params.id, status, garcomId);
    res.json(mesa);
  } catch (error) {
    console.error('Erro ao atualizar status da mesa:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar status da mesa', error: error.message });
  }
});

// Excluir mesa (requer autenticação de admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await mesasService.excluir(req.params.id);
    res.json({ mensagem: 'Mesa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mesa:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir mesa', error: error.message });
  }
});

module.exports = router;