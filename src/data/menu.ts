/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          CAVALI — FULL MENU DATA                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  desc: string;
  emoji: string;
  requiresSauce?: boolean;
};

export type MenuSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  items: MenuItem[];
};

export const WING_SAUCES = [
  "Buffalo",
  "BBQ",
  "Garlic Parmesan",
  "Lemon Pepper",
  "Honey BBQ",
  "Mango Habanero",
];

export const FOOD_MENU: MenuSection[] = [
  {
    id: "appetizers", title: "Small Plates to Share", subtitle: "Appetizers", icon: "🍿", color: "#FF5A1F",
    items: [
      { id: "hummus",     name: "Hummus",              price: 10, emoji: "🫘", desc: "Creamy chickpea puree with tahini, olive oil, and warm pita." },
      { id: "falafel",    name: "Falafel",             price: 10, emoji: "🧆", desc: "Crisp chickpea fritters served with tahini sauce and pickled vegetables." },
      { id: "dyn_chk",   name: "Dynamite Chicken",    price: 14, emoji: "🔥", desc: "Crispy chicken bites tossed in our signature spicy aioli." },
      { id: "bun_kab",   name: "Bun Kabab",           price: 10, emoji: "🥙", desc: "Spiced patty in a soft bun with green chutney and tamarind." },
      { id: "samosa",    name: "Samosa",              price:  8, emoji: "🔺", desc: "Crispy pastry triangles – vegetable, chicken, or beef. (3 pc)" },
      { id: "papri",     name: "Papri Chaat",         price: 10, emoji: "🍿", desc: "Crisp wafers layered with chickpeas, yogurt, mint, and tamarind chutneys." },
      { id: "pani",      name: "Pani Puri",           price: 12, emoji: "🫙", desc: "Hollow puris filled with spiced potato, chickpeas, and tangy mint water. (6 pc)" },
      { id: "spy_pot",   name: "Spicy Potato",        price:  8, emoji: "🥔", desc: "Cubed potatoes tossed in chili and Cavali spices." },
      { id: "tenders",   name: "Tenders with Fries",  price: 12, emoji: "🍗", desc: "Golden chicken tenders with seasoned fries and dipping sauce." },
      { id: "pizza_b",   name: "Pizza Bites",         price: 10, emoji: "🍕", desc: "Mini cheese-and-marinara pizza pockets baked golden." },
      { id: "fries",     name: "Fries",               price:  7, emoji: "🍟", desc: "Potato fries with house seasoning." },
      { id: "ld_fries",  name: "Loaded Fries",        price: 12, emoji: "🍟", desc: "Fries topped with cheese, jalapenos, green onion, and sour cream. Add chicken for $3." },
      { id: "ld_nachos", name: "Loaded Nachos",       price: 12, emoji: "🧀", desc: "Tortilla chips piled with cheese, jalapenos, salsa, and sour cream. Add chicken for $3." },
      { id: "chips_q",   name: "Chips and Queso",     price: 10, emoji: "🫕", desc: "Crisp tortilla chips with warm, melted cheese dip." },
      { id: "chips_g",   name: "Chips and Guacamole", price: 10, emoji: "🥑", desc: "Crisp tortilla chips with guacamole." },
    ],
  },
  {
    id: "mains", title: "From the Grill and the Pot", subtitle: "Mains", icon: "🍖", color: "#E5B13A",
    items: [
      { id: "shaw_pl",  name: "Shawarma Plate",      price: 19, emoji: "🥙", desc: "Marinated chicken or beef shawarma with garlic toum, pickles, and rice/fries." },
      { id: "koobideh", name: "Beef Koobideh",       price: 26, emoji: "🍢", desc: "Persian-style ground beef kabobs, served with salad." },
      { id: "chk_boti", name: "Chicken Boti",        price: 18, emoji: "🍗", desc: "Charcoal-grilled spiced chicken cubes served with mint chutney and naan." },
      { id: "chk_kab",  name: "Chicken Kabob",       price: 19, emoji: "🍢", desc: "Tender grilled chicken skewers marinated with spices. Served with rice and garlic sauce." },
      { id: "lamb_ch",  name: "Lamb Chops",          price: 32, emoji: "🥩", desc: "Herb-marinated lamb chops, charred over open flame, with mashed potatoes." },
      { id: "but_chk",  name: "Butter Chicken",      price: 20, emoji: "🍛", desc: "Tandoori chicken simmered in a rich tomato-cream gravy, served with rice." },
      { id: "biryani",  name: "Chicken Dum Biryani", price: 20, emoji: "🍚", desc: "Slow-cooked basmati and spiced chicken sealed in a dough pot, with raita." },
    ],
  },
  {
    id: "wings", title: "Tossed to Order", subtitle: "Wings", icon: "🍗", color: "#EF4444",
    items: [
      { id: "wings6",  name: "6 pc Wings",  price: 11, emoji: "🍗", desc: "Buffalo | BBQ | Garlic Parmesan | Lemon Pepper | Honey BBQ | Mango Habanero", requiresSauce: true },
      { id: "wings10", name: "10 pc Wings", price: 17, emoji: "🍗", desc: "Buffalo | BBQ | Garlic Parmesan | Lemon Pepper | Honey BBQ | Mango Habanero", requiresSauce: true },
    ],
  },
  {
    id: "vegetarian", title: "Meat-Free Favorites", subtitle: "Vegetarian", icon: "🥗", color: "#22C55E",
    items: [
      { id: "v_papri",  name: "Papri Chaat",         price: 10, emoji: "🍿", desc: "Crisp wafers layered with chickpeas, yogurt, mint, and tamarind chutneys." },
      { id: "v_pani",   name: "Pani Puri",           price: 12, emoji: "🫙", desc: "Hollow puris filled with spiced potato, chickpeas, and tangy mint water." },
      { id: "v_spypot", name: "Spicy Potato",        price:  8, emoji: "🥔", desc: "Fried potatoes with chili and Cavali spices." },
      { id: "v_fal",    name: "Falafel",             price: 10, emoji: "🧆", desc: "Crisp chickpea fritters served with tahini sauce and pickled vegetables." },
      { id: "v_hum",    name: "Hummus",              price: 10, emoji: "🫘", desc: "Creamy chickpea puree with tahini, olive oil, and warm pita." },
      { id: "paneer_m", name: "Paneer Momo",         price: 14, emoji: "🥟", desc: "Steamed dumplings filled with seasoned paneer." },
      { id: "veg_sam",  name: "Veg Samosa",          price:  8, emoji: "🔺", desc: "Crispy pastry triangles with spiced potato and pea filling. (3 pc)" },
      { id: "v_chipsq", name: "Chips and Queso",     price: 10, emoji: "🫕", desc: "Crisp tortilla chips with warm, melted cheese dip." },
      { id: "v_chipsg", name: "Chips and Guacamole", price: 10, emoji: "🥑", desc: "Crisp tortilla chips with guacamole dip." },
      { id: "daal_c",   name: "Daal Chawal",         price: 14, emoji: "🍲", desc: "Slow-cooked lentils served over basmati rice with cumin tadka." },
      { id: "v_fries",  name: "Fries",               price:  7, emoji: "🍟", desc: "Potato fries with house seasoning." },
      { id: "v_ldfr",   name: "Loaded Fries",        price: 12, emoji: "🍟", desc: "Fries topped with cheese, jalapenos, green onion, and sour cream." },
      { id: "v_ldna",   name: "Loaded Nachos",       price: 12, emoji: "🧀", desc: "Tortilla chips piled with cheese, jalapenos, salsa, and sour cream." },
    ],
  },
  {
    id: "burgers", title: "Served with Fries", subtitle: "Burgers", icon: "🍔", color: "#F59E0B",
    items: [
      { id: "smash",   name: "Beef Smash",     price: 18, emoji: "🍔", desc: "Double smashed beef patties with American cheese, pickles, and Cavali sauce." },
      { id: "zinger",  name: "Chicken Zinger", price: 18, emoji: "🍔", desc: "Crispy spiced chicken fillet with lettuce, mayo, and pickles." },
      { id: "club",    name: "Chicken Club",   price: 15, emoji: "🥪", desc: "Grilled chicken, lettuce, tomato, and aioli on toasted bread." },
      { id: "swiss_m", name: "Swiss Mushroom", price: 18, emoji: "🍄", desc: "Beef patty with sauteed mushrooms, Swiss cheese, and caramelized onions." },
    ],
  },
  {
    id: "wraps", title: "Served with Fries", subtitle: "Wraps", icon: "🌯", color: "#8B5CF6",
    items: [
      { id: "shaw_w",  name: "Shawarma Wrap",         price: 15, emoji: "🌯", desc: "Chicken or beef shawarma in pita with toum, pickles, and fries." },
      { id: "dyn_w",   name: "Dynamite Chicken Wrap", price: 15, emoji: "🌯", desc: "Crispy spiced chicken with lettuce and signature dynamite sauce." },
      { id: "zing_w",  name: "Zinger Wrap",           price: 15, emoji: "🌯", desc: "Crispy zinger fillet with lettuce, cheese, and mayo in a soft wrap." },
      { id: "mir_p",   name: "Mirchi Paratha Roll",   price: 15, emoji: "🌶", desc: "Spicy chili-seasoned chicken rolled in flaky paratha with chutneys." },
    ],
  },
  {
    id: "continental", title: "Globe-Trotting Bites", subtitle: "Continental Street Food", icon: "🌎", color: "#06B6D4",
    items: [
      { id: "tacos",    name: "Tacos",                       price: 14, emoji: "🌮", desc: "Soft tortillas (3 pc) - chicken or steak." },
      { id: "c_chipsq", name: "Chips and Queso",             price: 10, emoji: "🫕", desc: "Crisp tortilla chips with warm, melted cheese dip." },
      { id: "chili_c",  name: "Chili Chicken",               price: 22, emoji: "🌶", desc: "Indo-Chinese wok-tossed chicken with green chili, soy, and bell pepper. Served with fried rice." },
      { id: "mongo_c",  name: "Mongolian Chicken",           price: 22, emoji: "🥡", desc: "Crispy chicken tossed in sweet-savory Mongolian sauce with scallions. Served with fried rice." },
      { id: "momo",     name: "Momo",                        price: 14, emoji: "🥟", desc: "Street-style steamed dumplings - chicken, beef, or paneer. (6 pc)" },
      { id: "chow",     name: "Chow Mein",                   price: 15, emoji: "🍜", desc: "Stir-fried noodles with vegetables. Add your choice of protein for $3." },
      { id: "daal_s",   name: "Daal Chawal with Beef Shami", price: 15, emoji: "🍲", desc: "Lentils and rice served with grilled beef shami kabob and chutney." },
      { id: "cordon",   name: "Chicken Cordon Bleu",         price: 26, emoji: "🍽", desc: "Crispy breaded chicken stuffed with melted cheese, served with creamy mashed potatoes." },
    ],
  },
  {
    id: "desserts", title: "Sweet Finishes", subtitle: "Desserts", icon: "🎂", color: "#EC4899",
    items: [
      { id: "car_cr",  name: "Caramel Crunch",             price: 10, emoji: "🍮", desc: "House-made caramel and crunch toffee cake." },
      { id: "pis_ck",  name: "Pistachio Cake",             price: 10, emoji: "🎂", desc: "Fluffy pistachio sponge with whipped cream and nuts." },
      { id: "rasp_ck", name: "Raspberry White Chocolate",  price: 10, emoji: "🍰", desc: "White chocolate mousse with fresh raspberry coulis." },
      { id: "choc_ck", name: "Chocolate Cake",             price: 10, emoji: "🍫", desc: "Rich dark chocolate layer cake with ganache." },
      { id: "butt_b",  name: "Butterscotch Bliss",         price: 14, emoji: "🍯", desc: "Warm butterscotch pudding cake with vanilla ice cream." },
    ],
  },
];

