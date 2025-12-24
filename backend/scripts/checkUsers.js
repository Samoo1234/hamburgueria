require('dotenv').config({ path: '../.env' });
const supabase = require('../config/supabase');

async function checkUsers() {
  try {
    console.log('Verificando usuários no banco de dados...');
    console.log('URL do Supabase:', process.env.SUPABASE_URL);

    // Buscar todos os usuários
    const { data, error } = await supabase
      .from('usuarios')
      .select('*');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return;
    }

    console.log('Total de usuários encontrados:', data.length);
    
    // Mostrar detalhes de cada usuário (exceto a senha)
    data.forEach(user => {
      const { senha, ...userInfo } = user;
      console.log('Usuário:', userInfo);
    });

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
