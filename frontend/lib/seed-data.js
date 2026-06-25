// DHARA AADHVIKA seed data — premium organic Indian foods

export const CATEGORIES = [
  { id: 'cat-palm-sprout', name: 'Palm Sprout Powder', slug: 'palm-sprout-powder', icon: 'Sprout', tagline: 'Pre-biotic super powder' },
  { id: 'cat-moringa', name: 'Moringa Powder', slug: 'moringa-powder', icon: 'Leaf', tagline: 'Nature’s multivitamin' },
  { id: 'cat-ragi', name: 'Ragi Flour', slug: 'ragi-flour', icon: 'Wheat', tagline: 'Calcium-rich finger millet' },
  { id: 'cat-millet', name: 'Millet Mix', slug: 'millet-mix', icon: 'Wheat', tagline: 'Ancient grains, modern living' },
  { id: 'cat-health-mix', name: 'Health Mix', slug: 'health-mix', icon: 'Soup', tagline: 'Traditional sathu maavu' },
  { id: 'cat-rice', name: 'Organic Rice', slug: 'organic-rice', icon: 'Wheat', tagline: 'Heirloom, unpolished varieties' },
  { id: 'cat-traditional', name: 'Traditional Foods', slug: 'traditional-foods', icon: 'Soup', tagline: 'Recipes from our villages' },
  { id: 'cat-herbal', name: 'Herbal Products', slug: 'herbal-products', icon: 'Sparkles', tagline: 'Time-tested wellness' },
  { id: 'cat-sweeteners', name: 'Natural Sweeteners', slug: 'natural-sweeteners', icon: 'Candy', tagline: 'Pure jaggery & alternatives' },
  { id: 'cat-oils', name: 'Cold Pressed Oils', slug: 'cold-pressed-oils', icon: 'Droplet', tagline: 'Wood-pressed, chemical-free' },
  { id: 'cat-snacks', name: 'Healthy Snacks', slug: 'healthy-snacks', icon: 'Cookie', tagline: 'Guilt-free munching' },
  { id: 'cat-grocery', name: 'Organic Grocery', slug: 'organic-grocery', icon: 'ShoppingBasket', tagline: 'Pantry essentials' },
];

export const BRANDS = [
  { id: 'brand-dhara', name: 'Dhara Aadhvika' },
  { id: 'brand-aadhvika-farms', name: 'Aadhvika Farms' },
  { id: 'brand-village-roots', name: 'Village Roots' },
  { id: 'brand-heritage', name: 'Heritage Harvest' },
];

const d = 'brand-dhara';
const f = 'brand-aadhvika-farms';
const v = 'brand-village-roots';
const h = 'brand-heritage';

