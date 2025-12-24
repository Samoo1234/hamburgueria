import supabase from './supabase';

/**
 * Serviço para gerenciar o armazenamento de arquivos no Supabase
 * Útil para upload de imagens de produtos, fotos de perfil, etc.
 */

// Nome do bucket de armazenamento
const BUCKET_NAME = 'produtos-imagens';

/**
 * Faz upload de uma imagem para o bucket do Supabase
 * @param {File} file - O arquivo a ser enviado
 * @param {string} fileName - Nome do arquivo no storage
 * @returns {Promise<{path: string, error: any}>} - Caminho do arquivo ou erro
 */
export const uploadImagem = async (file, fileName) => {
  try {
    // Verificar se o bucket existe, se não, criar
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Imagens acessíveis publicamente
        fileSizeLimit: 1024 * 1024 * 2 // Limite de 2MB
      });
    }
    
    // Gerar nome de arquivo único
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = fileName 
      ? `${fileName}.${fileExt}` 
      : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Obter URL pública do arquivo
    const { data: publicURL } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueFileName);
    
    return { path: publicURL.publicUrl, error: null };
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return { path: null, error };
  }
};

/**
 * Remove uma imagem do bucket do Supabase
 * @param {string} filePath - Caminho do arquivo a ser removido
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const removerImagem = async (filePath) => {
  try {
    // Extrair o nome do arquivo da URL
    const fileName = filePath.split('/').pop();
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    return { success: false, error };
  }
};

/**
 * Lista todas as imagens no bucket
 * @returns {Promise<{files: Array, error: any}>}
 */
export const listarImagens = async () => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (error) throw error;
    
    // Adicionar URLs públicas aos arquivos
    const filesWithUrls = data.map(file => ({
      ...file,
      url: supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name).data.publicUrl
    }));
    
    return { files: filesWithUrls, error: null };
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    return { files: [], error };
  }
};