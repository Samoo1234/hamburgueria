const usuariosService = require('../services/usuariosService');

/**
 * Middleware de autenticação baseado em JWT para integração com Supabase
 * @param {Array} rolesPermitidos - Array de roles permitidos para acessar a rota
 * @returns {Function} Middleware Express
 */
const auth = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    try {
      // Obter token do cabeçalho
      const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
      }
      
      // Verificar token
      const resultado = usuariosService.verificarToken(token);
      
      if (!resultado.valido) {
        return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
      }
      
      // Verificar se o usuário existe e está ativo
      const usuario = await usuariosService.obterPorId(resultado.usuario.id);
      
      if (!usuario) {
        return res.status(401).json({ mensagem: 'Usuário não encontrado.' });
      }
      
      if (!usuario.ativo) {
        return res.status(403).json({ mensagem: 'Usuário desativado. Contate o administrador.' });
      }
      
      // Verificar permissões de role
      if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.role)) {
        return res.status(403).json({ 
          mensagem: 'Acesso negado. Permissão insuficiente.',
          roleAtual: usuario.role,
          rolesPermitidos
        });
      }
      
      // Adicionar usuário ao objeto de requisição
      req.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        role: usuario.role
      };
      
      next();
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      res.status(500).json({ mensagem: 'Erro interno no servidor', error: error.message });
    }
  };
};

module.exports = auth;
