# EventBot — versão organizada

Esta versão está pronta para subir no GitHub Pages.

## O que foi ajustado
- Estrutura correta com `src/` e `public/`
- `index.html` apontando para os arquivos certos
- Nome longo no crachá com ajuste automático de tamanho
- Rodapé puxando o subtítulo do evento pela configuração
- Arquivos prontos para deploy estático

## Como testar localmente
Abra a pasta em um terminal e rode:

```bash
python -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

## Como publicar no GitHub Pages
1. Crie um repositório no GitHub
2. Envie todos os arquivos desta pasta
3. Vá em Settings > Pages
4. Selecione Deploy from a branch
5. Escolha a branch `main` e a pasta `/ (root)`
6. Salve

## Onde personalizar
- `src/config.js`: nome do evento, subtítulo, cores e mensagens
- `src/bot.js`: desenho do crachá
- `src/styles.css`: aparência da interface
