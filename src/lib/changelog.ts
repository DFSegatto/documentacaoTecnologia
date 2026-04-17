/** Tipos aceitos pela tabela `avisos` e pelo mural (MuralAvisos). */
export type TipoChangelog = "novidade" | "melhoria" | "correcao" | "aviso";

export interface ChangelogItem {
  versao: string;
  tipo: TipoChangelog;
  titulo: string;
  descricao: string;
}

/**
 * Notas da versão do app (referência para textos do mural).
 * Os avisos exibidos na UI vêm da tabela `avisos` no Supabase — mantenha o seed em
 * `supabase.sql` (ou INSERT manual no SQL Editor) alinhado a estes itens.
 */
export const CHANGELOG: ChangelogItem[] = [
  {
    versao: "1.7",
    tipo: "novidade",
    titulo: "Modo claro/escuro para o sistema",
    descricao:
      "O sistema agora possui um modo claro/escuro para melhorar a usabilidade. Você pode alternar entre os modos clicando no botão de alternância no canto superior direito, ao lado do seu nome de usuário na barra de navegação.",
  },
  {
    versao: "1.7",
    tipo: "novidade",
    titulo: "Notas de versão Sênior",
    descricao:
      'Agora você pode ver as notas de versão Sênior no sistema. Clique no botão "Notas de versão Sênior" na barra de navegação para ver as notas de versão Sênior.',
  },
];
