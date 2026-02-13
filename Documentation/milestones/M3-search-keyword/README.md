# Milestone 3: Search - Keyword (PostgreSQL FTS)

**Duration:** Week 6  
**Goal:** Basic search with filters working

## Progress: 0/11 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Add `search_vector` column (tsvector)
- [ ] Configure Spanish text search
- [ ] Create trigger to auto-update search_vector
- [ ] Add Bolivian Spanish synonyms dictionary
- [ ] Create search function with filters

### Frontend
- [ ] Search bar component with autocomplete
- [ ] Search results page
- [ ] Filter sidebar (category, price range, location, condition, date)
- [ ] Sort options (relevance, most recent, price low-high, price high-low, distance, most viewed)
- [ ] Pagination or infinite scroll
- [ ] Empty state handling
- [ ] Search suggestions
- [ ] "No results" with related searches

### Backend
- [ ] Implement keyword search function
- [ ] Apply filters (category, price range, location)
- [ ] Optimize search queries

## Deliverables
- ✅ Working keyword search with filters
- ✅ Bolivian Spanish support

## Success Criteria
- Search returns relevant results
- Filters work correctly
- Spanish stemming works
- Bolivian synonyms recognized (chompa=buzo)
- Search is fast (<500ms)
- Pagination works

## Dependencies
- M2 completed
- Products in database for testing

## Notes
- Use PostgreSQL Full-Text Search
- Configure Spanish text search config
- Add trigram similarity for typos
- Implement synonym dictionary
- Test with real Bolivian Spanish queries
