/**
 * Strategy for selecting emojis based on restaurant metadata.
 */

interface IconMapping {
  emoji: string;
  keywords: string[];
}

const ICON_STRATEGY: Record<string, IconMapping> = {
  italian: {
    emoji: '🇮🇹',
    keywords: ['pasta', 'italian', 'spaghetti', 'trattoria', 'osteria', 'italiano', 'lasagna', 'gnocchi', 'ravioli']
  },
  pizza: {
    emoji: '🍕',
    keywords: ['pizza', 'pizzeria', 'taglio','slice']
  },
  michelin: {
    emoji: '⭐',
    keywords: ['michelin', 'star', 'starred']
  },
  cookie: {
    emoji: '🍪',
    keywords: ['cookie', 'cookies', 'crookie', 'crookies']
  },
  french: {
    emoji: '🇫🇷',
    keywords: ['french', 'france', 'bistrot', 'bistro']
  },
  steak: {
    emoji: '🥩',
    keywords: ['steak', 'steakhouse', 'sirloin', 'ribeye', 'fillet']
  },
  korea: {
    emoji: '🇰🇷',
    keywords: ['korea', 'korean', 'corndog', 'tteokbokki', 'kimchi']
  },
  bbq: {
    emoji: '🍖',
    keywords: ['bbq', 'barbecue', 'grill', 'ribs', 'smoked', 'brisket']
  },
  ramen: {
    emoji: '🍜',
    keywords: ['ramen', 'noodle', 'pho', 'udon', 'soba']
  },
  sushi: {
    emoji: '🍣',
    keywords: ['sushi', 'sashimi', 'nigiri', 'maki', 'omakase']
  },
  dumplings: {
    emoji: '🥟',
    keywords: ['dumpling', 'dim sum', 'bao', 'gyoza', 'pierogi']
  },
  chinese: {
    emoji: '🥡',
    keywords: ['chinese', 'cinese', 'cantonese', 'szechuan', 'takeout']
  },
  japanese: {
    emoji: '🍱',
    keywords: ['japanese', 'giappo', 'giapponese', 'izakaya', 'teriyaki', 'tempura', 'bento', 'japan']
  },
  spanish: {
    emoji: '🥘',
    keywords: ['tapas', 'spanish', 'paella', 'pintxos', 'spain']
  },
  christmas: {
    emoji: '🎄',
    keywords: ['christmas', 'xmas']
  },
  bagel: {
    emoji: '🥯',
    keywords: ['bagel', 'everything', 'schmear']
  },
  thai_viet: {
    emoji: '🍲',
    keywords: ['thai', 'vietnamese', 'laotian', 'cambodian']
  },
  indian: {
    emoji: '🍛',
    keywords: ['indian', 'curry', 'india', 'tandoori', 'paneer', 'naan', 'nepalese', 'balti']
  },
  hotpot: {
    emoji: '🍢',
    keywords: ['hotpot','oden','hot pot', 'shabu']
  },
  middle_eastern: {
    emoji: '🥙',
    keywords: ['middle eastern', 'lebanese', 'falafel', 'hummus', 'kebab', 'gyro', 'shawarma', 'turkish', 'greek', 'mediterranean', 'pitta', 'pita']
  },
  bakery: {
    emoji: '🥐',
    keywords: ['bakery', 'bread', 'pastry', 'croissant', 'donut', 'cake', 'sourdough', 'eclaire', 'patisserie', 'boulangerie']
  },
  chips: {
    emoji: '🍟',
    keywords: ['chips','chip','fries','crisps']
  },
  hotdog: {
    emoji: '🌭',
    keywords: ['hotdog', 'hotdogs', 'chilidog']
  },
  burgers: {
    emoji: '🍔',
    keywords: ['burger', 'hamburger', 'smash', 'sliders', 'cheeseburger']
  },
  pancakes: {
    emoji:'🥞',
    keywords: ['pancake', 'pancakes', 'crepe', 'crepes']
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
    emoji: '🍩',
    keywords: ['dessert', 'ice cream', 'gelato', 'chocolate', 'sweet', 'sugar', 'crepe', 'cookie', 'doughnut', 'baklava', 'tiramisu', 'pudding']
  },
  bubbletea: {
    emoji: '🧋',
    keywords: ['bubble', 'bubbletea', 'bubble tea', 'boba']
  },
  beer: {
    emoji: '🍺',
    keywords: ['pub', 'bar', 'beer', 'pub grub', 'brewery', 'stout', 'ale', 'guinness', 'pilsner', 'ipa']
  },
  wine: {
    emoji: '🍷',
    keywords: ['wine', 'wine bar', 'vineyard', 'enoteca', 'sommelier']
  },
  cocktail: {
    emoji: '🍸',
    keywords: ['cocktail', 'mixology', 'spirits', 'gin', 'vodka', 'whiskey', 'rum', 'whisky']
  }
};

const DEFAULT_EMOJI = '🍴'; // Fork and Knife

/**
 * Selects the best emoji based on name, description, and category.
 */
export function getRestaurantEmoji(name: string, description: string, category: string): string {
  const combinedText = `${name} ${description} ${category}`.toLowerCase();
  for (const mapping of Object.values(ICON_STRATEGY)) {
    for (const keyword of mapping.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return mapping.emoji;
      }
    }
  }
  return DEFAULT_EMOJI;
}
