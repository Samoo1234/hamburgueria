const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  senha: {
    type: String,
    required: true
  },
  cargo: {
    type: String,
    enum: ['admin', 'gerente', 'garcom', 'cozinheiro', 'caixa'],
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  telefone: {
    type: String,
    default: ''
  },
  foto: {
    type: String,
    default: ''
  },
  mesasAtendendo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mesa'
  }],
  ultimoLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Método para criptografar a senha antes de salvar
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
UsuarioSchema.methods.compararSenha = async function(senhaFornecida) {
  return await bcrypt.compare(senhaFornecida, this.senha);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);