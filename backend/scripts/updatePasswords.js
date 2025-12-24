require('dotenv').config({ path: '../.env' });
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
  try {
    console.log('Atualizando senhas dos usuários...');
    console.log('URL do Supabase:', process.env.SUPABASE_URL);

    // Atualizar senha do admin
    const salt = await bcrypt.genSalt(10);
    const adminSenhaHash = await bcrypt.hash('admin123', salt);
    
    const { data: adminData, error: adminError } = await supabase
      .from('usuarios')
      .update({ senha: adminSenhaHash })
      .eq('email', 'admin@hamburgueria.com')
      .select();

    if (adminError) {
      console.error('Erro ao atualizar senha do admin:', adminError);
    } else {
      console.log('Senha do admin atualizada com sucesso!');
    }

    // Atualizar senha do garçom
    const garcomSenhaHash = await bcrypt.hash('garcom123', salt);
    
    const { data: garcomData, error: garcomError } = await supabase
      .from('usuarios')
      .update({ senha: garcomSenhaHash })
      .eq('email', 'garcom@hamburgueria.com')
      .select();

    if (garcomError) {
      console.error('Erro ao atualizar senha do garçom:', garcomError);
    } else {
      console.log('Senha do garçom atualizada com sucesso!');
    }

    console.log('Processo de atualização de senhas concluído.');
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

updatePasswords()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
