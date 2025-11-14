# 📺 Guia de Instalação em Smart TV Android

Este guia explica como instalar o APK do ULTRAIPTV em Smart TVs Android, TV Boxes e FireStick.

## 📱 Dispositivos Suportados

- ✅ Smart TVs Android TV
- ✅ Android TV Box
- ✅ Amazon Fire TV Stick
- ✅ Nvidia Shield
- ✅ Xiaomi Mi Box
- ✅ Outros dispositivos Android TV

## 🔧 Método 1: Via Pendrive/USB

### Passo 1: Preparar o APK

1. Baixe o APK gerado via EAS Build
2. Renomeie para `ultraiptv.apk` (opcional)
3. Copie para um pendrive formatado em FAT32

### Passo 2: Habilitar Fontes Desconhecidas

1. Na Smart TV, vá em **Configurações**
2. Procure por **Segurança e Restrições** ou **Segurança**
3. Ative **Fontes Desconhecidas** ou **Instalar apps desconhecidos**
4. Selecione o gerenciador de arquivos que você vai usar

### Passo 3: Instalar

1. Conecte o pendrive na TV
2. Abra o **Gerenciador de Arquivos** da TV
3. Navegue até o pendrive
4. Selecione `ultraiptv.apk`
5. Clique em **Instalar**
6. Aguarde a instalação
7. Clique em **Abrir** ou encontre o app na lista de aplicativos

## 🔧 Método 2: Via ADB (Android Debug Bridge)

### Pré-requisitos

- Computador com ADB instalado
- TV e computador na mesma rede Wi-Fi
- Modo desenvolvedor ativado na TV

### Passo 1: Ativar Modo Desenvolvedor

1. Vá em **Configurações** > **Sobre**
2. Clique 7 vezes em **Número de Build** ou **Versão do Android**
3. Volte para **Configurações** > **Preferências do desenvolvedor**
4. Ative **Depuração USB** e **Depuração de rede**

### Passo 2: Conectar via ADB

```bash
# Descobrir IP da TV (geralmente em Configurações > Rede)
adb connect IP_DA_TV:5555

# Verificar conexão
adb devices
```

### Passo 3: Instalar APK

```bash
adb install ultraiptv.apk
```

### Passo 4: Abrir App

```bash
adb shell am start -n com.ultraiptv.app/.MainActivity
```

## 🔧 Método 3: Via Downloader (FireStick)

### Passo 1: Instalar Downloader

1. No FireStick, vá em **Configurações** > **Meu Fire TV** > **Opções do Desenvolvedor**
2. Ative **Apps de Fontes Desconhecidas**
3. Instale o app **Downloader** da Amazon Appstore

### Passo 2: Baixar APK

1. Abra o **Downloader**
2. Digite a URL do APK (ou use um serviço de hospedagem)
3. Baixe o arquivo
4. Clique em **Instalar** quando o download terminar

## 🎮 Configuração do Controle Remoto

O app ULTRAIPTV é otimizado para controle remoto:

- **Setas**: Navegar entre itens
- **OK/Enter**: Selecionar
- **Voltar**: Voltar para tela anterior
- **Menu**: Abrir menu de contexto (se disponível)
- **Home**: Minimizar app (não fecha)

## ⚙️ Primeira Configuração

1. Abra o app ULTRAIPTV
2. Faça login com suas credenciais
3. Configure as preferências em **Settings**:
   - Formato de hora
   - Player preferido
   - Controle parental (opcional)

## 🐛 Solução de Problemas

### App não aparece na lista

- Verifique se a instalação foi concluída
- Reinicie a TV
- Verifique em **Configurações** > **Apps** > **Todos os apps**

### App não abre

- Verifique se há atualizações do sistema
- Desinstale e reinstale o app
- Limpe o cache: **Configurações** > **Apps** > **ULTRAIPTV** > **Limpar cache**

### Controle remoto não funciona

- Certifique-se de que o app está em foco
- Reinicie o app
- Verifique se há atualizações do app

### Vídeo não reproduz

- Verifique sua conexão com a internet
- Confirme se sua conta está ativa e não expirada
- Teste outros canais/filmes

## 📡 Requisitos de Rede

- Conexão estável com internet (mínimo 10 Mbps para HD)
- Porta 80/443 aberta (HTTP/HTTPS)
- Sem bloqueio de firewall para streaming

## 🔒 Segurança

- Mantenha o app atualizado
- Use senhas fortes
- Não compartilhe suas credenciais
- Ative controle parental se necessário

## 📞 Suporte

Para problemas específicos:
1. Verifique os logs do app (se disponível)
2. Teste em outro dispositivo
3. Entre em contato com o suporte

## 🎯 Dicas de Uso

- Use um controle remoto com teclado para facilitar a digitação
- Configure favoritos para acesso rápido
- Use a busca para encontrar conteúdo rapidamente
- Ajuste a qualidade do vídeo conforme sua conexão