export const DRINKS_MENU: MenuSection[] = [
  {
    id: "refreshers", title: "Refreshers", subtitle: "Refreshers", icon: "🍹", color: "#14B8A6",
    items: [
      { id: "cl_moj",  name: "Classic Mint Mojito", price: 10,  emoji: "🍹", desc: "" },
      { id: "mn_moj",  name: "Mango Mojito",        price: 10,  emoji: "🥭", desc: "" },
      { id: "ly_moj",  name: "Lychee Mojito",       price: 10,  emoji: "🍹", desc: "" },
      { id: "mt_marg", name: "Mint Margarita",      price: 10,  emoji: "🍹", desc: "" },
      { id: "rm_fire", name: "Rim Fire Melon",      price: 10,  emoji: "🍉", desc: "" },
      { id: "wm_jce",  name: "Watermelon Juice",    price: 10,  emoji: "🍉", desc: "" },
      { id: "or_jce",  name: "Orange Juice",        price: 10,  emoji: "🍊", desc: "" },
      { id: "mn_shk",  name: "Mango Shake",         price: 12,  emoji: "🥭", desc: "" },
      { id: "sw_las",  name: "Sweet Lassi",         price:  8,  emoji: "🥛", desc: "" },
    ],
  },
  {
    id: "tea_coffee", title: "Tea & Coffee", subtitle: "Tea & Coffee", icon: "☕", color: "#E5B13A",
    items: [
      { id: "karak",   name: "Karak Chai",    price: 4, emoji: "☕", desc: "" },
      { id: "kash_c",  name: "Kashmiri Chai", price: 4, emoji: "🌸", desc: "" },
      { id: "desi_c",  name: "Desi Coffee",   price: 6, emoji: "☕", desc: "" },
      { id: "cold_c",  name: "Cold Coffee",   price: 7, emoji: "🧋", desc: "" },
      { id: "mint_t",  name: "Mint Tea",      price: 4, emoji: "🌿", desc: "" },
      { id: "moroc_t", name: "Moroccan Tea",  price: 4, emoji: "🫖", desc: "" },
    ],
  },
  {
    id: "soft_drinks", title: "Soft Drinks & Water", subtitle: "Soft Drinks & Water", icon: "🥤", color: "#6366F1",
    items: [
      { id: "coca",    name: "Coca-Cola",        price: 4,   emoji: "🥤", desc: "" },
      { id: "coke_z",  name: "Coke Zero / Diet", price: 4,   emoji: "🥤", desc: "" },
      { id: "fanta",   name: "Fanta",            price: 4,   emoji: "🥤", desc: "" },
      { id: "ging_a",  name: "Ginger Ale",       price: 4,   emoji: "🥤", desc: "" },
      { id: "sprite",  name: "Sprite",           price: 4,   emoji: "🥤", desc: "" },
      { id: "drpep",   name: "Dr Pepper",        price: 4,   emoji: "🥤", desc: "" },
      { id: "redbull", name: "Red Bull",         price: 6,   emoji: "⚡",  desc: "" },
      { id: "spark_w", name: "Sparkling Water",  price: 6,   emoji: "💧", desc: "" },
      { id: "sara_w",  name: "Saratoga Water",   price: 4.5, emoji: "💧", desc: "" },
    ],
  },
];
