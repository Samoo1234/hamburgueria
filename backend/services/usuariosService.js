const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para gerenciamento de usuários usando Supabase
 */
const usuariosService = {
  /**
   * Obter todos os usuários
   */
  async obterTodos() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter usuário por ID
   */
  async obterPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Obter usuário por email
   */
  async obterPorEmail(email) {
    console.log('Buscando usuário por email:', email);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
    
    console.log('Usuário encontrado:', data);
    return data;
  },

  /**
   * Registrar novo usuário
   */
  async registrar(usuario) {
    // Verificar se o email já existe
    const usuarioExistente = await this.obterPorEmail(usuario.email);
    if (usuarioExistente) {
      throw new Error('Email já está em uso');
    }
    
    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(usuario.senha, salt);
    
    // Inserir usuário na tabela
    const novoUsuario = {
      id: uuidv4(),
      nome: usuario.nome,
      email: usuario.email,
      senha: senhaHash,
      role: usuario.role || 'garcom',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('usuarios')
      .insert([novoUsuario])
      .select();
    
    if (error) throw error;
    
    // Remover senha do objeto retornado
    const usuarioRetornado = data[0];
    delete usuarioRetornado.senha;
    
    return usuarioRetornado;
  },

  /**
   * Login de usuário
   */
  async login(email, senha) {
    console.log('Tentando login para:', email);
    
    try {
      // Buscar usuário pelo email
      const usuario = await this.obterPorEmail(email);
      
      if (!usuario) {
        console.log('Usuário não encontrado');
        throw new Error('Credenciais inválidas');
      }
      
      console.log('Usuário encontrado, verificando senha');
      
      // Verificar se o usuário está ativo
      if (!usuario.ativo) {
        console.log('Usuário desativado');
        throw new Error('Usuário desativado. Contate o administrador.');
      }
      
      // Verificar senha
      console.log('Comparando senha');
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      console.log('Senha válida?', senhaValida);
      
      if (!senhaValida) {
        console.log('Senha inválida');
        throw new Error('Credenciais inválidas');
      }
      
      console.log('Gerando token');
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: usuario.id, email, role: usuario.role },
        process.env.JWT_SECRET || 'hamburgueria_secret',
        { expiresIn: process.env.JWT_EXPIRE || '12h' }
      );
      
      console.log('Token gerado com sucesso');
      
      // Remover senha do objeto retornado
      const usuarioRetornado = { ...usuario };
      delete usuarioRetornado.senha;
      
      return {
        usuario: usuarioRetornado,
        token
      };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  /**
   * Atualizar usuário
   */
  async atualizar(id, usuario) {
    const dadosAtualizacao = {
      updated_at: new Date().toISOString()
    };
    
    // Atualizar apenas os campos fornecidos
    if (usuario.nome) dadosAtualizacao.nome = usuario.nome;
    if (usuario.email) dadosAtualizacao.email = usuario.email;
    if (usuario.role) dadosAtualizacao.role = usuario.role;
    if (usuario.ativo !== undefined) dadosAtualizacao.ativo = usuario.ativo;
    
    // Se a senha foi fornecida, atualizar a senha
    if (usuario.senha) {
      const salt = await bcrypt.genSalt(10);
      dadosAtualizacao.senha = await bcrypt.hash(usuario.senha, salt);
    }
    
    // Atualizar dados na tabela de usuários
    const { data, error } = await supabase
      .from('usuarios')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // Remover senha do objeto retornado
    const usuarioRetornado = data[0];
    if (usuarioRetornado) {
      delete usuarioRetornado.senha;
    }
    
    return usuarioRetornado;
  },

  /**
   * Desativar usuário
   */
  async desativar(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ 
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // Remover senha do objeto retornado
    const usuarioRetornado = data[0];
    delete usuarioRetornado.senha;
    
    return usuarioRetornado;
  },

  /**
   * Verificar token JWT
   */
  verificarToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hamburgueria_secret');
      return { valido: true, usuario: decoded };
    } catch (error) {
      return { valido: false, error: error.message };
    }
  },

  /**
   * Obter usuários por cargo
   */
  async obterPorCargo(cargo) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', cargo)
      .eq('ativo', true)
      .order('nome');
    
    if (error) throw error;
    
    // Remover senhas dos objetos retornados
    return data.map(usuario => {
      const usuarioSemSenha = { ...usuario };
      delete usuarioSemSenha.senha;
      return usuarioSemSenha;
    });
  }
};

module.exports = usuariosService;
