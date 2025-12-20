# 🔧 Solução: Erro de Build Gradle

## ❌ Problema

```
Gradle build failed with unknown error
```

## ✅ Soluções

### 1. Verificar Logs Detalhados

Acesse os logs completos do build:
https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds/933f1607-1001-4b87-8190-4c0a8ddf26be#run-gradlew

### 2. Correções Aplicadas

✅ Adicionado `versionCode` no app.json
✅ Adicionado `compileSdkVersion`, `targetSdkVersion`, `minSdkVersion`

### 3. Próximos Passos

#### Opção A: Tentar Build Novamente

```powershell
cd mobile
eas build -p android --profile preview
```

#### Opção B: Verificar Assets

Certifique-se de que os assets existem (ou remova referências):

**Se os assets não existem**, o app.json foi configurado para funcionar sem eles.

#### Opção C: Build Local (Mais Controle)

Se o build na nuvem continuar falhando, tente build local:

```powershell
cd mobile
eas build -p android --profile preview --local
```

**Requisitos para build local:**
- Android SDK instalado
- Java JDK 17+
- Variáveis de ambiente configuradas

### 4. Problemas Comuns e Soluções

#### Problema: Assets faltando
**Solução**: O app.json foi configurado para funcionar sem assets obrigatórios.

#### Problema: Versão do SDK
**Solução**: Adicionado `compileSdkVersion: 34` e `targetSdkVersion: 34`.

#### Problema: Dependências
**Solução**: Verifique se todas as dependências estão instaladas:
```powershell
cd mobile
npm install
```

### 5. Verificar Logs

Os logs detalhados mostrarão o erro exato. Acesse:
- Dashboard: https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds
- Logs específicos: https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds/933f1607-1001-4b87-8190-4c0a8ddf26be#run-gradlew

### 6. Se Continuar Falhando

1. **Verifique os logs** para ver o erro específico
2. **Tente build local** para ter mais controle
3. **Verifique dependências** com `npm install`
4. **Limpe cache**: `npx expo start --clear`

---

## 📝 Nota

O build pode falhar por vários motivos. Os logs detalhados no link acima mostrarão o erro exato do Gradle.

**Próximo passo**: Verifique os logs e tente o build novamente com as correções aplicadas.

