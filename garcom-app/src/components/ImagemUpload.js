import React, { useState } from 'react';
import { uploadImagem, removerImagem } from '../services/supabaseStorage';

/**
 * Componente para upload de imagens usando o Supabase Storage
 * Pode ser usado para imagens de produtos, fotos de perfil, etc.
 */
const ImagemUpload = ({ imagemAtual, onImagemUpload, categoria = 'produtos' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(imagemAtual || '');
  const [error, setError] = useState('');

  // Manipular seleção de arquivo
  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        setError('Tipo de arquivo não suportado. Use JPEG, PNG ou WEBP.');
        return;
      }

      // Validar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Fazer upload
      setUploading(true);
      setError('');

      // Gerar nome de arquivo baseado na categoria e timestamp
      const fileName = `${categoria}-${Date.now()}`;
      
      const { path, error } = await uploadImagem(file, fileName);
      
      if (error) throw error;
      
      // Notificar componente pai sobre o upload bem-sucedido
      onImagemUpload(path);
      
      setUploading(false);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Falha ao fazer upload da imagem. Tente novamente.');
      setUploading(false);
    }
  };

  // Remover imagem atual
  const handleRemoverImagem = async () => {
    if (!imagemAtual || !imagemAtual.includes('supabase')) return;
    
    try {
      setUploading(true);
      const { success, error } = await removerImagem(imagemAtual);
      
      if (error) throw error;
      
      if (success) {
        setPreview('');
        onImagemUpload('');
      }
    } catch (err) {
      console.error('Erro ao remover imagem:', err);
      setError('Falha ao remover a imagem.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="imagem-upload">
      <div className="preview-container">
        {preview ? (
          <div className="imagem-preview">
            <img src={preview} alt="Preview" />
            <button 
              type="button" 
              className="btn-remover" 
              onClick={handleRemoverImagem}
              disabled={uploading}
            >
              Remover
            </button>
          </div>
        ) : (
          <div className="sem-imagem">
            <p>Nenhuma imagem selecionada</p>
          </div>
        )}
      </div>

      <div className="upload-controls">
        <label className="btn-upload">
          {uploading ? 'Enviando...' : 'Selecionar imagem'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        
        {error && <p className="erro-upload">{error}</p>}
        
        <p className="dica-upload">
          Formatos aceitos: JPEG, PNG, WEBP. Tamanho máximo: 2MB.
        </p>
      </div>
    </div>
  );
};

export default ImagemUpload;