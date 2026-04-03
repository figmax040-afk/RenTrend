export const IMAGES = {
  kettle: "https://images.unsplash.com/photo-1763616828279-03571d453e63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMGtldHRsZSUyMGtpdGNoZW4lMjBhcHBsaWFuY2V8ZW58MXx8fHwxNzc0OTczNzE1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  fan: "https://images.unsplash.com/photo-1714165168854-905575566f74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0YWJsZSUyMGZhbiUyMGNvb2xpbmclMjBhcHBsaWFuY2V8ZW58MXx8fHwxNzc0OTczNzE2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  riceCooker: "https://images.unsplash.com/photo-1761766917170-42c4cecfee0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaWNlJTIwY29va2VyJTIwa2l0Y2hlbnxlbnwxfHx8fDE3NzQ5NzM3MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  lamp: "https://images.unsplash.com/photo-1774647001992-b711ae72f83d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwbGFtcCUyMHN0dWR5JTIwbGlnaHR8ZW58MXx8fHwxNzc0OTczNzE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  fridge: "https://images.unsplash.com/photo-1759772238095-d1ed3f036ad5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pJTIwZnJpZGdlJTIwY29tcGFjdCUyMHJlZnJpZ2VyYXRvcnxlbnwxfHx8fDE3NzQ5NzM3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  microwave: "https://images.unsplash.com/photo-1608384156808-418b5c079968?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3dhdmUlMjBvdmVuJTIwa2l0Y2hlbnxlbnwxfHx8fDE3NzQ5NDIwOTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  vacuum: "https://images.unsplash.com/photo-1765970101654-337b573142fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YWN1dW0lMjBjbGVhbmVyJTIwaG9tZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NzQ5MDAzMjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  // Home electronics hero — replaces old campus/graduation photo
  campus: "https://images.unsplash.com/photo-1740803292814-13d2e35924c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwYXBwbGlhbmNlcyUyMGVsZWN0cm9uaWNzJTIwa2l0Y2hlbiUyMG1vZGVybnxlbnwxfHx8fDE3NzUxMTgwMzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  // Auth / sign-in hero — home appliances lifestyle
  authHero: "https://images.unsplash.com/photo-1768051579338-3dc694863efc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMHJlZnJpZ2VyYXRvciUyMGhvbWUlMjBhcHBsaWFuY2VzfGVufDF8fHx8MTc3NTExODAzMXww&ixlib=rb-4.1.0&q=80&w=1080",
};

export interface Listing {
  id: number;
  title: string;
  titleZh: string;
  image: string;
  images: string[];
  price: number;
  weeklyPrice: number;
  monthlyPrice: number;
  deposit: number;
  distance: string;
  distanceZh: string;
  category: string;
  categoryZh: string;
  condition: string;
  conditionZh: string;
  description: string;
  descriptionZh: string;
  owner: string;
  university: string;
  universityZh: string;
  memberSince: string;
  available: boolean;
}

