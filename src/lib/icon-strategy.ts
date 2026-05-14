/**
 * Strategy for selecting emojis based on restaurant metadata.
 */

interface IconMapping {
  emoji: string;
  keywords: string[];
}

const ICON_STRATEGY: Record<string, IconMapping> = {
  pizza: {
    emoji: '🍕',
    keywords: ['pizza', 'pizzeria', 'taglio', 'dough']
  },
  steak: {
    emoji: '🥩',
    keywords: ['steak', 'steakhouse', 'sirloin', 'ribeye', 'fillet']
  },
  bbq: {
    emoji: '🍖',
    keywords: ['bbq', 'barbecue', 'grill', 'ribs', 'korean bbq', 'smoked', 'brisket']
  },
  ramen: {
    emoji: '🍜',
    keywords: ['ramen', 'noodle', 'pho', 'udon', 'soba', 'thukpa']
  },
  sushi: {
    emoji: '🍣',
    keywords: ['sushi', 'sashimi', 'nigiri', 'maki', 'omakase']
  },
  dumplings: {
    emoji: '🥟',
    keywords: ['dumpling', 'dim sum', 'bao', 'gyoza', 'momo', 'potsticker', 'pierogi']
  },
  chinese: {
    emoji: '🥡',
    keywords: ['chinese', 'cantonese', 'szechuan', 'takeout']
  },
  japanese: {
    emoji: '🍱',
    keywords: ['japanese', 'izakaya', 'teriyaki', 'tempura', 'bento']
  },
  thai_viet: {
    emoji: '🥣',
    keywords: ['thai', 'vietnamese', 'laotian', 'cambodian']
  },
  indian: {
    emoji: '🍛',
    keywords: ['indian', 'curry', 'masala', 'tandoori', 'paneer', 'naan', 'south indian', 'nepalese', 'balti']
  },
  middle_eastern: {
    emoji: '🥙',
    keywords: ['middle eastern', 'lebanese', 'falafel', 'hummus', 'kebab', 'gyro', 'shawarma', 'turkish', 'greek', 'mediterranean', 'pitta']
  },
  bakery: {
    emoji: '🥐',
    keywords: ['bakery', 'bread', 'pastry', 'croissant', 'donut', 'bagel', 'cake', 'sourdough', 'eclaire', 'bakeology', 'patisserie', 'boulangerie']
  },
  italian: {
    emoji: '🍝',
    keywords: ['pasta', 'italian', 'spaghetti', 'trattoria', 'osteria', 'sicilian', 'lasagna', 'gnocchi', 'ravioli']
  },
  burgers: {
    emoji: '🍔',
    keywords: ['burger', 'hamburger', 'smash', 'sliders']
  },
  mexican: {
    emoji: '🌮',
    keywords: ['taco', 'burrito', 'mexican', 'nachos', 'guacamole', 'salsa', 'taqueria', 'quesadilla', 'enchilada']
  },
  salad: {
    emoji: '🥗',
    keywords: ['salad', 'healthy', 'vegan', 'vegetarian', 'bowl', 'poke', 'greens']
  },
  chicken: {
    emoji: '🍗',
    keywords: ['chicken', 'fried chicken', 'wings', 'nuggets', 'roast chicken', 'peri peri']
  },
  seafood: {
    emoji: '🐟',
    keywords: ['fish', 'seafood', 'lobster', 'oyster', 'crab', 'chowder', 'chipper', 'fish and chips', 'prawn', 'shrimp']
  },
  sandwich: {
    emoji: '🥪',
    keywords: ['sandwich', 'deli', 'sub', 'baguette', 'toastie', 'panini', 'sando', 'banh mi']
  },
  breakfast: {
    emoji: '🍳',
    keywords: ['breakfast', 'brunch', 'eggs', 'pancake', 'waffle', 'fry up']
  },
  coffee: {
    emoji: '☕',
    keywords: ['cafe', 'coffee', 'roastery', 'espresso', 'tea', 'latte', 'cappuccino', 'flat white', 'americano']
  },
  matcha: {
    emoji: '🍵',
    keywords: ['matcha', 'green tea', 'sencha', 'oolong']
  },
  sweet: {
    emoji: '🍰',
    keywords: ['dessert', 'ice cream', 'gelato', 'chocolate', 'sweet', 'sugar', 'crepe', 'cookie', 'doughnut', 'baklava', 'tiramisu', 'pudding']
  },
  beer: {
    emoji: '🍺',
    keywords: ['pub', 'bar', 'beer', 'taproom', 'brewery', 'stout', 'ale', 'guinness', 'pilsner', 'ipa']
  },
  wine: {
    emoji: '🍷',
    keywords: ['wine', 'wine bar', 'vineyard', 'enoteca', 'sommelier']
  },
  cocktail: {
    emoji: '🍸',
    keywords: ['cocktail', 'mixology', 'speakeasy', 'spirits', 'gin', 'vodka', 'whiskey', 'rum']
  },
  tapas: {
    emoji: '🥘',
    keywords: ['tapas', 'spanish', 'paella', 'pintxos', 'small plates']
  }
};

const DEFAULT_EMOJI = '🍴'; // Fork and Knife

/**
 * Selects the best emoji based on name, description, and category.
 */
export function getRestaurantEmoji(name: string, description: string, category: string): string {
  const combinedText = `${name} ${description} ${category}`.toLowerCase();

  // Score each icon based on keyword matches
  let bestEmoji = DEFAULT_EMOJI;
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
      bestEmoji = mapping.emoji;
    }
  }

  return bestEmoji;
}
