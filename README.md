# Telopillo.bo

**Marketplace de Compra y Venta para Bolivia**

*"Lo que buscás, ¡telopillo!"*

---

## 🚀 Sobre el Proyecto

Telopillo.bo es un marketplace digital boliviano donde cualquier persona o negocio puede publicar productos para vender y buscar productos que necesita comprar. La plataforma conecta oferta y demanda de manera simple, rápida y con identidad local.

### 🎯 Diferenciador Principal

**Búsqueda Semántica Inteligente** que entiende:
- Sinónimos bolivianos ("chompa" = "buzo" = "sudadera")
- Errores tipográficos ("samsumg" → "samsung")
- Lenguaje coloquial ("tele grande para ver fútbol" → TVs 50"+)
- Búsquedas en lenguaje natural

---

## 🛠️ Stack Tecnológico

### Backend (BaaS)
- **Supabase** (PostgreSQL + API REST + Auth + Storage + Realtime)
  - PostgreSQL 15 con **pgvector** (búsqueda vectorial)
  - PostgREST (API auto-generada)
  - Supabase Auth (OAuth, JWT, Magic Links)
  - Supabase Storage (S3-compatible)
  - Supabase Realtime (WebSockets para chat)
  - Edge Functions (Deno runtime para background jobs)

### Embeddings & Search
- **Hugging Face Inference API** (MVP - serverless, gratis)
- **PostgreSQL Full-Text Search** (búsqueda keyword en español)
- **pgvector** (búsqueda semántica)
- **FastAPI + Sentence Transformers** (opcional, solo cuando superes rate limits)

### Frontend
- **Next.js 14+** (App Router)
- **React 18+** con **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes)
- **Supabase SDK** (data fetching + realtime)

### Infraestructura
- **Vercel** (frontend hosting - gratis)
- **Supabase Cloud** (backend - gratis hasta 10K usuarios)
- **Cloudflare R2** (storage adicional si es necesario)
- **Resend** (emails - 3K/mes gratis)

### Costo Total
- **MVP (0-10K usuarios):** $0/mes
- **Growth (10K-50K usuarios):** $25-50/mes
- **Scale (50K+ usuarios):** $100-300/mes

---

## 📁 Estructura del Proyecto

```
telopillo/
├── frontend/                    # Next.js (React + TypeScript)
│   ├── app/                    # App Router (Next.js 14+)
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (marketplace)/     # Main app routes
│   │   ├── products/          # Product pages
│   │   ├── chat/              # Chat interface
│   │   └── api/               # API routes (if needed)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── products/          # Product-related components
│   │   ├── search/            # Search components
│   │   └── chat/              # Chat components
│   ├── lib/
│   │   ├── supabase/          # Supabase client & utils
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utility functions
│   ├── types/                 # TypeScript types
│   └── package.json
│
├── supabase/                   # Supabase configuration
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge Functions (Deno)
│   │   └── generate-embedding/ # Embedding generation
│   └── config.toml            # Supabase config
│
├── search-service/            # FastAPI (optional, only Phase 2+)
│   ├── main.py               # FastAPI app for embeddings
│   ├── requirements.txt
│   └── Dockerfile
│
├── Documentation/
│   └── PRD.md                # Product Requirements Document
│
├── .env.example              # Environment variables template
└── README.md
```

---

## 🚀 Inicio Rápido

### Prerequisites

