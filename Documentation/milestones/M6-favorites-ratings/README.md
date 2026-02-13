# Milestone 6: Favorites & Ratings

**Duration:** Week 10  
**Goal:** Users can save products and rate sellers

## Progress: 0/13 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Create `favorites` table
- [ ] Create `ratings` table
- [ ] Set up RLS policies
- [ ] Create trigger to update user rating_average

### Frontend - Favorites
- [ ] Favorite button on product cards
- [ ] Favorites page (saved products)

### Frontend - Ratings
- [ ] Rating component (1-5 stars)
- [ ] Rating form (star rating + optional comment, max 500 chars)
- [ ] Display seller ratings on profile/products
- [ ] Rating history view
- [ ] Rating badges (New Seller, Trusted Seller, Top Seller, Low Rating)

### Backend
- [ ] Add/remove favorites
- [ ] Submit rating
- [ ] Calculate average rating
- [ ] Prevent duplicate ratings

## Deliverables
- ✅ Favorites and reputation system
- ✅ Seller ratings visible on profiles

## Success Criteria
- Users can favorite/unfavorite products
- Favorites page shows saved products
- Users can rate sellers (1-5 stars)
- Average rating calculates correctly
- Ratings display on seller profiles
- Cannot rate same seller twice
- Rating affects seller reputation

## Dependencies
- M2 completed (products)
- M1 completed (user profiles)

## Notes
- **Only buyers can rate sellers** (not mutual)
- Ratings are 1-5 stars (integer, required)
- Optional comment (max 500 chars)
- Must have active conversation to rate
- One rating per user per product
- Auto-update seller's average rating
- Show rating count (e.g., "⭐ 4.7 (23)")
- Prevent self-rating
- Can edit rating within 7 days
- Cannot delete ratings (only hide by admin)
- Rate limiting: Max 10 ratings/day per user
