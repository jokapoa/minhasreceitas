# 🍳 ReciMe | Minhas Receitas

O aplicativo definitivo para colecionar, organizar, planejar refeições e cozinhar. Inspirado no [ReciMe](https://recime.app/).

---

## ✨ Principais Funcionalidades

- 📖 **Livro de Receitas & Coleções Digitais (Cookbooks)**: Organize suas receitas em pastas personalizadas (*Jantares Rápidos*, *Confeitaria & Doces*, *Fitness & Proteico*, *Sabores Italianos*).
- ⚡ **Importador Inteligente de Receitas**:
  - **YouTube, Instagram, TikTok e Blogs**: Extraia automaticamente ingredientes, tempos, porções e passos a partir de links de vídeos ou posts.
  - **Player de Vídeo Integrado**: Assista ao vídeo original da receita enquanto cozinha.
  - **Texto Livre com IA**: Cole qualquer texto ou anotação desestruturada.
  - **Foto / Caderno de Receitas (OCR)**: Capture fotos de livros ou cadernos manuscritos.
- 🧑‍🍳 **Modo Cozinha Passo a Passo (Hands-Free)**:
  - **Screen Wake Lock**: Mantém a tela do celular/computador sempre ligada enquanto você cozinha.
  - **Timers Integrados com Som**: Campainha agradável ao término de cada etapa (Web Audio API, 100% offline).
  - Letras gigantes e gaveta de ingredientes acessível a qualquer momento.
- ⚖️ **Escalonador Dinâmico de Porções & Conversor de Unidades**:
  - Ajuste de porções em tempo real com frações amigáveis (ex: $1\frac{1}{2}$ colheres, $800\text{g} \to 1200\text{g}$).
  - Conversor instantâneo entre Métrico ($\text{g}, \text{ml}$) e Imperial ($\text{oz}, \text{xícaras}$).
- 📅 **Planejador Semanal de Refeições (Meal Planner)**:
  - Calendário interativo de 7 dias com slots para Café da Manhã, Almoço, Jantar e Lanches.
  - Botão **"Gerar Lista de Compras da Semana"** que calcula e consolida todos os ingredientes com 1 clique.
- 🛒 **Lista de Compras Inteligente**:
  - Agrupamento automático por corredores de supermercado (*Hortifrúti*, *Carnes*, *Laticínios*, *Mercearia*, *Temperos*, etc.).
  - Barra de progresso de compras e botão direto para envio via **WhatsApp**.
- 📱 **PWA & Mobile-First**:
  - Responsivo para iPhone, Android, tablets e computadores.
  - Pode ser instalado na Tela de Início via Safari ou Chrome.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **TypeScript**
- **Vite 6** com plugin oficial `@tailwindcss/vite`
- **Tailwind CSS v4** com design system editorial (Fraunces + Plus Jakarta Sans)
- **Lucide React** (Ícones modernos)
- **Canvas Confetti** (Animações de celebração)
- **Screen Wake Lock API** & **Web Audio API**

---

## 🚀 Como Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/jokapoa/minhasreceitas.git
cd minhasreceitas

# 2. Instalar as dependências
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse **`http://localhost:5173`** no seu navegador ou `http://<seu-ip-local>:5173` no celular.

---

## 📄 Licença
Distribuído sob a licença MIT.
