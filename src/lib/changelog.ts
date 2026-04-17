/** Tipos aceitos pela tabela `avisos` e pelo mural (MuralAvisos). */
export type TipoChangelog = "novidade" | "melhoria" | "correcao" | "aviso";

export interface ChangelogItem {
  versao: string;
  tipo: TipoChangelog;
  titulo: string;
  descricao: string;
  /** ISO 8601 — usado na ordenação do mural (mais recente primeiro). */
  publicadoEm?: string;
}

/**
 * Itens exibidos no mural junto com avisos extras da tabela `avisos` (Supabase).
 * Linhas com o mesmo par versão + título que já estão aqui não são repetidas vindas do banco.
 */
export const CHANGELOG: ChangelogItem[] = [
  {
    versao: "1.7",
    tipo: "novidade",
    titulo: "Modo claro/escuro para o sistema",
    descricao:
      "O sistema agora possui um modo claro/escuro para melhorar a usabilidade. Você pode alternar entre os modos clicando no botão de alternância no canto superior direito, ao lado do seu nome de usuário na barra de navegação.",
    publicadoEm: "2024-07-10T12:00:00.000Z",
  },
  {
    versao: "1.7",
    tipo: "novidade",
    titulo: "Notas de versão Sênior",
    descricao:
      'Agora você pode ver as notas de versão Sênior no sistema. Clique no botão "Notas de versão Sênior" na barra de navegação para ver as notas de versão Sênior.',
    publicadoEm: "2024-07-12T12:00:00.000Z",
  },
];
