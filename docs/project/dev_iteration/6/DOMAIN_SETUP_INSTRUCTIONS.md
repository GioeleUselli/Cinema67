# Configurazione Dominio cinema67.it

## Record DNS da Aggiungere (presso il Registrar)

Aggiungi questi record DNS per cinema67.it:

| Tipo | Nome | Valore | TTL |
|------|------|--------|-----|
| **CNAME** | `cinema67.it` | `cinema67-web-app.bravebush-d5bb2495.italynorth.azurecontainerapps.io` | 300 |
| **TXT** | `asuid.cinema67.it` | `4FE0E126B6DAB3E22A552DA0490CA32D26C5DD21424BB109460D617677CC2366` | 300 |

## Cosa fa Azure

Una volta propagati i DNS:

1. La **CNAME** punta il dominio verso il frontend ACA
2. Il **TXT** (`asuid.`) dimostra il possesso del dominio → Azure crea il managed SSL certificate
3. Il certificato si rinnova automaticamente (nessuna azione manuale)

## Comandi Azure (da eseguire DOPO la propagazione DNS)

```bash
# 1. Bind hostname con certificato managed
az containerapp hostname bind -n cinema67-web-app -g cinema67-rg \
    --hostname cinema67.it -e cinema67-env

# 2. Verifica
curl -I https://cinema67.it/
curl -s https://cinema67.it/healthz
curl -s https://cinema67.it/js/runtime-config.js
```

## OAuth Redirect URIs

Dopo che HTTPS funziona, aggiorna Google/Microsoft OAuth:

| Provider | URI Redirect |
|----------|-------------|
| Google | `https://cinema67.it/callback` |
| Microsoft | `https://cinema67.it/callback` |

## Frontend API_BASE_URL

Il frontend punta già a FilmAPI via external FQDN. Verifica con:

```bash
curl -s https://cinema67-web-app.bravebush-d5bb2495.italynorth.azurecontainerapps.io/js/runtime-config.js
```

Se tutto OK, dopo il CNAME funzionerà anche `https://cinema67.it/js/runtime-config.js`
