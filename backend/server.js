const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const http = require('http');

// Configuração de variáveis de ambiente - DEVE ser antes de importar supabase!
dotenv.config();

const supabase = require('./config/supabase');

// Inicialização do app Express
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Importação de rotas
const produtosRoutes = require('./routes/produtos');
const pedidosRoutes = require('./routes/pedidos');
const mesasRoutes = require('./routes/mesas');
const usuariosRoutes = require('./routes/usuarios');
const financeiroRoutes = require('./routes/financeiro');

// Uso das rotas
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/financeiro', financeiroRoutes);

// Rota básica
app.get('/', (req, res) => {
  res.send('API da Hamburgueria está funcionando!');
});

// Configuração do Socket.io para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Evento para atualização de pedidos
  socket.on('novoPedido', (pedido) => {
    io.emit('atualizacaoPedido', pedido);
  });

  // Evento para atualização de status de pedido
  socket.on('atualizarStatusPedido', (data) => {
    io.emit('statusPedidoAtualizado', data);
  });

  // Evento para notificação de mesa
  socket.on('chamadoMesa', (mesa) => {
    io.emit('notificacaoMesa', mesa);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Porta do servidor
const PORT = 3333;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});