import { useState } from 'react'
import { supabase, type ArquivoUpload } from '../lib/supabase'

interface Props {
  onUpload: (arquivos: ArquivoUpload[]) => void
  arquivosExistentes?: ArquivoUpload[]
}

export default function UploadAnexos({ onUpload, arquivosExistentes = [] }: Props) {
  const [uploading, setUploading] = useState(false)
  const [arquivos, setArquivos]   = useState<ArquivoUpload[]>(arquivosExistentes)
  const [drag, setDrag]           = useState(false)

  async function processarArquivos(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const novos: ArquivoUpload[] = []

    for (const file of Array.from(files)) {
      const isImagem = file.type.startsWith('image/')
      const isPdf    = file.type === 'application/pdf'
      if (!isImagem && !isPdf) continue

      const bucket = isImagem ? 'imagens' : 'documentos'
      const path   = `${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage.from(bucket).upload(path, file)
      if (error) { console.error(error); continue }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      novos.push({ nome: file.name, url: urlData.publicUrl, tipo: isImagem ? 'imagem' : 'pdf' })
    }

    const todos = [...arquivos, ...novos]
    setArquivos(todos)
    onUpload(todos)
    setUploading(false)
  }

  function remover(url: string) {
    const atualizados = arquivos.filter(a => a.url !== url)
    setArquivos(atualizados)
    onUpload(atualizados)
  }

  return (
    <div className="space-y-3">
      <label
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition
          ${drag ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); processarArquivos(e.dataTransfer.files) }}
      >
        <input type="file" accept="image/*,.pdf" multiple className="hidden"
          onChange={e => processarArquivos(e.target.files)} />
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
          {uploading
            ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
          }
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{uploading ? 'Enviando...' : 'Clique ou arraste arquivos aqui'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Imagens e PDFs aceitos</p>
        </div>
      </label>

      {arquivos.length > 0 && (
        <div className="space-y-2">
          {arquivos.map(a => (
            <div key={a.url} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2">
              <span className="text-base">{a.tipo === 'imagem' ? '🖼' : '📄'}</span>
              <a href={a.url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-700 hover:text-brand-600 truncate flex-1">{a.nome}</a>
              <button type="button" onClick={() => remover(a.url)}
                className="text-gray-400 hover:text-red-500 transition flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
