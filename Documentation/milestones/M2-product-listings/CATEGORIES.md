# Product Categories - Complete Taxonomy

## Category Structure

**2 levels:** Category → Subcategory

## Complete Category List

### 1. Electronics & Technology 📱
- Smartphones
- Laptops & Computers
- Tablets
- TVs & Audio
- Cameras & Photography
- Video Games & Consoles
- Accessories
- Smart Home

### 2. Vehicles & Auto Parts 🚗
- Cars
- Motorcycles
- Bicycles
- Auto Parts
- Tires & Wheels
- Accessories
- Tools

### 3. Home & Furniture 🏠
- Living Room
- Bedroom
- Kitchen
- Bathroom
- Garden & Outdoor
- Appliances
- Decoration

### 4. Fashion & Accessories 👕
- Men's Clothing
- Women's Clothing
- Kids' Clothing
- Shoes
- Bags & Backpacks
- Jewelry & Watches
- Sunglasses

### 5. Construction & Hardware 🔨
- Tools
- Building Materials
- Plumbing
- Electrical
- Paint & Supplies
- Safety Equipment

### 6. Sports & Outdoors ⚽
- Gym Equipment
- Sports Gear
- Camping & Hiking
- Bicycles
- Water Sports
- Team Sports

### 7. Baby & Kids 👶
- Baby Clothing
- Toys
- Strollers & Car Seats
- Furniture
- Feeding
- Diapers & Care

### 8. Beauty & Health 💄
- Skincare
- Makeup
- Hair Care
- Perfumes
- Health Supplements
- Medical Equipment

### 9. Books & Education 📚
- Books
- Textbooks
- Courses
- Musical Instruments
- Art Supplies

### 10. Pets 🐶
- Pet Food
- Accessories
- Toys
- Cages & Aquariums
- Grooming

### 11. Office & Business 💼
- Office Furniture
- Supplies
- Printers & Scanners
- Business Equipment

### 12. Food & Beverages 🍎
- Fresh Produce
- Packaged Foods
- Beverages
- Snacks
- Gourmet

### 13. Services 🛠️
- Repairs
- Cleaning
- Moving
- Tutoring
- Events
- Professional Services

### 14. Other 📦
- Collectibles
- Antiques
- Crafts
- Miscellaneous

## Implementation Notes

- Categories can be hardcoded in frontend or stored in database
- Use consistent IDs across frontend and backend
- Icons are emoji for simplicity (can be replaced with SVG icons later)
- Order matters for display (Electronics first, Other last)
- All categories support both Spanish and English names
- Subcategories are optional but recommended for better search

## Database Schema (Optional)

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);
```

## Bolivian Spanish Synonyms

These should be added to the search dictionary:

- chompa = buzo = sudadera
- auto = carro = vehículo = automóvil
- tele = televisor = tv = pantalla
- celu = celular = móvil = teléfono
- compu = computadora = pc = laptop
- refri = refrigerador = heladera = nevera
