# Milestone 4: Search - Semantic (Embeddings)

**Duration:** Week 7  
**Goal:** Hybrid search understanding Bolivian Spanish

## Progress: 0/10 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Add `embedding` column (vector 384)
- [ ] Install pgvector extension
- [ ] Create HNSW index for similarity search
- [ ] Create semantic search function

### Backend
- [ ] Create Edge Function for embedding generation
- [ ] Integrate Hugging Face Inference API
- [ ] Create database trigger to auto-generate embeddings
- [ ] Implement hybrid search (RRF algorithm)

### Frontend
- [ ] Update search to use hybrid endpoint
- [ ] Add loading states for search
- [ ] Display relevance indicators

## Deliverables
- ✅ Intelligent search understanding synonyms and intent
- ✅ Hybrid search (keyword + semantic)

## Success Criteria
- Semantic search finds similar products
- Understands "tele grande" → "televisor 50 pulgadas"
- Handles typos and variations
- Hybrid search combines both methods
- Search quality improves vs keyword-only
- Embeddings generate automatically

## Dependencies
- M3 completed
- Hugging Face API key
- pgvector extension available

## Notes
- Use paraphrase-multilingual-MiniLM-L12-v2 (118MB model)
- Embeddings are 384 dimensions
- Use Reciprocal Rank Fusion (k=60) to merge keyword + semantic results
- Edge Function calls Hugging Face Inference API (free tier: 30K requests/month)
- Cache embeddings in database (never regenerate)
- Test with Bolivian Spanish queries ("chompa"="buzo", "tele grande"="televisor 50 pulgadas")
- Hybrid search: 50 results from keyword + 50 from semantic → RRF → top 20
- Embeddings generate automatically on product creation (database trigger)
- MVP: Hugging Face API (serverless), Growth: FastAPI self-hosted ($7/month)
