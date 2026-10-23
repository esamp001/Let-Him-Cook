import type { Recipe } from '../types/recipe';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Chicken Potato Soup',
    description:
      'A comforting and hearty soup with tender chicken, potatoes, and fresh herbs.',
    imageUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 35,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Chicken breast', quantity: '500g', isOwned: true },
      { name: 'Potatoes', quantity: '4 medium', isOwned: true },
      { name: 'Onion', quantity: '1', isOwned: false },
      { name: 'Garlic', quantity: '3 cloves', isOwned: false },
      { name: 'Chicken broth', quantity: '1 L', isOwned: false },
      { name: 'Salt & pepper', quantity: 'to taste', isOwned: true },
      { name: 'Fresh parsley', quantity: '1 bunch', isOwned: false, isOptional: true },
    ],
    steps: [
      'Cut chicken and vegetables into bite-sized pieces.',
      'Sauté diced onion and minced garlic in a large pot until fragrant.',
      'Add chicken and cook until lightly golden.',
      'Add potatoes and pour in the chicken broth.',
      'Simmer gently for 20 minutes until potatoes are tender.',
      'Season with salt and pepper, garnish with fresh parsley, and serve warm.',
    ],
  },
  {
    id: '2',
    title: 'Chicken Curry',
    description:
      'A rich and aromatic chicken curry with potatoes simmered in a creamy spiced coconut gravy.',
    imageUrl:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 45,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Chicken breast or thighs', quantity: '500g', isOwned: true },
      { name: 'Potatoes', quantity: '3 medium', isOwned: true },
      { name: 'Curry powder', quantity: '2 tbsp', isOwned: false },
      { name: 'Coconut milk', quantity: '400ml', isOwned: false },
      { name: 'Onion', quantity: '1 large', isOwned: false },
      { name: 'Garlic & Ginger paste', quantity: '1 tbsp', isOwned: false },
    ],
    steps: [
      'Heat oil in a heavy saucepan and cook onion until soft.',
      'Add garlic-ginger paste and curry powder, stirring for 1 minute.',
      'Add chicken pieces and brown on all sides.',
      'Add cubed potatoes and pour in coconut milk.',
      'Cover and simmer on medium-low for 30 minutes until thick and tender.',
      'Serve hot with steamed rice.',
    ],
  },
  {
    id: '3',
    title: 'Roasted Chicken & Potatoes',
    description:
      'Crispy golden roasted chicken baked alongside tender seasoned potato wedges.',
    imageUrl:
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 50,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Chicken pieces', quantity: '600g', isOwned: true },
      { name: 'Potatoes', quantity: '4 large', isOwned: true },
      { name: 'Olive oil', quantity: '3 tbsp', isOwned: true },
      { name: 'Rosemary & Thyme', quantity: '2 sprigs', isOwned: false },
      { name: 'Garlic powder & paprika', quantity: '1 tsp each', isOwned: false },
    ],
    steps: [
      'Preheat oven to 200°C (400°F).',
      'Cut potatoes into wedges and arrange on a baking sheet with chicken.',
      'Drizzle olive oil and season generously with herbs and paprika.',
      'Roast for 45-50 minutes until chicken is golden and potatoes are crispy.',
    ],
  },
  {
    id: '4',
    title: 'One-Pan Chicken & Potatoes',
    description:
      'Quick weeknight skillet meal combining seared chicken chunks and crispy diced potatoes.',
    imageUrl:
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 40,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Chicken breast', quantity: '450g', isOwned: true },
      { name: 'Potatoes', quantity: '3 medium', isOwned: true },
      { name: 'Butter', quantity: '2 tbsp', isOwned: false },
      { name: 'Garlic', quantity: '4 cloves', isOwned: false },
      { name: 'Italian seasoning', quantity: '1 tsp', isOwned: false },
    ],
    steps: [
      'Parboil diced potatoes for 5 minutes and drain.',
      'Melt butter in a large skillet and sear chicken chunks until golden; remove.',
      'In the same skillet, crisp the potatoes with garlic and Italian herbs.',
      'Return chicken to the skillet, toss together, and cook 3 minutes.',
    ],
  },
  {
    id: '5',
    title: 'Chicken and Potato Hash',
    description:
      'Flavorful rustic hash made with shredded chicken, diced potatoes, and caramelized onions.',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 30,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Cooked chicken', quantity: '300g', isOwned: true },
      { name: 'Potatoes', quantity: '3 small', isOwned: true },
      { name: 'Bell pepper', quantity: '1', isOwned: false },
      { name: 'Onion', quantity: '1', isOwned: false },
      { name: 'Cheddar cheese', quantity: '50g', isOwned: false, isOptional: true },
    ],
    steps: [
      'Dice potatoes small and fry in oil until browned and crisp.',
      'Add diced onion and bell pepper, sautéing until tender.',
      'Fold in shredded chicken and cook until heated through.',
      'Top with cheese if desired and serve right from the skillet.',
    ],
  },
  {
    id: '6',
    title: 'Creamy Chicken Potato Bake',
    description:
      'Decadent baked casserole with layers of sliced potatoes and tender chicken in a creamy sauce.',
    imageUrl:
      'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 55,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Chicken breast', quantity: '500g', isOwned: true },
      { name: 'Potatoes', quantity: '5 medium', isOwned: true },
      { name: 'Heavy cream', quantity: '250ml', isOwned: false },
      { name: 'Garlic', quantity: '3 cloves', isOwned: false },
      { name: 'Parmesan cheese', quantity: '80g', isOwned: false },
    ],
    steps: [
      'Slice potatoes thinly and cut chicken into strips.',
      'Layer half the potatoes, then chicken, then remaining potatoes in a baking dish.',
      'Whisk heavy cream, minced garlic, salt, and pepper; pour evenly over top.',
      'Cover with foil and bake at 180°C for 40 minutes.',
      'Uncover, top with parmesan, and bake 15 more minutes until bubbling and golden.',
    ],
  },
  {
    id: '7',
    title: 'Garlic Fried Rice',
    description:
      'Fragrant, classic toasted garlic fried rice with crisp garlic chips.',
    imageUrl:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 15,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Cooked cold rice', quantity: '3 cups', isOwned: true },
      { name: 'Garlic', quantity: '8 cloves', isOwned: false },
      { name: 'Cooking oil', quantity: '2 tbsp', isOwned: true },
      { name: 'Salt & pepper', quantity: 'to taste', isOwned: true },
    ],
    steps: [
      'Fry thinly sliced garlic in oil until golden and crispy; drain on paper towel.',
      'In the same fragrant oil, toss cold rice breaking up any clumps.',
      'Season with salt and pepper, stir-frying on high heat for 5 minutes.',
      'Garnish with the crispy garlic chips and serve.',
    ],
  },
  {
    id: '8',
    title: 'Pasta Primavera',
    description:
      'Fresh pasta tossed with seasonal crisp vegetables and light olive oil garlic sauce.',
    imageUrl:
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
    cookingTimeMinutes: 30,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Pasta', quantity: '350g', isOwned: true },
      { name: 'Cherry tomatoes', quantity: '1 cup', isOwned: false },
      { name: 'Bell peppers', quantity: '1 sliced', isOwned: false },
      { name: 'Zucchini', quantity: '1 sliced', isOwned: false },
      { name: 'Parmesan cheese', quantity: 'to taste', isOwned: false },
    ],
    steps: [
      'Boil pasta in salted water until al dente.',
      'Sauté zucchini, peppers, and cherry tomatoes in olive oil and garlic.',
      'Toss drained pasta directly into the vegetable skillet with 2 tbsp pasta water.',
      'Top with grated parmesan and fresh black pepper.',
    ],
  },
];

