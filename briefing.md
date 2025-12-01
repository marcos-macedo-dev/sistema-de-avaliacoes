# Pesquisa de Satisfação (Evento)

## 1. Visão Geral

Uma página única onde qualquer visitante do evento acessa, dá notas para categorias específicas (Alimentação, Projetos, etc.) e envia. Todos usam o mesmo link.

## 2. Fluxo do Usuário

- **Entrada:** Usuário escaneia o QR Code único espalhado pelo evento.
- **Interface:** Abre o formulário direto (sem carregamento de dados prévios).
- **Ação (categorias mencionadas no áudio):**
  - Avaliar Alimentação (estrelas ou emojis).
  - Avaliar Apresentação dos Projetos (1 a 5 estrelas).
  - Campo de Comentário/Sugestão (texto livre).
  - Botão “Enviar Feedback”.
- **Feedback:** Tela de agradecimento (“Obrigado pela presença!”).

## 3. Modelagem de Dados (Firestore)

Ficou muito mais simples. Só precisamos de uma coleção para receber tudo.

- **Coleção:** `event_feedbacks`

```json
{
  "food_rating": 5,
  "presentation_rating": 4,
  "comment": "O lanche estava ótimo, mas faltou cadeira.",
  "timestamp": "2025-12-01T10:30:00Z"
}
```
