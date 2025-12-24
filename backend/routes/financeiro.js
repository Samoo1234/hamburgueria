const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

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

// Middleware para verificar se é admin ou gerente
function verificarAdminOuGerente(req, res, next) {
    const cargo = req.usuario.cargo || req.usuario.role;
    if (!['admin', 'gerente'].includes(cargo)) {
        return res.status(403).json({ mensagem: 'Acesso negado. Apenas administradores e gerentes.' });
    }
    next();
}

// =============================================
// CATEGORIAS FINANCEIRAS
// =============================================

// Listar categorias
router.get('/categorias', verificarToken, async (req, res) => {
    try {
        const { tipo } = req.query;
        let query = supabase.from('categorias_financeiras').select('*').eq('ativo', true);

        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        const { data, error } = await query.order('nome');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar categorias', error: error.message });
    }
});

// Criar categoria
router.post('/categorias', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { nome, tipo, descricao } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({ mensagem: 'Nome e tipo são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('categorias_financeiras')
            .insert({ nome, tipo, descricao })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao criar categoria', error: error.message });
    }
});

// =============================================
// FORMAS DE PAGAMENTO
// =============================================

// Listar formas de pagamento
router.get('/formas-pagamento', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('formas_pagamento')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar formas de pagamento', error: error.message });
    }
});

// =============================================
// CAIXA
// =============================================

// Obter caixa atual (aberto)
router.get('/caixa/atual', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('caixa')
            .select(`
        *,
        usuario_abertura:usuarios!caixa_usuario_abertura_id_fkey(id, nome),
        movimentacoes:movimentacoes_caixa(*)
      `)
            .eq('status', 'aberto')
            .order('data_abertura', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || null);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar caixa atual', error: error.message });
    }
});

// Listar histórico de caixas
router.get('/caixa', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { data_inicio, data_fim, limit = 30 } = req.query;

        let query = supabase
            .from('caixa')
            .select(`
        *,
        usuario_abertura:usuarios!caixa_usuario_abertura_id_fkey(id, nome),
        usuario_fechamento:usuarios!caixa_usuario_fechamento_id_fkey(id, nome)
      `)
            .order('data_abertura', { ascending: false })
            .limit(limit);

        if (data_inicio) {
            query = query.gte('data_abertura', data_inicio);
        }
        if (data_fim) {
            query = query.lte('data_abertura', data_fim);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar histórico de caixas', error: error.message });
    }
});

