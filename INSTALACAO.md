# 📖 Guia Completo de Instalação - ULTRAIPTV

Este guia explica como instalar e configurar todo o projeto ULTRAIPTV.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- Conta no Expo (para EAS Build)
- Git (opcional)

## 🚀 Instalação Passo a Passo

### 1. Instalar Dependências

```bash
# Na raiz do projeto
npm run setup
```

Ou instale manualmente em cada pasta:

```bash
npm install
cd mobile && npm install
cd ../backend && npm install
cd ../admin && npm install
```

### 2. Configurar Banco de Dados

#### 2.1 Criar Banco PostgreSQL

```sql
CREATE DATABASE ultraiptv;
CREATE USER ultraiptv_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE ultraiptv TO ultraiptv_user;
```

#### 2.2 Configurar Backend

```bash
cd backend
cp env.example .env
```

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://ultraiptv_user:sua_senha_aqui@localhost:5432/ultraiptv?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
PORT=3001
NODE_ENV=development
EXTERNAL_API_URL=http://aguacomgas.shop
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

#### 2.3 Executar Migrações

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

#### 2.4 Criar Usuário Admin (Opcional)

Você pode criar um usuário admin via Prisma Studio:

```bash
npm run prisma:studio
```

Ou criar manualmente no banco de dados.

### 3. Configurar Mobile App

#### 3.1 Configurar API

Edite `mobile/config/api.ts` se necessário (já está configurado para `http://aguacomgas.shop`).

#### 3.2 Adicionar Assets

Adicione os seguintes arquivos em `mobile/assets/`:
- `icon.png` (1024x1024px)
- `adaptive-icon.png` (1024x1024px)
- `splash.png` (2048x2048px)
- `favicon.png` (48x48px)

#### 3.3 Configurar EAS (Opcional)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
```

### 4. Iniciar Serviços

#### 4.1 Backend

```bash
cd backend
npm run dev
```

O backend estará rodando em `http://localhost:3001`

#### 4.2 Painel Admin

```bash
cd admin
npm run dev
```

O painel estará rodando em `http://localhost:5173`

#### 4.3 Mobile App

```bash
cd mobile
npm start
```

Escaneie o QR code com o app Expo Go ou pressione `a` para abrir no Android.

## 📱 Gerar APK

### Via EAS Build (Recomendado)

```bash
cd mobile
eas build -p android --profile apk
```

O APK será gerado na nuvem e você receberá um link para download.

### Instalar APK em Smart TV Android

1. Baixe o APK gerado
2. Transfira para um pendrive ou use ADB
3. Na Smart TV, vá em Configurações > Segurança > Permitir fontes desconhecidas
4. Instale o APK via gerenciador de arquivos ou ADB

#### Via ADB:

```bash
adb connect IP_DA_TV:5555
adb install ultraiptv.apk
```

## 🔧 Configurações Adicionais

### Variáveis de Ambiente

#### Backend (.env)
- `DATABASE_URL`: URL de conexão PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT (use uma chave forte!)
- `PORT`: Porta do servidor (padrão: 3001)
- `EXTERNAL_API_URL`: URL da API externa de conteúdo

#### Admin (opcional)
Crie `.env` em `admin/`:
```env
VITE_API_URL=http://localhost:3001
```

### Firewall e Portas

Certifique-se de que as seguintes portas estão abertas:
- `3001`: Backend API
- `5173`: Painel Admin (desenvolvimento)
- `19000-19001`: Expo Dev Server

## 🐛 Solução de Problemas

### Erro de Conexão com Banco

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `psql -U ultraiptv_user -d ultraiptv`

### Erro ao Gerar APK

- Certifique-se de estar logado no Expo: `eas login`
- Verifique se o `app.json` está configurado corretamente
- Consulte os logs do EAS Build

### App não conecta à API

- Verifique se a API externa está acessível
- Confirme a URL em `mobile/config/api.ts`
- Verifique permissões de internet no AndroidManifest

## 📚 Próximos Passos

1. Criar usuários via painel admin
2. Testar login no app mobile
3. Verificar reprodução de canais
4. Personalizar logo e assets
5. Configurar deploy em produção

## 🌐 Deploy em Produção

### Backend (Render/Railway/Fly.io)

1. Conecte seu repositório
2. Configure variáveis de ambiente
3. Configure o banco PostgreSQL
4. Deploy automático

### Painel Admin

1. Build: `npm run build`
2. Deploy em Vercel/Netlify
3. Configure `VITE_API_URL` para URL do backend

### Mobile App

1. Gere APK via EAS Build
2. Distribua via link ou loja

## 📞 Suporte

Para problemas ou dúvidas, consulte a documentação de cada módulo:
- [Mobile App](./mobile/README.md)
- [Backend](./backend/README.md)
- [Painel Admin](./admin/README.md)

