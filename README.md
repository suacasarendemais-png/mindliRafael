# MINDLI - Plataforma Educacional Digital

## Resumo
- SPA em React + TypeScript + Vite
- Backend: Firebase (Auth + Firestore)
- UI: TailwindCSS

## Pré-requisitos
- Node.js (v18+ recomendado)
- Conta Firebase (projeto criado)

## Variáveis de ambiente (crie `.env.local` na raiz)
- VITE_FIREBASE_API_KEY=
- VITE_FIREBASE_AUTH_DOMAIN=
- VITE_FIREBASE_PROJECT_ID=
- VITE_FIREBASE_STORAGE_BUCKET=
- VITE_FIREBASE_MESSAGING_SENDER_ID=
- VITE_FIREBASE_APP_ID=
- VITE_GEMINI_API_KEY= (opcional, se utilizar Gemini)
- VITE_DEMO_MODE= (opcional)
- VITE_DEMO_EMAIL= (opcional)
- VITE_DEMO_PASSWORD= (opcional)

## Executando localmente
1. Instale dependências:
   ```bash
   npm install
   ```

2. Crie `.env.local` com as variáveis acima (NÃO comitar esse arquivo).

3. Rodar em modo dev:
   ```bash
   npm run dev
   ```

4. Build de produção:
   ```bash
   npm run build
   ```
   (verifique a pasta `dist` gerada)

## Observações importantes
- O arquivo `lib/firebase.ts` espera variáveis com prefixo `VITE_`. Garanta que o `.env.local` use esse prefixo.
- No Firebase Console, habilite Authentication > Sign-in method > Email/Password se pretende criar usuários via front-end.
- Deletar um usuário do Firebase Auth via UI exige backend (Admin SDK / Cloud Function). O front-end apenas deleta o documento no Firestore.
- O `importmap` que existia no `index.html` original foi removido pois força versões de libs diferentes do `package.json` e quebra o build do Vite.

## Deploy (Exemplo com Vercel)
- **Conecte o repositório.**
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Configure as env vars:** No painel do projeto na Vercel, adicione as mesmas variáveis de ambiente do seu `.env.local` (com os nomes `VITE_*`).

## Checklist antes do upload / deploy
- [ ] Definir e testar as variáveis `VITE_FIREBASE_*` localmente.
- [ ] Rodar `npm run dev` e testar funcionalidades básicas.
- [ ] Rodar `npm run build` e corrigir erros de build se existirem.
- [ ] Subir para a plataforma de deploy e configurar as variáveis de ambiente.
- [ ] Revisar as regras de segurança do Firestore para produção.
