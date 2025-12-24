const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuariosService = require('../services/usuariosService');

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hamburgueria_secret');
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(400).json({ mensagem: 'Token inválido' });
  }
}

// Middleware para verificar permissões de admin/gerente
function verificarAdmin(req, res, next) {
  if (req.usuario.role !== 'admin' && req.usuario.role !== 'gerente') {
    return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
  }
  next();
}

// Login de usuário
router.post('/login', async (req, res) => {
  try {
    console.log('Tentando login com:', req.body);
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ mensagem: 'Email e senha são obrigatórios' });
    }

    // Verificar se o email existe e a senha está correta
    const resultado = await usuariosService.login(email, senha);

    // Gerar token JWT - não precisamos fazer isso aqui pois o serviço já faz
    res.json({
      token: resultado.token,
      usuario: {
        id: resultado.usuario.id,
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        role: resultado.usuario.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ mensagem: 'Erro ao fazer login', error: error.message });
  }
});

// Verificar se o token JWT é válido
router.get('/verificar-token', verificarToken, async (req, res) => {
  try {
    // Se chegou aqui, o token é válido (passou pelo middleware verificarToken)
    const usuario = await usuariosService.obterPorId(req.usuario.id);

    if (!usuario) {
      return res.json({ valido: false, mensagem: 'Usuário não encontrado' });
    }

    // Remover senha do objeto retornado
    const usuarioSemSenha = { ...usuario };
    delete usuarioSemSenha.senha;

    res.json({
      valido: true,
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.json({ valido: false, mensagem: error.message });
  }
});

// Obter usuário atual
router.get('/me', verificarToken, async (req, res) => {
  try {
    const usuario = await usuariosService.obterPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }

    // Remover senha do objeto retornado
    const usuarioSemSenha = { ...usuario };
    delete usuarioSemSenha.senha;

    res.json(usuarioSemSenha);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuário', error: error.message });
  }
});

// Obter todos os usuários (apenas admin/gerente)
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { role, ativo } = req.query;
    let filtro = {};

    if (role) filtro.role = role;
    if (ativo !== undefined) filtro.ativo = ativo === 'true';

    const usuarios = await usuariosService.obterTodos(filtro);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários', error: error.message });
  }
});

// Obter usuário por ID (apenas admin/gerente ou o próprio usuário)
router.get('/:id', verificarToken, async (req, res) => {
  try {
    // Verificar se é o próprio usuário ou admin/gerente
    if (req.usuario.id !== req.params.id && req.usuario.role !== 'admin' && req.usuario.role !== 'gerente') {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }

    const usuario = await usuariosService.obterPorId(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }

    // Remover senha do objeto retornado
    const usuarioSemSenha = { ...usuario };
    delete usuarioSemSenha.senha;

    res.json(usuarioSemSenha);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuário', error: error.message });
  }
});

// Criar novo usuário (apenas admin/gerente)
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;

    const novoUsuario = await usuariosService.registrar({
      nome,
      email,
      senha,
      role
    });

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso',
      usuario: novoUsuario
    });
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao criar usuário', error: error.message });
  }
});

// Atualizar usuário (apenas admin/gerente ou o próprio usuário)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    // Verificar se é o próprio usuário ou admin/gerente
    if (req.usuario.id !== req.params.id && req.usuario.role !== 'admin' && req.usuario.role !== 'gerente') {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }

    const { nome, email } = req.body;

    // Atualizar campos
    const dadosAtualizacao = {
      nome,
      email
    };

    // Apenas admin/gerente pode alterar cargo e status ativo
    if (req.usuario.role === 'admin' || req.usuario.role === 'gerente') {
      if (req.body.role) dadosAtualizacao.role = req.body.role;
      if (req.body.ativo !== undefined) dadosAtualizacao.ativo = req.body.ativo;
    }

    const usuario = await usuariosService.atualizar(req.params.id, dadosAtualizacao);

    res.json({
      mensagem: 'Usuário atualizado com sucesso',
      usuario
    });
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao atualizar usuário', error: error.message });
  }
});

// Alterar senha
router.patch('/:id/senha', verificarToken, async (req, res) => {
  try {
    // Verificar se é o próprio usuário ou admin/gerente
    if (req.usuario.id !== req.params.id && req.usuario.role !== 'admin' && req.usuario.role !== 'gerente') {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }

    const { senhaAtual, novaSenha } = req.body;

    // Se não for admin/gerente, verificar senha atual
    if (req.usuario.id === req.params.id && req.usuario.role !== 'admin' && req.usuario.role !== 'gerente') {
      const usuario = await usuariosService.obterPorId(req.params.id);
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

      if (!senhaValida) {
        return res.status(400).json({ mensagem: 'Senha atual incorreta' });
      }
    }

    // Atualizar senha
    const usuario = await usuariosService.atualizar(req.params.id, { senha: novaSenha });

    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(400).json({ mensagem: 'Erro ao alterar senha', error: error.message });
  }
});

// Desativar usuário (apenas admin/gerente)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await usuariosService.desativar(req.params.id);
    res.json({ mensagem: 'Usuário desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao desativar usuário', error: error.message });
  }
});

// Obter garçons disponíveis
router.get('/garcons/disponiveis', verificarToken, async (req, res) => {
  try {
    const garcons = await usuariosService.obterPorCargo('garcom');
    res.json(garcons);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar garçons', error: error.message });
  }
});

module.exports = router;