export const PRODUCTS = [
  // 1. Palm Sprout Powder
  { name: 'Palm Sprout Powder (Panai Vidai)', brand: d, category: 'cat-palm-sprout', price: 399, mrp: 549, image: 'https://images.unsplash.com/photo-1565498971161-42ae3dbcca75', desc: 'Naturally sun-dried and stone-ground sprouted palmyra seeds — a traditional South Indian super food known for its cooling properties and deep nourishment.', ingredients: '100% sprouted palm seeds (Borassus flabellifer). No additives, no preservatives.', benefits: 'Cooling for the body, supports digestion, rich in calcium & iron, traditional remedy for ulcers and acidity.', nutrition: 'Per 100g • Energy 360 kcal • Protein 6g • Carbs 78g • Fat 1g • Fibre 9g', weight: '250g', specs: { Weight: '250g', Shelf: '6 months', Storage: 'Cool, dry place', Certifications: 'FSSAI • Organic' }, stock: 60, rating: 4.7 },
  // 2. Moringa Leaf Powder
  { name: 'Moringa Leaf Powder', brand: d, category: 'cat-moringa', price: 349, mrp: 499, image: 'https://images.unsplash.com/photo-1565802700474-1c8b57596859', desc: 'Shade-dried moringa (drumstick) leaves, finely powdered to retain maximum nutrients. A complete superfood used in dals, smoothies and milk.', ingredients: '100% organic moringa oleifera leaves.', benefits: '92 nutrients, 46 antioxidants. Boosts immunity, energy, lactation and overall wellness.', nutrition: 'Per 100g • Protein 27g • Calcium 2000mg • Iron 28mg • Vitamin A high', weight: '200g', specs: { Weight: '200g', Shelf: '9 months', Storage: 'Cool, dry place', Certifications: 'FSSAI • Organic' }, stock: 90, rating: 4.8 },
  // 3. Ragi Flour
  { name: 'Stone-Ground Ragi Flour (Finger Millet)', brand: f, category: 'cat-ragi', price: 159, mrp: 220, image: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f', desc: 'Traditionally stone-ground from organically grown finger millet. Perfect for ragi malt, dosa, idli and roti.', ingredients: '100% organic finger millet (Eleusine coracana).', benefits: 'Excellent source of calcium, helps in bone strength, gluten-free, controls blood sugar.', nutrition: 'Per 100g • Protein 7g • Calcium 344mg • Iron 4mg • Fibre 12g', weight: '1kg', specs: { Weight: '1kg', Shelf: '4 months', Storage: 'Airtight container', Certifications: 'FSSAI • Organic' }, stock: 120, rating: 4.6 },
  // 4. Mixed Millets
  { name: 'Five-Millet Mix Pack', brand: f, category: 'cat-millet', price: 449, mrp: 599, image: 'https://images.unsplash.com/photo-1651241587503-a874db54a1a7', desc: 'A curated mix of foxtail, kodo, little, barnyard and proso millets. Cook just like rice for daily wholesome meals.', ingredients: 'Foxtail, Kodo, Little, Barnyard, Proso millets in equal parts.', benefits: 'Low glycemic index, diabetic-friendly, fibre-rich, gluten-free.', nutrition: 'Per 100g • Protein 11g • Fibre 8g • Iron 5mg', weight: '1kg (5 × 200g)', specs: { Weight: '1kg', Shelf: '6 months', Storage: 'Airtight container' }, stock: 80, rating: 4.7 },
  // 5. Health Mix
  { name: 'Sathu Maavu — 24-Ingredient Health Mix', brand: d, category: 'cat-health-mix', price: 449, mrp: 599, image: 'https://images.unsplash.com/photo-1693996046865-19217d179161', desc: 'Our flagship traditional health mix — 24 sprouted grains, pulses, nuts and seeds, roasted and ground. Perfect for porridge, ladoos and pancakes.', ingredients: 'Ragi, jowar, bajra, wheat, maize, foxtail, chickpea, green gram, almonds, cashew, badam, cardamom and 12 more.', benefits: 'High protein, builds strength, ideal for kids, elderly and post-workout.', nutrition: 'Per 100g • Protein 15g • Calcium 280mg • Iron 6mg', weight: '500g', specs: { Weight: '500g', Shelf: '4 months', Storage: 'Airtight container' }, stock: 100, rating: 4.9 },
  // 6. Brown Rice
  { name: 'Organic Unpolished Brown Rice', brand: v, category: 'cat-rice', price: 199, mrp: 249, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c', desc: 'Naturally grown brown rice retaining the bran layer — nuttier flavour and richer nutrition than white rice.', ingredients: '100% organic brown rice.', benefits: 'Fibre rich, low GI, helps in weight management.', nutrition: 'Per 100g • Energy 370 kcal • Protein 8g • Fibre 4g', weight: '1kg', specs: { Weight: '1kg', Shelf: '8 months', Storage: 'Cool, dry place' }, stock: 150, rating: 4.5 },
  // 7. Red Rice
  { name: 'Heirloom Red Rice (Mappillai Samba)', brand: v, category: 'cat-rice', price: 249, mrp: 329, image: 'https://images.pexels.com/photos/4110263/pexels-photo-4110263.jpeg', desc: 'Ancient red rice variety traditionally fed to warriors. Hand-harvested and minimally processed.', ingredients: '100% organic red rice.', benefits: 'High anthocyanins, builds stamina, controls blood sugar.', nutrition: 'Per 100g • Protein 7g • Iron 5mg • Magnesium 110mg', weight: '1kg', specs: { Weight: '1kg', Shelf: '8 months', Storage: 'Cool, dry place' }, stock: 70, rating: 4.7 },
  // 8. White Rice
  { name: 'Hand-Pounded Organic White Rice', brand: v, category: 'cat-rice', price: 219, mrp: 279, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6', desc: 'Traditionally hand-pounded white rice from heirloom seeds. Light, fluffy and chemical-free.', ingredients: '100% organic hand-pounded rice.', benefits: 'Free from chemicals, easy to digest, retains natural aroma.', nutrition: 'Per 100g • Energy 360 kcal • Protein 7g', weight: '1kg', specs: { Weight: '1kg', Shelf: '8 months', Storage: 'Cool, dry place' }, stock: 110, rating: 4.5 },
  // 9. Jaggery
  { name: 'Traditional Country Jaggery Powder', brand: h, category: 'cat-sweeteners', price: 189, mrp: 249, image: 'https://images.unsplash.com/photo-1775817590687-f1da5d70d9ad', desc: 'Pure sugarcane jaggery powder — made the old way, no chemicals, no sulphur.', ingredients: '100% sugarcane jaggery.', benefits: 'Natural iron source, cleanses the liver, healthier sugar alternative.', nutrition: 'Per 100g • Energy 380 kcal • Iron 11mg', weight: '500g', specs: { Weight: '500g', Shelf: '6 months', Storage: 'Airtight container' }, stock: 200, rating: 4.6 },
  // 10. Coconut Oil
  { name: 'Cold Pressed Virgin Coconut Oil', brand: d, category: 'cat-oils', price: 549, mrp: 749, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', desc: 'Wood-pressed (chekku) virgin coconut oil from sun-dried copra. Unrefined, full of aroma.', ingredients: '100% cold-pressed coconut oil.', benefits: 'Boosts metabolism, great for cooking, skin and hair care.', nutrition: 'Per 100ml • MCT-rich • Lauric acid 50%', weight: '500ml', specs: { Volume: '500ml', Shelf: '12 months', Storage: 'Room temperature' }, stock: 85, rating: 4.8 },
  // 11. Sesame Oil
  { name: 'Wood-Pressed Sesame (Gingelly) Oil', brand: d, category: 'cat-oils', price: 449, mrp: 599, image: 'https://images.unsplash.com/photo-1552592074-ea7a91b851b3', desc: 'Aromatic gingelly oil pressed the traditional way — ideal for rice, chutneys and oil-bath therapy.', ingredients: '100% cold-pressed sesame oil.', benefits: 'Rich in antioxidants, supports heart health, traditional Siddha cooking oil.', nutrition: 'Per 100ml • Vit E rich • Sesamol antioxidants', weight: '500ml', specs: { Volume: '500ml', Shelf: '12 months' }, stock: 95, rating: 4.7 },
  // 12. Groundnut Oil
  { name: 'Cold Pressed Groundnut Oil', brand: d, category: 'cat-oils', price: 399, mrp: 519, image: 'https://images.unsplash.com/photo-1549978113-29eb25c8177f', desc: 'Wood-pressed from hand-picked groundnuts. Mild aroma, perfect for everyday Indian cooking.', ingredients: '100% cold-pressed groundnut oil.', benefits: 'Heart-friendly, rich in MUFA, high smoke point.', nutrition: 'Per 100ml • MUFA 50% • Vit E', weight: '1L', specs: { Volume: '1L', Shelf: '10 months' }, stock: 75, rating: 4.6 },
  // 13. Honey
  { name: 'Raw Forest Honey', brand: v, category: 'cat-herbal', price: 599, mrp: 799, image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924', desc: 'Wild honey harvested by tribal collectors from deep forests — unprocessed, unheated, with natural pollen.', ingredients: '100% raw multi-floral forest honey.', benefits: 'Natural immunity booster, soothes throat, rich in enzymes.', nutrition: 'Per 100g • Energy 304 kcal • Trace minerals', weight: '500g', specs: { Weight: '500g', Shelf: '24 months' }, stock: 130, rating: 4.9 },
  // 14. Ghee
  { name: 'A2 Cow Bilona Ghee', brand: f, category: 'cat-traditional', price: 1199, mrp: 1499, image: 'https://images.unsplash.com/photo-1573812461383-e5f8b759d12e', desc: 'Made the slow Vedic bilona way from grass-fed Gir cow milk. Golden, grainy and deeply aromatic.', ingredients: '100% A2 cow milk butter, churned and clarified.', benefits: 'Boosts immunity, aids digestion, brain food, Ayurveda staple.', nutrition: 'Per 100g • Energy 900 kcal • Vit A, D, E, K', weight: '500ml', specs: { Volume: '500ml', Shelf: '12 months' }, stock: 50, rating: 4.9 },
  // 15. Almonds
  { name: 'Premium California Almonds', brand: h, category: 'cat-grocery', price: 549, mrp: 749, image: 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9', desc: 'Hand-picked plump almonds, dried naturally. The everyday brain-food.', ingredients: '100% raw almonds.', benefits: 'Vit E, healthy fats, supports memory and skin.', nutrition: 'Per 100g • Protein 21g • Fat 49g • Fibre 13g', weight: '500g', specs: { Weight: '500g', Shelf: '10 months' }, stock: 110, rating: 4.7 },
  // 16. Cashews
  { name: 'Whole Cashew Nuts (W320)', brand: h, category: 'cat-grocery', price: 749, mrp: 999, image: 'https://images.unsplash.com/photo-1615485925873-7ecbbe90a866', desc: 'Premium W320 grade whole cashews, naturally processed.', ingredients: '100% raw whole cashews.', benefits: 'Rich in copper, magnesium, energy-dense.', nutrition: 'Per 100g • Protein 18g • Fat 44g', weight: '500g', specs: { Weight: '500g', Shelf: '10 months' }, stock: 95, rating: 4.7 },
  // 17. Turmeric
  { name: 'Pure Salem Turmeric Powder', brand: f, category: 'cat-traditional', price: 199, mrp: 269, image: 'https://images.unsplash.com/photo-1615485500834-bc10199bc727', desc: 'High-curcumin Salem variety turmeric, stone-ground and unadulterated.', ingredients: '100% turmeric (Curcuma longa).', benefits: 'Anti-inflammatory, builds immunity, traditional healer.', nutrition: 'Per 100g • Curcumin 3-5% • Iron 47mg', weight: '250g', specs: { Weight: '250g', Shelf: '12 months' }, stock: 180, rating: 4.8 },
  // 18. Black Pepper
  { name: 'Malabar Black Peppercorns', brand: h, category: 'cat-traditional', price: 299, mrp: 399, image: 'https://images.unsplash.com/photo-1591801058986-9e28e68670f7', desc: 'Sun-dried whole peppercorns from the spice gardens of Kerala.', ingredients: '100% whole black peppercorns.', benefits: 'Boosts digestion, aids nutrient absorption.', nutrition: 'Per 100g • Piperine 5% • Manganese rich', weight: '250g', specs: { Weight: '250g', Shelf: '24 months' }, stock: 140, rating: 4.6 },
  // 19. Herbal Tea
  { name: 'Tulsi Karpooravalli Herbal Tea', brand: v, category: 'cat-herbal', price: 249, mrp: 349, image: 'https://images.pexels.com/photos/6694154/pexels-photo-6694154.jpeg', desc: 'A soothing blend of holy basil and Indian borage leaves — perfect for coughs, colds and daily wellness.', ingredients: 'Tulsi leaves, karpooravalli leaves, lemongrass, ginger.', benefits: 'Decongestant, immunity, calming.', nutrition: 'Caffeine free • 100% herbs', weight: '100g (about 50 cups)', specs: { Weight: '100g', Shelf: '12 months' }, stock: 90, rating: 4.6 },
  // 20. Ashwagandha
  { name: 'Ashwagandha Root Powder', brand: v, category: 'cat-herbal', price: 379, mrp: 499, image: 'https://images.unsplash.com/photo-1693996046865-19217d179161', desc: 'KSM-grade ashwagandha root, shade-dried and finely powdered. The classic adaptogen.', ingredients: '100% Withania somnifera root.', benefits: 'Reduces stress, improves sleep, builds stamina.', nutrition: 'Withanolides 2.5%+', weight: '200g', specs: { Weight: '200g', Shelf: '18 months' }, stock: 100, rating: 4.7 },
  // 21. Cookies
  { name: 'Multigrain Jaggery Cookies', brand: d, category: 'cat-snacks', price: 199, mrp: 249, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35', desc: 'Bakery-fresh cookies made with multigrain flour, ghee and jaggery — zero refined sugar.', ingredients: 'Whole wheat, ragi, oats, jaggery, cow ghee, cardamom.', benefits: 'Healthier snack option, no maida, no white sugar.', nutrition: 'Per 100g • Energy 420 kcal • Protein 8g • Fibre 6g', weight: '200g', specs: { Weight: '200g', Shelf: '3 months' }, stock: 160, rating: 4.5 },
  // 22. Makhana
  { name: 'Roasted Makhana (Fox Nuts)', brand: d, category: 'cat-snacks', price: 249, mrp: 329, image: 'https://images.pexels.com/photos/7051132/pexels-photo-7051132.jpeg', desc: 'Lightly roasted in cow ghee and Himalayan salt. The perfect crunchy fast snack.', ingredients: 'Fox nuts, cow ghee, pink salt, black pepper.', benefits: 'Low calorie, high in calcium and magnesium.', nutrition: 'Per 100g • Energy 347 kcal • Protein 9g', weight: '150g', specs: { Weight: '150g', Shelf: '4 months' }, stock: 140, rating: 4.7 },
  // 23. Dates
  { name: 'Premium Medjool Dates', brand: h, category: 'cat-grocery', price: 449, mrp: 599, image: 'https://images.unsplash.com/photo-1629738601425-494c3d6ba3e2', desc: 'Plump, soft Medjool dates — nature’s candy.', ingredients: '100% Medjool dates.', benefits: 'Natural sweetener, iron rich, energy booster.', nutrition: 'Per 100g • Energy 277 kcal • Fibre 7g', weight: '500g', specs: { Weight: '500g', Shelf: '8 months' }, stock: 110, rating: 4.8 },
  // 24. Wheat Flour
  { name: 'Stone-Ground Whole Wheat Atta', brand: f, category: 'cat-grocery', price: 219, mrp: 279, image: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f', desc: 'Sharbati wheat, traditionally stone-ground in small batches. Soft rotis guaranteed.', ingredients: '100% whole wheat (Sharbati variety).', benefits: 'High fibre, no preservatives, retains the wheat germ.', nutrition: 'Per 100g • Protein 12g • Fibre 11g', weight: '5kg', specs: { Weight: '5kg', Shelf: '4 months' }, stock: 70, rating: 4.6 },
];

export const HERO_SLIDES = [
  { id: 'h1', image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924', title: 'Pure. Honest. Rooted.', subtitle: 'Premium organic foods sourced straight from Indian villages — the way our grandmothers knew.', cta: 'Shop the Collection', link: '/products' },
  { id: 'h2', image: 'https://images.unsplash.com/photo-1651241587503-a874db54a1a7', title: 'Ancient grains, modern meals', subtitle: 'Five-millet packs, ragi, red rice and forgotten cereals — back on your plate.', cta: 'Explore Millets', link: '/products?category=millet-mix' },
  { id: 'h3', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', title: 'Wood-pressed oils. No shortcuts.', subtitle: 'Coconut, sesame and groundnut oils made the chekku way — raw, fragrant, alive.', cta: 'Shop Oils', link: '/products?category=cold-pressed-oils' },
  { id: 'h4', image: 'https://images.unsplash.com/photo-1565802700474-1c8b57596859', title: 'Nature’s pharmacy', subtitle: 'Moringa, ashwagandha, tulsi and other time-tested herbs for everyday wellness.', cta: 'Shop Herbal', link: '/products?category=herbal-products' },
];

export const SEED_VERSION = 2;
