require('dotenv').config({ path: '../.env' });
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
  try {
    console.log('Iniciando criação de usuários...');
    console.log('URL do Supabase:', process.env.SUPABASE_URL);

    // Verificar se o usuário admin já existe
    const { data: adminExistente, error: adminError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'admin@hamburgueria.com')
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuário admin:', adminError);
      return;
    }

    if (!adminExistente) {
      // Criar hash da senha
      const salt = await bcrypt.genSalt(10);
      const adminSenhaHash = await bcrypt.hash('admin123', salt);

      // Criar usuário admin
      const adminUsuario = {
        id: uuidv4(),
        nome: 'Administrador',
        email: 'admin@hamburgueria.com',
        senha: adminSenhaHash,
        role: 'admin',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: adminData, error: adminInsertError } = await supabase
        .from('usuarios')
        .insert([adminUsuario])
        .select();

      if (adminInsertError) {
        console.error('Erro ao criar usuário admin:', adminInsertError);
      } else {
        console.log('Usuário admin criado com sucesso:', adminData[0].email);
      }
    } else {
      console.log('Usuário admin já existe:', adminExistente.email);
    }

    // Verificar se o usuário garçom já existe
    const { data: garcomExistente, error: garcomError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'garcom@hamburgueria.com')
      .single();

    if (garcomError && garcomError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuário garçom:', garcomError);
      return;
    }

    if (!garcomExistente) {
      // Criar hash da senha
      const salt = await bcrypt.genSalt(10);
      const garcomSenhaHash = await bcrypt.hash('garcom123', salt);

      // Criar usuário garçom
      const garcomUsuario = {
        id: uuidv4(),
        nome: 'Garçom',
        email: 'garcom@hamburgueria.com',
        senha: garcomSenhaHash,
        role: 'garcom',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: garcomData, error: garcomInsertError } = await supabase
        .from('usuarios')
        .insert([garcomUsuario])
        .select();

      if (garcomInsertError) {
        console.error('Erro ao criar usuário garçom:', garcomInsertError);
      } else {
        console.log('Usuário garçom criado com sucesso:', garcomData[0].email);
      }
    } else {
      console.log('Usuário garçom já existe:', garcomExistente.email);
    }

    console.log('Processo de criação de usuários concluído.');
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
