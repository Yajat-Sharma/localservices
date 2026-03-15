import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const categories = [
    { name: "Plumber", nameHi: "प्लम्बर", icon: "🔧", slug: "plumber", sortOrder: 1 },
    { name: "Electrician", nameHi: "इलेक्ट्रीशियन", icon: "⚡", slug: "electrician", sortOrder: 2 },
    { name: "Tailor", nameHi: "दर्जी", icon: "🧵", slug: "tailor", sortOrder: 3 },
    { name: "Tutor", nameHi: "ट्यूटर", icon: "📚", slug: "tutor", sortOrder: 4 },
    { name: "Tiffin Service", nameHi: "टिफिन सर्विस", icon: "🍱", slug: "tiffin-service", sortOrder: 5 },
    { name: "Project Maker", nameHi: "प्रोजेक्ट मेकर", icon: "🎨", slug: "project-maker", sortOrder: 6 },
    { name: "Handyman", nameHi: "हैंडीमैन", icon: "🔨", slug: "handyman", sortOrder: 7 },
    { name: "Carpenter", nameHi: "बढ़ई", icon: "🪚", slug: "carpenter", sortOrder: 8 },
    { name: "Painter", nameHi: "पेंटर", icon: "🖌️", slug: "painter", sortOrder: 9 },
    { name: "Cleaner", nameHi: "सफाईकर्मी", icon: "🧹", slug: "cleaner", sortOrder: 10 },
    { name: "Driver", nameHi: "ड्राइवर", icon: "🚗", slug: "driver", sortOrder: 11 },
    { name: "Cook", nameHi: "रसोइया", icon: "👨‍🍳", slug: "cook", sortOrder: 12 },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  await prisma.adminSetting.upsert({ where: { key: "free_registration_limit" }, update: {}, create: { key: "free_registration_limit", value: "50" } });
  console.log("Seed complete");
}
main().catch(console.error).finally(() => prisma.$disconnect());
