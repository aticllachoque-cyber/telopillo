# Milestone 5: Real-time Chat

**Duration:** Week 8-9  
**Goal:** Buyers and sellers can communicate

## Progress: 0/19 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Create `conversations` table
- [ ] Create `messages` table
- [ ] Set up RLS policies for privacy
- [ ] Create indexes for chat queries
- [ ] Add unread count tracking

### Frontend - Chat UI
- [ ] Chat list page (conversations with last message preview)
- [ ] Chat conversation page with product context
- [ ] Message input component
- [ ] Message bubble component (buyer/seller differentiation)
- [ ] "Contact Seller" button on product page
- [ ] Unread message badges
- [ ] WhatsApp redirect option (alternative to internal chat)

### Frontend - Real-time Features
- [ ] Real-time message updates (Supabase Realtime)
- [ ] Typing indicators (broadcast)
- [ ] Online presence tracking

### Backend
- [ ] Create conversation on first contact
- [ ] Message CRUD operations
- [ ] Mark messages as read
- [ ] Update last_message timestamp

## Deliverables
- ✅ Full real-time chat system
- ✅ Typing indicators and presence

## Success Criteria
- Messages appear instantly
- Typing indicators work
- Online status shows correctly
- Unread counts are accurate
- Conversations are private (RLS)
- Chat works on mobile
- No message loss

## Dependencies
- M2 completed (products exist)
- M1 completed (user profiles)
- Supabase Realtime enabled

## Notes
- Use Supabase Realtime (WebSockets)
- Implement presence tracking
- Add typing indicators with broadcast
- Keep conversations private with RLS
- Optimize for mobile networks (low bandwidth)
- Handle reconnection gracefully
- Email notifications for new messages
- Push web notifications (optional)
- Link conversation to specific product
- Show product info in chat header
