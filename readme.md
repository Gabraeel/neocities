# Guides's Sanctuary — guia rápido

(Este arquivo é só para você: não precisa subir pro Neocities.)

## Como o site está organizado

```
/                       <- só as PÁGINAS
  index.html  about.html  diary.html  favorites.html  gallery.html
  links.html  socials.html  webrings.html  not_found.html
css/
  style.css             <- TODO o visual (inclui o calendário)
js/
  script.js             <- cérebro do site (menu, player, cursor, navegação)
  calendar.js           <- calendário (o script.js carrega ele sozinho)
partials/               <- pedaços que o script.js injeta em todas as páginas
  header.html  menu.html  player.html
fonts/   images/        <- ficam como já estavam
```

`index.html` e `not_found.html` PRECISAM ficar na raiz (regra do Neocities).

## Receitas

**Criar uma página nova** (ex.: `blog.html`): copie `links.html`, troque título,
ícone e o texto dentro de `<div class="window-body">`. Depois adicione um botão
em `partials/menu.html` copiando um bloco `<a href="..." class="aero-nav-btn">`.
O `<head>` e o `<script src="js/script.js">` já vêm certos na cópia.

**Nova entrada no diário** (`diary.html`): copie um bloco `<div class="diary-page">`
para o TOPO da lista (a mais nova fica primeiro), tire o `active` da antiga e
ponha na nova. Mantenha o título assim: `<h3>Date: November 2, 2026</h3>`.
O calendário marca o dia sozinho. Opcional: `data-note="texto"` na div da página
mostra uma notinha embaixo do calendário.

**Rastro do cursor pesado/lento?** No começo do trecho "ANIMATED CUSTOM CURSOR"
do `js/script.js` existe `CURSOR_TRAIL`:
`enabled: false` desliga o rastro; `rainbow: true` liga o arco-íris (bonito, mas pesado).

**Trocar o look do texto**: no topo do `css/style.css`, `--font-text` define a
fonte do texto corrido. Para voltar ao pixel: `--font-text: var(--font-pixel);`

## Layout (como adicionar janelas sem desalinhar)

Cabeçalho em cima, três colunas embaixo e a barra de tarefas por último.
A coluna do menu (menu + to do list) sempre aparece inteira e define a altura:
as outras colunas esticam até o mesmo fim, e o CONTEÚDO das janelas delas rola por
dentro. Se o menu for mais alto que a tela, a página inteira rola um pouco.
Isso vale para qualquer página, sem precisar mexer em nada.

Todas as páginas têm a mesma estrutura dentro de `<main class="main-body">`:

```
menu (esquerda)  |  <div class="col col-center"> (centro)  |  <aside class="sidebar-right col"> (direita)
```

- Cada coluna empilha as janelas com o mesmo espaço (`--gap`, no topo do `css/style.css`)
  e a ÚLTIMA janela de cada coluna cresce para preencher: o fim das três colunas
  fica sempre na mesma linha.
- **Janela nova embaixo:** copie um `<article class="window glass active">` e cole
  dentro da coluna (`col-center` ou `sidebar-right`). Pronto, ela já se alinha.
- **Quem ganha o espaço numa coluna com várias janelas:** ponha `grow` na janela que
  deve ficar com o espaço que sobrar (e rolar por dentro) e `fit` na que deve aparecer
  sempre inteira. Ex.: na home, Updates é `grow` e Gallery é `fit`.
- **Duas janelas lado a lado no centro:** envolva as duas em `<div class="row"> ... </div>`.
- **Não quer que a última janela estique?** Ponha `no-stretch` no main:
  `<main class="main-body no-stretch">`.
- **Mexer no espaçamento:** `--gap` (entre janelas), `--side` (largura das colunas
  laterais) e `--dock` (espaço reservado para a barra de tarefas) no `:root` do `css/style.css`.
- Telas baixas (até 720px de altura) usam um banner mais baixo automaticamente.
- No celular (menos de 850px) as colunas empilham sozinhas e a página volta a rolar normalmente.

## Regras de ouro (o site troca páginas SEM recarregar)

- Toda janela do centro deve ficar DENTRO do `<div class="col col-center">`: o menu troca o conteúdo dessa coluna inteira ao navegar.
- Coisas novas que precisam de JavaScript numa página devem ser iniciadas por uma
  função que o `script.js` chama depois de trocar a página (como o calendário faz
  com `initDiaryCalendar()`). Um `<script>` dentro de uma página NÃO roda ao navegar
  pelo menu.
- CSS novo vai no `css/style.css`. Um `<link>` extra só numa página não carrega
  quando você chega nela pelo menu.
- Caminhos de imagem em páginas e partials: `images/...` (sem `../`).
  Dentro do `css/style.css`: `../images/...` (porque o CSS mora numa subpasta).

## Tarefinhas (sticky note)

A lista fica no fim de `partials/menu.html`. Para riscar um item, use `<li class="done">`.

## Tela de start

Ela é criada pelo `js/script.js` (seção 0.1) e aparece uma vez por visita.
Para ver de novo, feche a aba ou rode `sessionStorage.clear()` no console.

## Publicar automático (GitHub → Neocities)

`.github/workflows/deploy.yml` envia o site pro Neocities a cada `git push` na `main`.
A primeira vez:
1. Crie um repositório vazio no GitHub.
2. Copie a API key do Neocities (Settings > Manage Site Settings > API) e salve no
   repositório do GitHub como segredo `NEOCITIES_API_TOKEN`
   (Settings > Secrets and variables > Actions > New repository secret).
3. No terminal desta pasta: `git commit -m "primeiro commit"`,
   `git remote add origin <url do repo>` e `git push -u origin main`.
Depois disso é só commit + push (ou o botão Sync do VS Code).
O deploy não apaga nada do Neocities que não esteja no repositório (`cleanup: false`).
