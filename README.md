# LP Kit Festividades Sadia (mobile) + checkout

Site estático (HTML/CSS/JS), sem build.

## Estrutura
- `index.html`, `style.css`, `script.js`, `assets/` (landing page)
- `checkout.html`, `checkout.css`, `checkout.js` (nome, e-mail, CPF, celular, CEP com busca automática)
- `favicon.png` e `assets/logo.png` (logo Sadia)
- `config.js` (preço R$ 149,90, tabela de frete por UF, prazo, WhatsApp)

## Antes de publicar
1. Em `config.js`: preencha o frete por UF, o prazo e o WhatsApp.
2. Para cobrar online, integre um gateway em `finalizarPedido()` (`checkout.js`).
3. Troque os depoimentos de exemplo por avaliações reais e confirme direitos de uso de marca e imagens.

## Deploy
GitHub: suba o conteúdo da pasta. Vercel: importe o repositório, Framework Preset "Other", sem build command.
