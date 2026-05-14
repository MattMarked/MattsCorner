/**
 * Strategy for selecting OpenMoji icons based on restaurant metadata.
 */

interface IconMapping {
  hex: string;
  keywords: string[];
}

const ICON_STRATEGY: Record<string, IconMapping> = {
  pizza: {
    hex: '1F355', // Slice of Pizza
    keywords: ['pizza', 'pizzeria', 'taglio', 'dough']
  },
  steak: {
    hex: '1F969', // Cut of Meat
    keywords: ['steak', 'steakhouse', 'grill', 'bbq', 'barbecue', 'meat']
  },
  asian: {
    hex: '1F35C', // Steaming Bowl
    keywords: ['ramen', 'sushi', 'noodle', 'chinese', 'thai', 'japanese', 'vietnamese', 'korean', 'asian', 'dim sum', 'bao', 'hot pot', 'pho', 'hotpot']
  },
  bakery: {
    hex: '1F950', // Croissant
    keywords: ['bakery', 'bread', 'pastry', 'croissant', 'donut', 'bagel', 'cake', 'sourdough', 'eclaire', 'empanadas', 'bakeology']
  },
  italian: {
    hex: '1F35D', // Spaghetti
    keywords: ['pasta', 'italian', 'spaghetti', 'trattoria', 'osteria', 'sicilian']
  },
  burgers: {
    hex: '1F354', // Hamburger
    keywords: ['burger', 'hamburger', 'smash', 'sando']
  },
  mexican: {
    hex: '1F32E', // Taco
    keywords: ['taco', 'burrito', 'mexican', 'nachos', 'guacamole', 'salsa', 'taqueria']
  },
  coffee: {
    hex: '2615', // Hot Beverage
    keywords: ['cafe', 'coffee', 'roastery', 'espresso', 'tea', 'matcha']
  },
  sweet: {
    hex: '1F370', // Shortcake
    keywords: ['dessert', 'ice cream', 'gelato', 'chocolate', 'sweet', 'sugar', 'crepe', 'waffle', 'cookie']
  },
  pub: {
    hex: '1F37A', // Beer Mug
    keywords: ['pub', 'bar', 'beer', 'wine', 'cocktail', 'taproom', 'distillery', 'grub']
  },
  seafood: {
    hex: '1F41F', // Fish
    keywords: ['fish', 'seafood', 'lobster', 'oyster', 'crab', 'chowder']
  },
  sandwich: {
    hex: '1F96A', // Sandwich
    keywords: ['sandwich', 'deli', 'sub', 'baguette']
  },
  breakfast: {
    hex: '1F373', // Cooking (Frying Pan)
    keywords: ['breakfast', 'brunch', 'eggs', 'pancake']
  }
};

const DEFAULT_ICON = '1F374'; // Fork and Knife

/**
 * Selects the best OpenMoji hex code based on name, description, and category.
 */
export function getRestaurantIconHex(name: string, description: string, category: string): string {
  const combinedText = `${name} ${description} ${category}`.toLowerCase();

  // Score each icon based on keyword matches
  let bestIcon = DEFAULT_ICON;
  let maxScore = 0;

  for (const mapping of Object.values(ICON_STRATEGY)) {
    let score = 0;
    for (const keyword of mapping.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        // Direct category matches get higher priority
        if (category.toLowerCase().includes(keyword.toLowerCase())) {
          score += 5;
        } else {
          score += 1;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestIcon = mapping.hex;
    }
  }

  return bestIcon;
}
