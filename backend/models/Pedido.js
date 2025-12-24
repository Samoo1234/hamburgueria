const mongoose = require('mongoose');

const ItemPedidoSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  precoUnitario: {
    type: Number,
    required: true
  },
  observacoes: {
    type: String,
    default: ''
  },
  adicionais: [{
    nome: String,
    preco: Number
  }]
});

const PedidoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  tipo: {
    type: String,
    enum: ['online', 'presencial'],
    required: true
  },
  mesa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mesa',
    default: null
  },
  cliente: {
    nome: {
      type: String,
      required: function() { return this.tipo === 'online'; }
    },
    telefone: String,
    endereco: {
      rua: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      cep: String
    }
  },
  itens: [ItemPedidoSchema],
  valorTotal: {
    type: Number,
    required: true
  },
  formaPagamento: {
    type: String,
    enum: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'vale_refeicao', 'pendente'],
    default: 'pendente'
  },
  status: {
    type: String,
    enum: ['recebido', 'em_preparacao', 'pronto', 'em_entrega', 'entregue', 'finalizado', 'cancelado'],
    default: 'recebido'
  },
  garcom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  observacoes: {
    type: String,
    default: ''
  },
  tempos: {
    criacao: {
      type: Date,
      default: Date.now
    },
    preparacao: Date,
    conclusao: Date,
    entrega: Date,
    finalizacao: Date
  }
});

// Gerar código único para o pedido antes de salvar
PedidoSchema.pre('save', async function(next) {
  if (!this.codigo) {
    const data = new Date();
    const ano = data.getFullYear().toString().substr(-2);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    
    // Formato: AAMMDD-XXXX (Ano, Mês, Dia - Número aleatório de 4 dígitos)
    this.codigo = `${ano}${mes}${dia}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Pedido', PedidoSchema);