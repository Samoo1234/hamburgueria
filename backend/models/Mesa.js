const mongoose = require('mongoose');

const MesaSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true,
    unique: true
  },
  capacidade: {
    type: Number,
    required: true,
    default: 4
  },
  status: {
    type: String,
    enum: ['livre', 'ocupada', 'reservada', 'aguardando_atendimento', 'em_atendimento'],
    default: 'livre'
  },
  garcom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  tempoOcupacao: {
    inicio: {
      type: Date,
      default: null
    },
    fim: {
      type: Date,
      default: null
    }
  },
  observacoes: {
    type: String,
    default: ''
  },
  chamandoGarcom: {
    type: Boolean,
    default: false
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mesa', MesaSchema);