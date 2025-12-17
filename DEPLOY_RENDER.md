# Deploy no Render — instruções rápidas

Passos resumidos para deploy do backend no Render:

1. Acesse https://dashboard.render.com e crie uma conta (ou faça login).
2. No Dashboard, clique em "New +" → "Web Service" → Connect a repository (conecte seu repositório GitHub/GitLab).
   - Se preferir, use o `render.yaml` incluído neste repositório; o Render aplicará a configuração automaticamente.
   - Escolha 'Docker' como environment e certifique-se de que o `dockerfilePath` aponte para `backend/Dockerfile`.

3. Crie um Postgres managed database (New + → Databases → Create PostgreSQL). Anote o `DATABASE_URL`.

4. No Web Service (ultraiptv-backend), configure as Environment variables:
   - `DATABASE_URL` = string de conexão do Postgres gerenciado by Render
   - `JWT_SECRET` = string forte (posso gerar uma se desejar)
   - `EXPO_PUBLIC_BACKEND_URL` = `https://<sua-url>.onrender.com` (ou o endpoint que o Render criar)
   - Outras variáveis conforme `backend/.env.example` (ex.: `EXTERNAL_API_URL`).

5. Após o primeiro deploy, executar migrações Prisma (via SSH ou Job):
   - `npx prisma migrate deploy`

6. Criar admin não-interativo (via Shell/Console do Render):
   - `ADMIN_USERNAME=@pedrojr ADMIN_PASSWORD=Casamento2007 node scripts/create-admin-noninteractive.js`

7. Atualizar `eas.json` (local) com `EXPO_PUBLIC_BACKEND_URL` apontando para a URL pública e rodar `eas build -p android --profile apk` para gerar o APK apontando para o backend em produção.

8. Baixe o APK pelo link gerado pelo EAS e copie para pendrive para instalação na TV.

Observações:
- Posso automatizar esses passos usando a API do Render, porém preciso de uma Render API key com permissões para criar serviços/DBs ou ser adicionado como colaborador à sua conta do Render.
- Se preferir que eu faça tudo, forneça uma Render API key (Service Key) gerada em Settings → API Keys → Create Key e cole aqui (ou me adicione como time member). A chave será usada somente para criar o serviço e não ficará gravada no repositório.
