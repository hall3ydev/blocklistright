# Blocklist

Página estática, mobile-first, com a lista de contas do Instagram a bloquear:
copiar o `@` com um toque, abrir o perfil direto no app e marcar o que já foi feito.

## Como manter a lista

Edite **apenas** o arquivo `public/accounts.js`:

```js
window.ACCOUNTS = [
  { handle: "nome_da_conta", nota: "Por que está na lista (opcional)" },
  { handle: "outra_conta" }
];
```

- `handle` — o usuário sem `@`.
- `nota` — opcional; aparece em cinza abaixo do `@` e também entra na busca.

## Como funciona

- **Copiar @** usa a Clipboard API, com recurso ao método antigo quando a página
  não está em HTTPS.
- **Abrir** manda para `instagram.com/<handle>`, que no celular abre o app.
- **✓** marca a conta como bloqueada. Isso fica no `localStorage`, ou seja, só
  naquele navegador/aparelho — nada é enviado para lugar nenhum.
- Filtros Todas / Pendentes / Bloqueadas, busca e barra de progresso.
- Tema claro e escuro conforme a preferência do sistema.

## Publicar na Cloudflare

O site é servido como Worker de assets estáticos, o que dá um domínio
`*.workers.dev`. Não há build nem dependência de runtime.

```bash
npx wrangler login     # uma vez, abre o navegador
npx wrangler deploy
```

A configuração está em `wrangler.jsonc`. Para ver local antes de subir:

```bash
npx wrangler dev
```

## Arquivos

| Arquivo | Para quê |
|---|---|
| `public/index.html` | estrutura da página e o painel de instruções |
| `public/styles.css` | estilos (mobile-first, tema claro/escuro) |
| `public/app.js` | busca, filtros, cópia, marcação e progresso |
| `public/accounts.js` | **a lista** — o único arquivo que muda no dia a dia |
| `wrangler.jsonc` | configuração de deploy na Cloudflare |
