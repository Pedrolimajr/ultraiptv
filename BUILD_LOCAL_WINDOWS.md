# 🏠 Guia Completo: Build Local no Windows

## 📋 Pré-requisitos

- Windows 10/11
- ~15GB de espaço livre
- Conexão com internet
- 2-3 horas para configuração inicial

## 🚀 Passo a Passo

### 1️⃣ Instalar Java JDK

1. Baixe JDK 17: https://adoptium.net/temurin/releases/
2. Escolha: **Windows x64** > **JDK 17** > **.msi**
3. Instale (deixe todas as opções padrão)
4. Verifique:
   ```powershell
   java -version
   ```

### 2️⃣ Instalar Android Studio

1. Baixe: https://developer.android.com/studio
2. Execute o instalador
3. Durante instalação, certifique-se de instalar:
   - ✅ Android SDK
   - ✅ Android SDK Platform
   - ✅ Android Virtual Device
   - ✅ Performance (Intel HAXM)

### 3️⃣ Configurar Android SDK

1. Abra o Android Studio
2. Vá em: **More Actions** > **SDK Manager**
3. Na aba **SDK Platforms**, instale:
   - ✅ Android 13.0 (Tiramisu) - API Level 33
   - ✅ Android 12.0 (S) - API Level 31
4. Na aba **SDK Tools**, certifique-se de ter:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Command-line Tools

### 4️⃣ Configurar Variáveis de Ambiente

1. Pressione `Win + R`
2. Digite: `sysdm.cpl` e pressione Enter
3. Aba **Avançado** > **Variáveis de Ambiente**

**Criar/Editar variáveis**:

#### ANDROID_HOME
- **Nome**: `ANDROID_HOME`
- **Valor**: `C:\Users\SeuUsuario\AppData\Local\Android\Sdk`
  (Substitua `SeuUsuario` pelo seu usuário do Windows)

#### JAVA_HOME
- **Nome**: `JAVA_HOME`
- **Valor**: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
  (Ajuste conforme sua instalação do JDK)

#### PATH
Edite a variável **PATH** e adicione:
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\tools`
- `%ANDROID_HOME%\tools\bin`
- `%JAVA_HOME%\bin`

### 5️⃣ Verificar Instalação

Abra um **NOVO PowerShell** (importante: novo terminal) e execute:

```powershell
# Verificar Java
java -version

# Verificar Android SDK
adb version

# Verificar variáveis
echo $env:ANDROID_HOME
echo $env:JAVA_HOME
```

### 6️⃣ Fazer Build Local

```powershell
cd mobile
eas build -p android --profile apk --local
```

**Tempo estimado**: 10-30 minutos (dependendo da máquina)

## 🐛 Problemas Comuns

### "adb não é reconhecido"

**Solução**: 
- Verifique se `ANDROID_HOME` está correto
- Verifique se adicionou ao PATH
- **Reinicie o terminal** após configurar variáveis

### "java não é reconhecido"

**Solução**:
- Verifique se `JAVA_HOME` está correto
- Verifique se adicionou `%JAVA_HOME%\bin` ao PATH
- **Reinicie o terminal**

### "SDK não encontrado"

**Solução**:
- Verifique o caminho do Android SDK
- Geralmente está em: `C:\Users\SeuUsuario\AppData\Local\Android\Sdk`

### Build muito lento

**Solução**:
- Normal na primeira vez (baixa dependências)
- Próximos builds serão mais rápidos

## ✅ Checklist

- [ ] Java JDK instalado e funcionando
- [ ] Android Studio instalado
- [ ] Android SDK instalado
- [ ] Variáveis de ambiente configuradas
- [ ] Terminal reiniciado
- [ ] Comandos de verificação funcionando
- [ ] Build local executado

## 💡 Dica

**A primeira vez é sempre mais demorada**. Depois que configurar, os próximos builds serão mais rápidos.

## 🆘 Ainda com Problemas?

1. Verifique se todas as variáveis estão corretas
2. **Reinicie o computador** (às vezes ajuda)
3. Verifique os logs do build para erros específicos