// Abrir caixa
router.post('/caixa/abrir', verificarToken, async (req, res) => {
    try {
        const { valor_abertura, observacoes } = req.body;

        // Verificar se já existe um caixa aberto
        const { data: caixaAberto } = await supabase
            .from('caixa')
            .select('id')
            .eq('status', 'aberto')
            .limit(1)
            .single();

        if (caixaAberto) {
            return res.status(400).json({ mensagem: 'Já existe um caixa aberto. Feche-o antes de abrir outro.' });
        }

        const { data, error } = await supabase
            .from('caixa')
            .insert({
                usuario_abertura_id: req.usuario.id,
                valor_abertura: valor_abertura || 0,
                valor_sistema: valor_abertura || 0,
                observacoes: observacoes || ''
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao abrir caixa', error: error.message });
    }
});

// Fechar caixa
router.post('/caixa/fechar', verificarToken, async (req, res) => {
    try {
        const { valor_fechamento, observacoes } = req.body;

        // Buscar caixa aberto
        const { data: caixaAberto, error: erroBusca } = await supabase
            .from('caixa')
            .select('*')
            .eq('status', 'aberto')
            .limit(1)
            .single();

        if (erroBusca || !caixaAberto) {
            return res.status(400).json({ mensagem: 'Não há caixa aberto para fechar.' });
        }

        // Calcular diferença
        const valorSistema = caixaAberto.valor_sistema || 0;
        const diferenca = (valor_fechamento || 0) - valorSistema;

        const { data, error } = await supabase
            .from('caixa')
            .update({
                data_fechamento: new Date().toISOString(),
                usuario_fechamento_id: req.usuario.id,
                valor_fechamento: valor_fechamento || 0,
                diferenca,
                status: 'fechado',
                observacoes: caixaAberto.observacoes + (observacoes ? '\n' + observacoes : '')
            })
            .eq('id', caixaAberto.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao fechar caixa', error: error.message });
    }
});

// =============================================
// MOVIMENTAÇÕES DO CAIXA
// =============================================

// Listar movimentações do caixa atual
router.get('/movimentacoes', verificarToken, async (req, res) => {
    try {
        const { caixa_id } = req.query;

        let query = supabase
            .from('movimentacoes_caixa')
            .select(`
        *,
        forma_pagamento:formas_pagamento(id, nome),
        usuario:usuarios(id, nome)
      `)
            .order('created_at', { ascending: false });

        if (caixa_id) {
            query = query.eq('caixa_id', caixa_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar movimentações', error: error.message });
    }
});

// Registrar movimentação
router.post('/movimentacoes', verificarToken, async (req, res) => {
    try {
        const { tipo, valor, descricao, forma_pagamento_id, pedido_id } = req.body;

        if (!tipo || !valor || !descricao) {
            return res.status(400).json({ mensagem: 'Tipo, valor e descrição são obrigatórios' });
        }

        // Buscar caixa aberto
        const { data: caixaAberto, error: erroBusca } = await supabase
            .from('caixa')
            .select('id')
            .eq('status', 'aberto')
            .limit(1)
            .single();

        if (erroBusca || !caixaAberto) {
            return res.status(400).json({ mensagem: 'Não há caixa aberto. Abra o caixa antes de registrar movimentações.' });
        }

        const { data, error } = await supabase
            .from('movimentacoes_caixa')
            .insert({
                caixa_id: caixaAberto.id,
                tipo,
                valor,
                descricao,
                forma_pagamento_id,
                pedido_id,
                usuario_id: req.usuario.id
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao registrar movimentação', error: error.message });
    }
});

// =============================================
// CONTAS A PAGAR
// =============================================

// Listar contas a pagar
router.get('/contas-pagar', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { status, data_inicio, data_fim, limit = 100 } = req.query;

        let query = supabase
            .from('contas_pagar')
            .select(`
        *,
        categoria:categorias_financeiras(id, nome),
        forma_pagamento:formas_pagamento(id, nome)
      `)
            .order('data_vencimento', { ascending: true })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }
        if (data_inicio) {
            query = query.gte('data_vencimento', data_inicio);
        }
        if (data_fim) {
            query = query.lte('data_vencimento', data_fim);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar contas a pagar', error: error.message });
    }
});

// Criar conta a pagar
router.post('/contas-pagar', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { descricao, fornecedor, valor, data_vencimento, categoria_id, observacoes } = req.body;

        if (!descricao || !valor || !data_vencimento) {
            return res.status(400).json({ mensagem: 'Descrição, valor e data de vencimento são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('contas_pagar')
            .insert({
                descricao,
                fornecedor,
                valor,
                data_vencimento,
                categoria_id,
                observacoes
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao criar conta a pagar', error: error.message });
    }
});

// Atualizar conta a pagar
router.put('/contas-pagar/:id', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, fornecedor, valor, data_vencimento, categoria_id, observacoes } = req.body;

        const { data, error } = await supabase
            .from('contas_pagar')
            .update({
                descricao,
                fornecedor,
                valor,
                data_vencimento,
                categoria_id,
                observacoes
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao atualizar conta a pagar', error: error.message });
    }
});

// Dar baixa em conta a pagar
router.patch('/contas-pagar/:id/pagar', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;
        const { forma_pagamento_id, data_pagamento } = req.body;

        const { data, error } = await supabase
            .from('contas_pagar')
            .update({
                status: 'pago',
                forma_pagamento_id,
                data_pagamento: data_pagamento || new Date().toISOString().split('T')[0]
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Registrar movimentação no caixa (saída)
        const { data: caixaAberto } = await supabase
            .from('caixa')
            .select('id')
            .eq('status', 'aberto')
            .limit(1)
            .single();

        if (caixaAberto) {
            await supabase.from('movimentacoes_caixa').insert({
                caixa_id: caixaAberto.id,
                tipo: 'saida',
                valor: data.valor,
                descricao: `Pagamento: ${data.descricao}`,
                forma_pagamento_id
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao dar baixa na conta', error: error.message });
    }
});

// Cancelar conta a pagar
router.patch('/contas-pagar/:id/cancelar', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('contas_pagar')
            .update({ status: 'cancelado' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao cancelar conta', error: error.message });
    }
});

// Deletar conta a pagar
router.delete('/contas-pagar/:id', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('contas_pagar')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ mensagem: 'Conta deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao deletar conta', error: error.message });
    }
});

// =============================================
// CONTAS A RECEBER
// =============================================

// Listar contas a receber
router.get('/contas-receber', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { status, data_inicio, data_fim, limit = 100 } = req.query;

        let query = supabase
            .from('contas_receber')
            .select(`
        *,
        categoria:categorias_financeiras(id, nome),
        forma_pagamento:formas_pagamento(id, nome)
      `)
            .order('data_vencimento', { ascending: true })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }
        if (data_inicio) {
            query = query.gte('data_vencimento', data_inicio);
        }
        if (data_fim) {
            query = query.lte('data_vencimento', data_fim);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar contas a receber', error: error.message });
    }
});

// Criar conta a receber
router.post('/contas-receber', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { descricao, cliente, valor, data_vencimento, categoria_id, pedido_id, observacoes } = req.body;

        if (!descricao || !valor || !data_vencimento) {
            return res.status(400).json({ mensagem: 'Descrição, valor e data de vencimento são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('contas_receber')
            .insert({
                descricao,
                cliente,
                valor,
                data_vencimento,
                categoria_id,
                pedido_id,
                observacoes
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao criar conta a receber', error: error.message });
    }
});

// Atualizar conta a receber
router.put('/contas-receber/:id', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, cliente, valor, data_vencimento, categoria_id, observacoes } = req.body;

        const { data, error } = await supabase
            .from('contas_receber')
            .update({
                descricao,
                cliente,
                valor,
                data_vencimento,
                categoria_id,
                observacoes
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao atualizar conta a receber', error: error.message });
    }
});

// Dar baixa em conta a receber
router.patch('/contas-receber/:id/receber', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;
        const { forma_pagamento_id, data_recebimento } = req.body;

        const { data, error } = await supabase
            .from('contas_receber')
            .update({
                status: 'recebido',
                forma_pagamento_id,
                data_recebimento: data_recebimento || new Date().toISOString().split('T')[0]
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Registrar movimentação no caixa (entrada)
        const { data: caixaAberto } = await supabase
            .from('caixa')
            .select('id')
            .eq('status', 'aberto')
            .limit(1)
            .single();

        if (caixaAberto) {
            await supabase.from('movimentacoes_caixa').insert({
                caixa_id: caixaAberto.id,
                tipo: 'entrada',
                valor: data.valor,
                descricao: `Recebimento: ${data.descricao}`,
                forma_pagamento_id
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao dar baixa na conta', error: error.message });
    }
});

// Cancelar conta a receber
router.patch('/contas-receber/:id/cancelar', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('contas_receber')
            .update({ status: 'cancelado' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao cancelar conta', error: error.message });
    }
});

// Deletar conta a receber
router.delete('/contas-receber/:id', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('contas_receber')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ mensagem: 'Conta deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao deletar conta', error: error.message });
    }
});

// =============================================
// DASHBOARD E RELATÓRIOS
// =============================================

// Dashboard financeiro
router.get('/dashboard', verificarToken, async (req, res) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        // Pedidos do dia
        const { data: pedidosHoje, error: erroPedidos } = await supabase
            .from('pedidos')
            .select('id, valor_total, status')
            .gte('created_at', hoje + 'T00:00:00')
            .lte('created_at', hoje + 'T23:59:59');

        // Caixa atual
        const { data: caixaAtual } = await supabase
            .from('caixa')
            .select('*')
            .eq('status', 'aberto')
            .limit(1)
            .single();

        // Contas a pagar pendentes
        const { data: contasAPagar } = await supabase
            .from('contas_pagar')
            .select('id, valor, data_vencimento')
            .eq('status', 'pendente');

        // Contas a receber pendentes
        const { data: contasAReceber } = await supabase
            .from('contas_receber')
            .select('id, valor, data_vencimento')
            .eq('status', 'pendente');

        // Mesas ocupadas
        const { data: mesasOcupadas } = await supabase
            .from('mesas')
            .select('id')
            .eq('status', 'ocupada');

        // Produtos ativos
        const { data: produtosAtivos } = await supabase
            .from('produtos')
            .select('id')
            .eq('disponivel', true);

        // Calcular totais
        const faturamentoHoje = (pedidosHoje || [])
            .filter(p => p.status !== 'cancelado')
            .reduce((sum, p) => sum + (parseFloat(p.valor_total) || 0), 0);

        const totalAPagar = (contasAPagar || []).reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0);
        const totalAReceber = (contasAReceber || []).reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0);

        // Contas vencendo hoje
        const contasVencendoHoje = (contasAPagar || []).filter(c => c.data_vencimento === hoje).length;

        res.json({
            pedidosHoje: (pedidosHoje || []).length,
            faturamentoHoje,
            mesasOcupadas: (mesasOcupadas || []).length,
            produtosAtivos: (produtosAtivos || []).length,
            caixaAberto: !!caixaAtual,
            saldoCaixa: caixaAtual ? parseFloat(caixaAtual.valor_sistema) || 0 : 0,
            totalAPagar,
            totalAReceber,
            contasVencendoHoje,
            saldoGeral: totalAReceber - totalAPagar
        });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar dados do dashboard', error: error.message });
    }
});

// Fluxo de caixa
router.get('/fluxo-caixa', verificarToken, verificarAdminOuGerente, async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        if (!data_inicio || !data_fim) {
            return res.status(400).json({ mensagem: 'Data início e data fim são obrigatórias' });
        }

        // Buscar todas as movimentações no período
        const { data: movimentacoes, error: erroMov } = await supabase
            .from('movimentacoes_caixa')
            .select(`
        *,
        forma_pagamento:formas_pagamento(id, nome)
      `)
            .gte('created_at', data_inicio)
            .lte('created_at', data_fim + 'T23:59:59')
            .order('created_at');

        // Buscar contas pagas no período
        const { data: contasPagas } = await supabase
            .from('contas_pagar')
            .select('*')
            .eq('status', 'pago')
            .gte('data_pagamento', data_inicio)
            .lte('data_pagamento', data_fim);

        // Buscar contas recebidas no período
        const { data: contasRecebidas } = await supabase
            .from('contas_receber')
            .select('*')
            .eq('status', 'recebido')
            .gte('data_recebimento', data_inicio)
            .lte('data_recebimento', data_fim);

        // Calcular totais
        const totalEntradas = (movimentacoes || [])
            .filter(m => ['entrada', 'reforco'].includes(m.tipo))
            .reduce((sum, m) => sum + parseFloat(m.valor), 0);

        const totalSaidas = (movimentacoes || [])
            .filter(m => ['saida', 'sangria'].includes(m.tipo))
            .reduce((sum, m) => sum + parseFloat(m.valor), 0);

        res.json({
            movimentacoes: movimentacoes || [],
            contasPagas: contasPagas || [],
            contasRecebidas: contasRecebidas || [],
            resumo: {
                totalEntradas,
                totalSaidas,
                saldo: totalEntradas - totalSaidas
            }
        });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar fluxo de caixa', error: error.message });
    }
});

module.exports = router;
