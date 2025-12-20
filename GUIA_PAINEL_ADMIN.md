# 🎛️ Guia Completo: Painel Admin - Criar e Gerenciar Usuários

## 🚀 Como Acessar o Painel Admin

### 1. Iniciar o Backend
```powershell
cd backend
npm run dev
```
O backend deve estar rodando em `http://localhost:3001`

### 2. Iniciar o Painel Admin
Em outro terminal:
```powershell
cd admin
npm run dev
```

### 3. Acessar no Navegador
Abra: `http://localhost:5173`

### 4. Fazer Login
- Use suas credenciais de admin
- Se não lembrar, execute: `cd backend && npm run reset:admin`

---

## 👤 Como Criar um Novo Usuário para Cliente

### Passo a Passo:

1. **Acesse o Painel Admin** (`http://localhost:5173`)

2. **Clique em "Usuários"** no menu lateral

3. **Clique no botão "Novo Usuário"** (canto superior direito)

4. **Preencha o Formulário:**

   - **Usuário**: Nome de usuário do cliente (ex: `cliente001`, `joao_silva`)
   
   - **Senha**: 
     - Deixe em branco para gerar automaticamente
     - OU digite uma senha personalizada (mínimo 6 caracteres)
     - ⚠️ **IMPORTANTE**: Se gerar automaticamente, anote a senha que aparecerá!
   
   - **Tipo de Expiração**: Escolha uma opção:
     - **Dias**: Expira em X dias a partir de hoje
     - **Horas**: Expira em X horas a partir de agora
     - **Data Específica**: Escolhe uma data exata
   
   - **Valor**: 
     - Se escolheu "Dias": Digite o número de dias (ex: `30` para 30 dias)
     - Se escolheu "Horas": Digite o número de horas (ex: `24` para 24 horas)
     - Se escolheu "Data Específica": Selecione a data no calendário
   
   - **Limite de Dispositivos**: Quantos dispositivos podem usar simultaneamente (padrão: 1)
   
   - **Função**: 
     - **USER**: Cliente normal (use esta opção)
     - **ADMIN**: Administrador (não use para clientes)

5. **Clique em "Salvar"**

6. **Anote as Credenciais**:
   - Se a senha foi gerada automaticamente, ela aparecerá em uma caixa verde
   - ⚠️ **SALVE ESTA SENHA!** Ela não será exibida novamente
   - Envie para o cliente: Usuário + Senha

---

## 🔒 Como Bloquear um Cliente (Não Pagou)

### Opção 1: Bloquear Temporariamente

1. Acesse **"Usuários"** no painel
2. Encontre o usuário na lista
3. Clique em **"Bloquear"** (botão amarelo)
4. O status mudará para "Bloqueado"
5. O cliente não conseguirá mais fazer login

### Opção 2: Bloquear Permanentemente (Deletar)

1. Acesse **"Usuários"** no painel
2. Encontre o usuário na lista
3. Clique em **"Deletar"** (botão vermelho)
4. Confirme a exclusão
5. O usuário será removido permanentemente

### Opção 3: Editar e Desativar

1. Clique em **"Editar"** no usuário
2. Desmarque a opção **"Ativo"**
3. Clique em **"Salvar"**
4. O usuário ficará bloqueado

---

## ⏰ Como Funciona a Expiração

### Expiração Automática

- Quando a data de expiração chegar, o cliente **não conseguirá mais fazer login**
- O sistema verifica automaticamente na hora do login
- Mensagem exibida: "Conta expirada"

### Renovar Assinatura

1. Clique em **"Editar"** no usuário
2. Altere a **"Data de Expiração"** para uma data futura
3. Clique em **"Salvar"**
4. O cliente poderá fazer login novamente

---

## 📋 Exemplos Práticos

### Exemplo 1: Criar Cliente com 30 dias de acesso

1. Usuário: `cliente_joao`
2. Senha: (deixe em branco - será gerada)
3. Tipo de Expiração: **Dias**
4. Valor: `30`
5. Limite de Dispositivos: `1`
6. Função: **USER**

**Resultado**: Cliente terá acesso por 30 dias a partir de hoje

---

### Exemplo 2: Criar Cliente com Expiração em Data Específica

1. Usuário: `cliente_maria`
2. Senha: `senha123`
3. Tipo de Expiração: **Data Específica**
4. Data: `2024-12-31` (31 de dezembro de 2024)
5. Limite de Dispositivos: `2`
6. Função: **USER**

**Resultado**: Cliente terá acesso até 31 de dezembro de 2024

---

### Exemplo 3: Bloquear Cliente que Não Pagou

1. Acesse "Usuários"
2. Encontre o cliente
3. Clique em **"Bloquear"**
4. Status muda para "Bloqueado"
5. Cliente não consegue mais fazer login

---

## 🔄 Renovar Assinatura de Cliente

1. Acesse **"Usuários"**
2. Clique em **"Editar"** no cliente
3. Altere a data de expiração para uma data futura
4. Certifique-se que **"Ativo"** está marcado
5. Clique em **"Salvar"**

---

## 📊 Visualizar Todos os Usuários

Na página **"Usuários"**, você verá:

- **Usuário**: Nome de usuário e função
- **Status**: Ativo ou Bloqueado
- **Expiração**: Data de expiração ou "Sem expiração"
- **Dispositivos**: Limite de dispositivos
- **Ações**: Editar, Bloquear/Ativar, Deletar

---

## ⚠️ Dicas Importantes

1. **Sempre anote a senha gerada** - Ela não será exibida novamente
2. **Use senhas fortes** se criar manualmente (mínimo 6 caracteres)
3. **Bloqueie imediatamente** se o cliente não pagar
4. **Renove antes de expirar** para evitar interrupção do serviço
5. **Limite de dispositivos** controla quantos aparelhos podem usar simultaneamente

---

## 🆘 Problemas Comuns

### Cliente não consegue fazer login

1. Verifique se o usuário está **"Ativo"**
2. Verifique se a **data de expiração** não passou
3. Verifique se as credenciais estão corretas

### Esqueci a senha do cliente

1. Clique em **"Editar"** no usuário
2. Digite uma nova senha
3. Clique em **"Salvar"**
4. Envie a nova senha para o cliente

### Cliente expirou e quer renovar

1. Clique em **"Editar"** no usuário
2. Altere a data de expiração
3. Certifique-se que está **"Ativo"**
4. Clique em **"Salvar"**

---

## 📍 URLs Importantes

- **Painel Admin**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`

---

## 🎯 Resumo Rápido

1. **Criar usuário**: Usuários → Novo Usuário → Preencher → Salvar
2. **Bloquear**: Usuários → Encontrar usuário → Bloquear
3. **Renovar**: Usuários → Editar → Alterar data → Salvar
4. **Deletar**: Usuários → Encontrar usuário → Deletar

