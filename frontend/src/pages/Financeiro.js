import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Tabs, Tab,
    CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, FormControl, InputLabel, Select,
    MenuItem, Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import {
    AccountBalance as AccountBalanceIcon,
    Payment as PaymentIcon,
    Receipt as ReceiptIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    PointOfSale as PointOfSaleIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../services/api';

function Financeiro() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Estados do Caixa
    const [caixaAtual, setCaixaAtual] = useState(null);
    const [dialogAbrirCaixa, setDialogAbrirCaixa] = useState(false);
    const [dialogFecharCaixa, setDialogFecharCaixa] = useState(false);
    const [valorAbertura, setValorAbertura] = useState('');
    const [valorFechamento, setValorFechamento] = useState('');
    const [observacoesCaixa, setObservacoesCaixa] = useState('');
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [dialogMovimentacao, setDialogMovimentacao] = useState(false);
    const [novaMovimentacao, setNovaMovimentacao] = useState({
        tipo: 'entrada',
        valor: '',
        descricao: '',
        forma_pagamento_id: ''
    });

    // Estados de Contas a Pagar
    const [contasPagar, setContasPagar] = useState([]);
    const [dialogContaPagar, setDialogContaPagar] = useState(false);
    const [contaPagarEdit, setContaPagarEdit] = useState(null);
    const [novaContaPagar, setNovaContaPagar] = useState({
        descricao: '',
        fornecedor: '',
        valor: '',
        data_vencimento: new Date(),
        categoria_id: '',
        observacoes: ''
    });

    // Estados de Contas a Receber
    const [contasReceber, setContasReceber] = useState([]);
    const [dialogContaReceber, setDialogContaReceber] = useState(false);
    const [contaReceberEdit, setContaReceberEdit] = useState(null);
    const [novaContaReceber, setNovaContaReceber] = useState({
        descricao: '',
        cliente: '',
        valor: '',
        data_vencimento: new Date(),
        categoria_id: '',
        observacoes: ''
    });

    // Estados de Fluxo de Caixa
    const [dataInicio, setDataInicio] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [dataFim, setDataFim] = useState(new Date());
    const [fluxoCaixa, setFluxoCaixa] = useState(null);

    // Dados auxiliares
    const [categorias, setCategorias] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);

    // Dialog para dar baixa
    const [dialogBaixa, setDialogBaixa] = useState(false);
    const [contaBaixa, setContaBaixa] = useState(null);
    const [tipoBaixa, setTipoBaixa] = useState('');
    const [formaPagamentoBaixa, setFormaPagamentoBaixa] = useState('');

    useEffect(() => {
        fetchDadosIniciais();
    }, []);

    useEffect(() => {
        if (tabValue === 0) fetchCaixa();
        if (tabValue === 1) fetchContasPagar();
        if (tabValue === 2) fetchContasReceber();
        if (tabValue === 3) fetchFluxoCaixa();
    }, [tabValue]);

    const fetchDadosIniciais = async () => {
        try {
            setLoading(true);
            const [catResponse, fpResponse] = await Promise.all([
                api.get('/api/financeiro/categorias'),
                api.get('/api/financeiro/formas-pagamento')
            ]);
            setCategorias(catResponse.data);
            setFormasPagamento(fpResponse.data);
            await fetchCaixa();
        } catch (err) {
            console.error('Erro ao carregar dados iniciais:', err);
            setError('Erro ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCaixa = async () => {
        try {
            const response = await api.get('/api/financeiro/caixa/atual');
            setCaixaAtual(response.data);
            if (response.data) {
                const movResponse = await api.get(`/api/financeiro/movimentacoes?caixa_id=${response.data.id}`);
                setMovimentacoes(movResponse.data);
            } else {
                setMovimentacoes([]);
            }
        } catch (err) {
            console.error('Erro ao buscar caixa:', err);
        }
    };

    const fetchContasPagar = async () => {
        try {
            const response = await api.get('/api/financeiro/contas-pagar');
            setContasPagar(response.data);
        } catch (err) {
            setError('Erro ao buscar contas a pagar');
        }
    };

    const fetchContasReceber = async () => {
        try {
            const response = await api.get('/api/financeiro/contas-receber');
            setContasReceber(response.data);
        } catch (err) {
            setError('Erro ao buscar contas a receber');
        }
    };

    const fetchFluxoCaixa = async () => {
        try {
            const response = await api.get('/api/financeiro/fluxo-caixa', {
                params: {
                    data_inicio: dataInicio.toISOString().split('T')[0],
                    data_fim: dataFim.toISOString().split('T')[0]
                }
            });
            setFluxoCaixa(response.data);
        } catch (err) {
            setError('Erro ao buscar fluxo de caixa');
        }
    };

    // Handlers do Caixa
    const handleAbrirCaixa = async () => {
        try {
            await api.post('/api/financeiro/caixa/abrir', {
                valor_abertura: parseFloat(valorAbertura) || 0,
                observacoes: observacoesCaixa
            });
            setSuccess('Caixa aberto com sucesso!');
            setDialogAbrirCaixa(false);
            setValorAbertura('');
            setObservacoesCaixa('');
            fetchCaixa();
        } catch (err) {
            setError(err.response?.data?.mensagem || 'Erro ao abrir caixa');
        }
    };

    const handleFecharCaixa = async () => {
        try {
            await api.post('/api/financeiro/caixa/fechar', {
                valor_fechamento: parseFloat(valorFechamento) || 0,
                observacoes: observacoesCaixa
            });
            setSuccess('Caixa fechado com sucesso!');
            setDialogFecharCaixa(false);
            setValorFechamento('');
            setObservacoesCaixa('');
            fetchCaixa();
        } catch (err) {
            setError(err.response?.data?.mensagem || 'Erro ao fechar caixa');
        }
    };

    const handleRegistrarMovimentacao = async () => {
        try {
            await api.post('/api/financeiro/movimentacoes', {
                ...novaMovimentacao,
                valor: parseFloat(novaMovimentacao.valor)
            });
            setSuccess('Movimentação registrada!');
            setDialogMovimentacao(false);
            setNovaMovimentacao({ tipo: 'entrada', valor: '', descricao: '', forma_pagamento_id: '' });
            fetchCaixa();
        } catch (err) {
            setError(err.response?.data?.mensagem || 'Erro ao registrar movimentação');
        }
    };

    // Handlers de Contas a Pagar
    const handleSalvarContaPagar = async () => {
        try {
            const dados = {
                ...novaContaPagar,
                valor: parseFloat(novaContaPagar.valor),
                data_vencimento: novaContaPagar.data_vencimento.toISOString().split('T')[0]
            };

            if (contaPagarEdit) {
                await api.put(`/api/financeiro/contas-pagar/${contaPagarEdit.id}`, dados);
                setSuccess('Conta atualizada!');
            } else {
                await api.post('/api/financeiro/contas-pagar', dados);
                setSuccess('Conta criada!');
            }

            setDialogContaPagar(false);
            setContaPagarEdit(null);
            setNovaContaPagar({ descricao: '', fornecedor: '', valor: '', data_vencimento: new Date(), categoria_id: '', observacoes: '' });
            fetchContasPagar();
        } catch (err) {
            setError(err.response?.data?.mensagem || 'Erro ao salvar conta');
        }
    };

    const handleDeleteContaPagar = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
        try {
            await api.delete(`/api/financeiro/contas-pagar/${id}`);
            setSuccess('Conta excluída!');
            fetchContasPagar();
        } catch (err) {
            setError('Erro ao excluir conta');
        }
    };

    // Handlers de Contas a Receber
    const handleSalvarContaReceber = async () => {
        try {
            const dados = {
                ...novaContaReceber,
                valor: parseFloat(novaContaReceber.valor),
                data_vencimento: novaContaReceber.data_vencimento.toISOString().split('T')[0]
            };

            if (contaReceberEdit) {
                await api.put(`/api/financeiro/contas-receber/${contaReceberEdit.id}`, dados);
                setSuccess('Conta atualizada!');
            } else {
                await api.post('/api/financeiro/contas-receber', dados);
                setSuccess('Conta criada!');
            }

            setDialogContaReceber(false);
            setContaReceberEdit(null);
            setNovaContaReceber({ descricao: '', cliente: '', valor: '', data_vencimento: new Date(), categoria_id: '', observacoes: '' });
            fetchContasReceber();
        } catch (err) {
            setError(err.response?.data?.mensagem || 'Erro ao salvar conta');
        }
    };

    const handleDeleteContaReceber = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
        try {
            await api.delete(`/api/financeiro/contas-receber/${id}`);
            setSuccess('Conta excluída!');
            fetchContasReceber();
        } catch (err) {
            setError('Erro ao excluir conta');
        }
    };

    // Handler de baixa
    const handleDarBaixa = async () => {
        try {
            if (tipoBaixa === 'pagar') {
                await api.patch(`/api/financeiro/contas-pagar/${contaBaixa.id}/pagar`, {
                    forma_pagamento_id: formaPagamentoBaixa
                });
            } else {
                await api.patch(`/api/financeiro/contas-receber/${contaBaixa.id}/receber`, {
                    forma_pagamento_id: formaPagamentoBaixa
                });
            }
            setSuccess('Baixa registrada!');
            setDialogBaixa(false);
            setContaBaixa(null);
            setFormaPagamentoBaixa('');
            if (tipoBaixa === 'pagar') fetchContasPagar();
            else fetchContasReceber();
        } catch (err) {
            setError('Erro ao dar baixa');
        }
    };

    const formatarValor = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    };

    const formatarData = (data) => {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const getStatusChip = (status) => {
        const configs = {
            pendente: { color: 'warning', label: 'Pendente' },
            pago: { color: 'success', label: 'Pago' },
            recebido: { color: 'success', label: 'Recebido' },
            vencido: { color: 'error', label: 'Vencido' },
            cancelado: { color: 'default', label: 'Cancelado' }
        };
        const config = configs[status] || { color: 'default', label: status };
        return <Chip size="small" color={config.color} label={config.label} />;
    };

    const getTipoMovimentacaoChip = (tipo) => {
        const configs = {
            entrada: { color: 'success', label: 'Entrada' },
            saida: { color: 'error', label: 'Saída' },
            sangria: { color: 'warning', label: 'Sangria' },
            reforco: { color: 'info', label: 'Reforço' }
        };
        const config = configs[tipo] || { color: 'default', label: tipo };
        return <Chip size="small" color={config.color} label={config.label} />;
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Financeiro
            </Typography>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab icon={<PointOfSaleIcon />} label="Caixa" />
                    <Tab icon={<TrendingDownIcon />} label="Contas a Pagar" />
                    <Tab icon={<TrendingUpIcon />} label="Contas a Receber" />
                    <Tab icon={<AccountBalanceIcon />} label="Fluxo de Caixa" />
                </Tabs>
            </Paper>

            {/* ==================== ABA CAIXA ==================== */}
            {tabValue === 0 && (
                <Box>
                    {/* Card de Status do Caixa */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6">
                                    Status do Caixa: {caixaAtual ?
                                        <Chip color="success" label="ABERTO" /> :
                                        <Chip color="error" label="FECHADO" />
                                    }
                                </Typography>
                                {caixaAtual && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Aberto em: {formatarData(caixaAtual.data_abertura)} às {new Date(caixaAtual.data_abertura).toLocaleTimeString('pt-BR')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Por: {caixaAtual.usuario_abertura?.nome}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                {caixaAtual ? (
                                    <Box>
                                        <Typography variant="h4" color="primary">
                                            {formatarValor(caixaAtual.valor_sistema)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Saldo atual do caixa
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">
                                        Nenhum caixa aberto
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            {!caixaAtual ? (
                                <Button variant="contained" color="primary" onClick={() => setDialogAbrirCaixa(true)}>
                                    Abrir Caixa
                                </Button>
                            ) : (
                                <>
                                    <Button variant="contained" color="success" onClick={() => setDialogMovimentacao(true)}>
                                        <AddIcon sx={{ mr: 1 }} /> Movimentação
                                    </Button>
                                    <Button variant="contained" color="error" onClick={() => setDialogFecharCaixa(true)}>
                                        Fechar Caixa
                                    </Button>
                                </>
                            )}
                            <Button variant="outlined" onClick={fetchCaixa}>
                                <RefreshIcon sx={{ mr: 1 }} /> Atualizar
                            </Button>
                        </Box>
                    </Paper>

                    {/* Tabela de Movimentações */}
                    {caixaAtual && (
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Movimentações do Dia
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Hora</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Descrição</TableCell>
                                            <TableCell>Forma Pagamento</TableCell>
                                            <TableCell align="right">Valor</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {movimentacoes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">Nenhuma movimentação registrada</TableCell>
                                            </TableRow>
                                        ) : (
                                            movimentacoes.map((mov) => (
                                                <TableRow key={mov.id}>
                                                    <TableCell>{new Date(mov.created_at).toLocaleTimeString('pt-BR')}</TableCell>
                                                    <TableCell>{getTipoMovimentacaoChip(mov.tipo)}</TableCell>
                                                    <TableCell>{mov.descricao}</TableCell>
                                                    <TableCell>{mov.forma_pagamento?.nome || '-'}</TableCell>
                                                    <TableCell align="right" sx={{
                                                        color: ['entrada', 'reforco'].includes(mov.tipo) ? 'success.main' : 'error.main',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {['entrada', 'reforco'].includes(mov.tipo) ? '+' : '-'} {formatarValor(mov.valor)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </Box>
            )}

            {/* ==================== ABA CONTAS A PAGAR ==================== */}
            {tabValue === 1 && (
                <Box>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Contas a Pagar</Typography>
                        <Button variant="contained" onClick={() => setDialogContaPagar(true)}>
                            <AddIcon sx={{ mr: 1 }} /> Nova Conta
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Descrição</TableCell>
                                    <TableCell>Fornecedor</TableCell>
                                    <TableCell>Categoria</TableCell>
                                    <TableCell>Vencimento</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contasPagar.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">Nenhuma conta a pagar</TableCell>
                                    </TableRow>
                                ) : (
                                    contasPagar.map((conta) => (
                                        <TableRow key={conta.id}>
                                            <TableCell>{conta.descricao}</TableCell>
                                            <TableCell>{conta.fornecedor || '-'}</TableCell>
                                            <TableCell>{conta.categoria?.nome || '-'}</TableCell>
                                            <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                                            <TableCell align="right">{formatarValor(conta.valor)}</TableCell>
                                            <TableCell>{getStatusChip(conta.status)}</TableCell>
                                            <TableCell align="center">
                                                {conta.status === 'pendente' && (
                                                    <>
                                                        <IconButton size="small" color="success" onClick={() => {
                                                            setContaBaixa(conta);
                                                            setTipoBaixa('pagar');
                                                            setDialogBaixa(true);
                                                        }}>
                                                            <CheckIcon />
                                                        </IconButton>
                                                        <IconButton size="small" color="primary" onClick={() => {
                                                            setContaPagarEdit(conta);
                                                            setNovaContaPagar({
                                                                descricao: conta.descricao,
                                                                fornecedor: conta.fornecedor || '',
                                                                valor: conta.valor,
                                                                data_vencimento: new Date(conta.data_vencimento),
                                                                categoria_id: conta.categoria_id || '',
                                                                observacoes: conta.observacoes || ''
                                                            });
                                                            setDialogContaPagar(true);
                                                        }}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                                <IconButton size="small" color="error" onClick={() => handleDeleteContaPagar(conta.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* ==================== ABA CONTAS A RECEBER ==================== */}
            {tabValue === 2 && (
                <Box>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Contas a Receber</Typography>
                        <Button variant="contained" onClick={() => setDialogContaReceber(true)}>
                            <AddIcon sx={{ mr: 1 }} /> Nova Conta
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Descrição</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Categoria</TableCell>
                                    <TableCell>Vencimento</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contasReceber.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">Nenhuma conta a receber</TableCell>
                                    </TableRow>
                                ) : (
                                    contasReceber.map((conta) => (
                                        <TableRow key={conta.id}>
                                            <TableCell>{conta.descricao}</TableCell>
                                            <TableCell>{conta.cliente || '-'}</TableCell>
                                            <TableCell>{conta.categoria?.nome || '-'}</TableCell>
                                            <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                                            <TableCell align="right">{formatarValor(conta.valor)}</TableCell>
                                            <TableCell>{getStatusChip(conta.status)}</TableCell>
                                            <TableCell align="center">
                                                {conta.status === 'pendente' && (
                                                    <>
                                                        <IconButton size="small" color="success" onClick={() => {
                                                            setContaBaixa(conta);
                                                            setTipoBaixa('receber');
                                                            setDialogBaixa(true);
                                                        }}>
                                                            <CheckIcon />
                                                        </IconButton>
                                                        <IconButton size="small" color="primary" onClick={() => {
                                                            setContaReceberEdit(conta);
                                                            setNovaContaReceber({
                                                                descricao: conta.descricao,
                                                                cliente: conta.cliente || '',
                                                                valor: conta.valor,
                                                                data_vencimento: new Date(conta.data_vencimento),
                                                                categoria_id: conta.categoria_id || '',
                                                                observacoes: conta.observacoes || ''
                                                            });
                                                            setDialogContaReceber(true);
                                                        }}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                                <IconButton size="small" color="error" onClick={() => handleDeleteContaReceber(conta.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* ==================== ABA FLUXO DE CAIXA ==================== */}
            {tabValue === 3 && (
                <Box>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Início"
                                        value={dataInicio}
                                        onChange={setDataInicio}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Fim"
                                        value={dataFim}
                                        onChange={setDataFim}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button variant="contained" fullWidth onClick={fetchFluxoCaixa}>
                                    Buscar
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {fluxoCaixa && (
                        <>
                            {/* Cards de Resumo */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="success.main" variant="h6">Entradas</Typography>
                                            <Typography variant="h4" color="success.main">
                                                {formatarValor(fluxoCaixa.resumo.totalEntradas)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="error.main" variant="h6">Saídas</Typography>
                                            <Typography variant="h4" color="error.main">
                                                {formatarValor(fluxoCaixa.resumo.totalSaidas)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="primary" variant="h6">Saldo</Typography>
                                            <Typography variant="h4" color={fluxoCaixa.resumo.saldo >= 0 ? 'success.main' : 'error.main'}>
                                                {formatarValor(fluxoCaixa.resumo.saldo)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Tabela de Movimentações */}
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>Movimentações do Período</Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Data</TableCell>
                                                <TableCell>Tipo</TableCell>
                                                <TableCell>Descrição</TableCell>
                                                <TableCell align="right">Valor</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {fluxoCaixa.movimentacoes.map((mov) => (
                                                <TableRow key={mov.id}>
                                                    <TableCell>{formatarData(mov.created_at)}</TableCell>
                                                    <TableCell>{getTipoMovimentacaoChip(mov.tipo)}</TableCell>
                                                    <TableCell>{mov.descricao}</TableCell>
                                                    <TableCell align="right" sx={{
                                                        color: ['entrada', 'reforco'].includes(mov.tipo) ? 'success.main' : 'error.main'
                                                    }}>
                                                        {formatarValor(mov.valor)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </>
                    )}
                </Box>
            )}

            {/* ==================== DIALOGS ==================== */}

            {/* Dialog Abrir Caixa */}
            <Dialog open={dialogAbrirCaixa} onClose={() => setDialogAbrirCaixa(false)}>
                <DialogTitle>Abrir Caixa</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Valor de Abertura (R$)"
                        type="number"
                        fullWidth
                        value={valorAbertura}
                        onChange={(e) => setValorAbertura(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Observações"
                        fullWidth
                        multiline
                        rows={2}
                        value={observacoesCaixa}
                        onChange={(e) => setObservacoesCaixa(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogAbrirCaixa(false)}>Cancelar</Button>
                    <Button onClick={handleAbrirCaixa} variant="contained">Abrir</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Fechar Caixa */}
            <Dialog open={dialogFecharCaixa} onClose={() => setDialogFecharCaixa(false)}>
                <DialogTitle>Fechar Caixa</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Valor esperado (sistema): {formatarValor(caixaAtual?.valor_sistema)}
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Valor de Fechamento (R$)"
                        type="number"
                        fullWidth
                        value={valorFechamento}
                        onChange={(e) => setValorFechamento(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Observações"
                        fullWidth
                        multiline
                        rows={2}
                        value={observacoesCaixa}
                        onChange={(e) => setObservacoesCaixa(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogFecharCaixa(false)}>Cancelar</Button>
                    <Button onClick={handleFecharCaixa} variant="contained" color="error">Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Nova Movimentação */}
            <Dialog open={dialogMovimentacao} onClose={() => setDialogMovimentacao(false)}>
                <DialogTitle>Nova Movimentação</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                            value={novaMovimentacao.tipo}
                            label="Tipo"
                            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, tipo: e.target.value })}
                        >
                            <MenuItem value="entrada">Entrada</MenuItem>
                            <MenuItem value="saida">Saída</MenuItem>
                            <MenuItem value="sangria">Sangria</MenuItem>
                            <MenuItem value="reforco">Reforço</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        label="Valor (R$)"
                        type="number"
                        fullWidth
                        value={novaMovimentacao.valor}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, valor: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Descrição"
                        fullWidth
                        value={novaMovimentacao.descricao}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, descricao: e.target.value })}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Forma de Pagamento</InputLabel>
                        <Select
                            value={novaMovimentacao.forma_pagamento_id}
                            label="Forma de Pagamento"
                            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, forma_pagamento_id: e.target.value })}
                        >
                            {formasPagamento.map((fp) => (
                                <MenuItem key={fp.id} value={fp.id}>{fp.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogMovimentacao(false)}>Cancelar</Button>
                    <Button onClick={handleRegistrarMovimentacao} variant="contained">Registrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Conta a Pagar */}
            <Dialog open={dialogContaPagar} onClose={() => { setDialogContaPagar(false); setContaPagarEdit(null); }} maxWidth="sm" fullWidth>
                <DialogTitle>{contaPagarEdit ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Descrição"
                        fullWidth
                        value={novaContaPagar.descricao}
                        onChange={(e) => setNovaContaPagar({ ...novaContaPagar, descricao: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Fornecedor"
                        fullWidth
                        value={novaContaPagar.fornecedor}
                        onChange={(e) => setNovaContaPagar({ ...novaContaPagar, fornecedor: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Valor (R$)"
                        type="number"
                        fullWidth
                        value={novaContaPagar.valor}
                        onChange={(e) => setNovaContaPagar({ ...novaContaPagar, valor: e.target.value })}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                            label="Data de Vencimento"
                            value={novaContaPagar.data_vencimento}
                            onChange={(date) => setNovaContaPagar({ ...novaContaPagar, data_vencimento: date })}
                            renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                        />
                    </LocalizationProvider>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Categoria</InputLabel>
                        <Select
                            value={novaContaPagar.categoria_id}
                            label="Categoria"
                            onChange={(e) => setNovaContaPagar({ ...novaContaPagar, categoria_id: e.target.value })}
                        >
                            {categorias.filter(c => c.tipo === 'despesa').map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        label="Observações"
                        fullWidth
                        multiline
                        rows={2}
                        value={novaContaPagar.observacoes}
                        onChange={(e) => setNovaContaPagar({ ...novaContaPagar, observacoes: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setDialogContaPagar(false); setContaPagarEdit(null); }}>Cancelar</Button>
                    <Button onClick={handleSalvarContaPagar} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Conta a Receber */}
            <Dialog open={dialogContaReceber} onClose={() => { setDialogContaReceber(false); setContaReceberEdit(null); }} maxWidth="sm" fullWidth>
                <DialogTitle>{contaReceberEdit ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Descrição"
                        fullWidth
                        value={novaContaReceber.descricao}
                        onChange={(e) => setNovaContaReceber({ ...novaContaReceber, descricao: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Cliente"
                        fullWidth
                        value={novaContaReceber.cliente}
                        onChange={(e) => setNovaContaReceber({ ...novaContaReceber, cliente: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Valor (R$)"
                        type="number"
                        fullWidth
                        value={novaContaReceber.valor}
                        onChange={(e) => setNovaContaReceber({ ...novaContaReceber, valor: e.target.value })}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                            label="Data de Vencimento"
                            value={novaContaReceber.data_vencimento}
                            onChange={(date) => setNovaContaReceber({ ...novaContaReceber, data_vencimento: date })}
                            renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                        />
                    </LocalizationProvider>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Categoria</InputLabel>
                        <Select
                            value={novaContaReceber.categoria_id}
                            label="Categoria"
                            onChange={(e) => setNovaContaReceber({ ...novaContaReceber, categoria_id: e.target.value })}
                        >
                            {categorias.filter(c => c.tipo === 'receita').map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        label="Observações"
                        fullWidth
                        multiline
                        rows={2}
                        value={novaContaReceber.observacoes}
                        onChange={(e) => setNovaContaReceber({ ...novaContaReceber, observacoes: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setDialogContaReceber(false); setContaReceberEdit(null); }}>Cancelar</Button>
                    <Button onClick={handleSalvarContaReceber} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Dar Baixa */}
            <Dialog open={dialogBaixa} onClose={() => setDialogBaixa(false)}>
                <DialogTitle>
                    {tipoBaixa === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
                </DialogTitle>
                <DialogContent>
                    {contaBaixa && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {contaBaixa.descricao}
                            </Typography>
                            <Typography variant="h6">
                                {formatarValor(contaBaixa.valor)}
                            </Typography>
                        </Box>
                    )}
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Forma de Pagamento</InputLabel>
                        <Select
                            value={formaPagamentoBaixa}
                            label="Forma de Pagamento"
                            onChange={(e) => setFormaPagamentoBaixa(e.target.value)}
                        >
                            {formasPagamento.map((fp) => (
                                <MenuItem key={fp.id} value={fp.id}>{fp.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogBaixa(false)}>Cancelar</Button>
                    <Button onClick={handleDarBaixa} variant="contained" color="success">Confirmar</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>
        </Box>
    );
}

export default Financeiro;
