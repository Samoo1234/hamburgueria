const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do cliente Supabase
// Usa a Service Role Key para bypassar RLS (o backend controla autenticação via JWT próprio)
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas!');
  console.error('SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTANDO');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'OK' : 'FALTANDO');
  process.exit(1);
}

// Cliente Supabase para uso no backend (com service role para bypassar RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;