- **Node.js 18+** (para Next.js)
- **Git**
- **Cuenta en Supabase** (gratis en https://supabase.com)
- **Cuenta en Hugging Face** (gratis en https://huggingface.co)

### Instalación

1. **Clone the repository**
   ```bash
   git clone https://github.com/tu-usuario/telopillo.com.git
   cd telopillo.com
   ```

2. **Set up Supabase project**
   - Go to https://supabase.com and create a new project
   - Wait for the database to be ready (~2 minutes)
   - Go to Project Settings → API to get your credentials
   - Go to Project Settings → Database to get your connection string

3. **Configure environment variables**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_huggingface_api_key
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up database schema**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run migrations
   supabase db push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Supabase Dashboard: https://app.supabase.com/project/your-project

### Local Development with Supabase CLI (Optional)

If you want to run Supabase locally:

```bash
# Start Supabase local stack
supabase start

# This will start:
# - PostgreSQL (port 54322)
# - Supabase Studio (port 54323)
# - Edge Functions (port 54321)
# - Realtime (port 54321)

# Stop Supabase
supabase stop
```

---

## 📚 Documentation

- **[PRD (Product Requirements Document)](./Documentation/PRD.md)** - Complete product specification
- **[Supabase API Docs](https://supabase.com/docs/reference/javascript/introduction)** - Supabase JavaScript SDK
- **[Next.js Documentation](https://nextjs.org/docs)** - Next.js 14 App Router
- **Database Schema** - See `supabase/migrations/` folder

---

## 🧪 Testing

### Frontend
```bash
cd frontend

# Unit tests
npm test

# E2E tests with Playwright
npm run test:e2e

# Type checking
npm run type-check
```

### Database Tests
```bash
# Run Supabase tests
supabase test db
```

---

## 🔍 Main Features

### MVP (Phase 1) - Months 1-3
- 🚧 User registration and authentication (email, Google, Facebook)
- 🚧 Product publishing with images
- 🚧 **Hybrid search (keyword + semantic)**
- 🚧 Advanced filters (category, price, location, condition)
- 🚧 Contact sellers (internal chat + WhatsApp)
- 🚧 Reputation system (ratings)
- 🚧 Geolocation
- 🚧 Admin panel

### Phase 2 (Post-MVP) - Months 4-6
- 📅 Image search
- 📅 Voice search
- 📅 Payment gateway (Bolivian QR)
- 📅 Native mobile app (Android/iOS)
- 📅 "Looking for" posts (reverse demand)
- 📅 Shipping system

### Key Technical Features
- ✅ **Serverless architecture** (no servers to maintain)
- ✅ **Real-time chat** with Supabase Realtime
- ✅ **Semantic search** understanding Bolivian Spanish
- ✅ **Row Level Security** for data protection
- ✅ **Edge Functions** for background jobs
- ✅ **$0/month** cost for MVP phase

---

## 🌍 Deployment

### Production (Optimized for Minimum Cost)

**Estimated cost by phase:**

#### Phase 1: MVP (0-10K users)
**Cost: $0/month**
- Frontend: Vercel (free tier)
- Backend: Supabase (free tier - 500MB DB, 1GB storage, 2GB bandwidth)
- Embeddings: Hugging Face Inference API (free - 30K requests/month)
- Email: Resend (free - 3K emails/month)

#### Phase 2: Growth (10K-50K users)
**Cost: $25-50/month**
- Frontend: Vercel (free tier)
- Backend: Supabase Pro ($25/month - 8GB DB, 100GB storage)
- Embeddings: FastAPI on Render ($7/month) or keep HF API
- Email: Resend (free tier)

#### Phase 3: Scale (50K+ users)
**Cost: $100-300/month**
- Frontend: Vercel Pro ($20/month)
- Backend: Supabase Pro ($25/month)
- Embeddings: FastAPI on Render Standard ($25/month)
- CDN: Cloudflare (free or $20/month for Pro)
- Additional services as needed

### Deployment Steps

1. **Deploy Frontend to Vercel**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Set up Supabase Production**
   - Already running on Supabase Cloud
   - Configure production environment variables
   - Set up custom domain (optional)

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy generate-embedding
   ```

4. **Configure DNS**
   - Point domain to Vercel
   - Configure SSL (automatic with Vercel)

See [PRD - Section 4.2.5](./Documentation/PRD.md) for detailed scaling plan.

---

## 🤝 Contributing

This is an active development project. Contributions are welcome!

### Workflow
1. Fork the project
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards
- All code must be written in English (variables, functions, comments)
- Documentation can be in Spanish (in `Documentation/` folder only)
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

---

## 👨‍💻 Autor

**Alcides Cardenas**

---

## 🗺️ Roadmap

| Phase | Period | Status | Key Deliverables |
|-------|--------|--------|------------------|
| **Phase 0 - Discovery** | Month 1 | ✅ Completed | PRD, Stack definition, Architecture |
| **Phase 1 - MVP** | Months 2-4 | 📅 Planned | Core features, Search, Chat, Auth |
| **Phase 2 - Iteration** | Months 5-7 | 📅 Planned | Mobile optimization, Advanced search |
| **Phase 3 - Growth** | Months 8-12 | 📅 Planned | Payment gateway, Shipping, Analytics |
| **Phase 4 - Scale** | Year 2+ | 📅 Planned | Mobile app, AI features, Expansion |

### Current Sprint (Phase 1 - MVP)
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Supabase (database, auth, storage)
- [ ] Implement authentication (email, Google, Facebook)
- [ ] Create product listing and detail pages
- [ ] Implement search (keyword + semantic)
- [ ] Build real-time chat with Supabase Realtime
- [ ] Deploy to Vercel + Supabase Cloud

---

## 📊 Target Metrics (First 3 months)

- 👥 1,000 registered users
- 📦 500 active listings
- 🔍 200 daily searches
- 📈 >15% contact rate
- 🔄 >30% weekly retention

---

## 🔧 Tech Stack Highlights

### Why Supabase?
- ✅ **$0/month** for MVP (vs $100+/month with traditional stack)
- ✅ **Zero DevOps** - no servers to maintain
- ✅ **Built-in features**: Auth, Storage, Realtime, Edge Functions
- ✅ **PostgreSQL** with pgvector for semantic search
- ✅ **Row Level Security** for data protection
- ✅ **Auto-generated API** from database schema
- ✅ **Real-time subscriptions** for chat
- ✅ **Open source** - can self-host if needed

### Why Next.js 14?
- ✅ **App Router** with server components
- ✅ **Server-side rendering** for SEO
- ✅ **TypeScript** for type safety
- ✅ **Vercel deployment** (free tier)
- ✅ **Great DX** with hot reload

### Why Serverless Embeddings?
- ✅ **Hugging Face API** is free (30K requests/month)
- ✅ **No servers** to maintain
- ✅ **Edge Functions** handle background jobs
- ✅ **Scales automatically**
- ✅ **Migrate to FastAPI** only when needed (Phase 2+)

---

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)

---

**Questions?** Open an issue or contact the team.

*Made with ❤️ in Bolivia 🇧🇴*