export const listings: Listing[] = [
  {
    id: 1, title: "Electric Kettle 1.7L", titleZh: "電熱水壺 1.7L",
    image: IMAGES.kettle, images: [IMAGES.kettle, IMAGES.kettle],
    price: 15, weeklyPrice: 80, monthlyPrice: 280, deposit: 100,
    distance: "5 min walk", distanceZh: "步行5分鐘",
    category: "Kitchen", categoryZh: "廚房",
    condition: "Works perfectly", conditionZh: "運作完好",
    description: "Great kettle, barely used. Perfect for making tea or instant noodles. Auto shut-off feature.",
    descriptionZh: "幾乎全新的電水壺，適合泡茶或即食麵。自動斷電功能。",
    owner: "Alex C.", university: "HKU", universityZh: "香港大學",
    memberSince: "Sep 2025", available: true,
  },
  {
    id: 2, title: "Portable Desk Fan", titleZh: "便攜式桌面風扇",
    image: IMAGES.fan, images: [IMAGES.fan],
    price: 10, weeklyPrice: 55, monthlyPrice: 180, deposit: 80,
    distance: "8 min walk", distanceZh: "步行8分鐘",
    category: "Cooling", categoryZh: "冷氣",
    condition: "Minor wear", conditionZh: "輕微磨損",
    description: "USB powered desk fan, 3 speed settings. Great for summer.",
    descriptionZh: "USB供電桌面風扇，3段風速。夏天必備。",
    owner: "Mei L.", university: "CUHK", universityZh: "中文大學",
    memberSince: "Jan 2025", available: true,
  },
  {
    id: 3, title: "Rice Cooker 3-Cup", titleZh: "3杯量電飯煲",
    image: IMAGES.riceCooker, images: [IMAGES.riceCooker],
    price: 20, weeklyPrice: 100, monthlyPrice: 350, deposit: 150,
    distance: "3 min walk", distanceZh: "步行3分鐘",
    category: "Kitchen", categoryZh: "廚房",
    condition: "Works perfectly", conditionZh: "運作完好",
    description: "Compact rice cooker perfect for 1-2 people. Non-stick inner pot.",
    descriptionZh: "適合1-2人的小型電飯煲。不粘內鍋。",
    owner: "Tom W.", university: "HKUST", universityZh: "科技大學",
    memberSince: "Mar 2025", available: true,
  },
  {
    id: 4, title: "LED Desk Lamp", titleZh: "LED檯燈",
    image: IMAGES.lamp, images: [IMAGES.lamp],
    price: 8, weeklyPrice: 45, monthlyPrice: 150, deposit: 60,
    distance: "12 min walk", distanceZh: "步行12分鐘",
    category: "Electronics", categoryZh: "電子",
    condition: "Works perfectly", conditionZh: "運作完好",
    description: "Adjustable LED desk lamp with 3 brightness levels. USB charging port.",
    descriptionZh: "可調節LED檯燈，3段亮度。帶USB充電口。",
    owner: "Sarah K.", university: "HKU", universityZh: "香港大學",
    memberSince: "Aug 2025", available: true,
  },
  {
    id: 5, title: "Mini Fridge", titleZh: "迷你冰箱",
    image: IMAGES.fridge, images: [IMAGES.fridge],
    price: 35, weeklyPrice: 200, monthlyPrice: 650, deposit: 300,
    distance: "6 min walk", distanceZh: "步行6分鐘",
    category: "Kitchen", categoryZh: "廚房",
    condition: "Minor wear", conditionZh: "輕微磨損",
    description: "46L mini fridge, perfect for a dorm room. Quiet operation.",
    descriptionZh: "46升迷你冰箱，適合宿舍。安靜運作。",
    owner: "Jason L.", university: "PolyU", universityZh: "理工大學",
    memberSince: "Nov 2025", available: true,
  },
  {
    id: 6, title: "Microwave Oven", titleZh: "微波爐",
    image: IMAGES.microwave, images: [IMAGES.microwave],
    price: 25, weeklyPrice: 140, monthlyPrice: 450, deposit: 200,
    distance: "10 min walk", distanceZh: "步行10分鐘",
    category: "Kitchen", categoryZh: "廚房",
    condition: "Works perfectly", conditionZh: "運作完好",
    description: "700W microwave with defrost function. Clean and ready to use.",
    descriptionZh: "700W微波爐，帶解凍功能。乾淨可用。",
    owner: "Emily Z.", university: "CityU", universityZh: "城市大學",
    memberSince: "Feb 2026", available: false,
  },
  {
    id: 7, title: "Vacuum Cleaner", titleZh: "吸塵機",
    image: IMAGES.vacuum, images: [IMAGES.vacuum],
    price: 18, weeklyPrice: 95, monthlyPrice: 320, deposit: 120,
    distance: "7 min walk", distanceZh: "步行7分鐘",
    category: "Other", categoryZh: "其他",
    condition: "Minor wear", conditionZh: "輕微磨損",
    description: "Lightweight stick vacuum. Great for small apartments.",
    descriptionZh: "輕便手持吸塵機。適合小型單位。",
    owner: "David H.", university: "HKBU", universityZh: "浸會大學",
    memberSince: "Oct 2025", available: true,
  },
];