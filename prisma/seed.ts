/**
 * Seed script — creates one sample Wedding event with budget, timeline, vendors, and ideas.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or via package.json prisma.seed (after adding the seed config).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding Momentra database...");

  // Clean up existing seed data
  await prisma.idea.deleteMany({ where: { event: { name: "Priya & Rahul Wedding" } } });
  await prisma.vendorItem.deleteMany({ where: { event: { name: "Priya & Rahul Wedding" } } });
  await prisma.timelineTask.deleteMany({ where: { event: { name: "Priya & Rahul Wedding" } } });
  await prisma.budgetItem.deleteMany({ where: { event: { name: "Priya & Rahul Wedding" } } });
  await prisma.event.deleteMany({ where: { name: "Priya & Rahul Wedding" } });

  const eventDate = new Date("2025-02-14T00:00:00Z"); // Valentine's Day wedding

  const event = await prisma.event.create({
    data: {
      name: "Priya & Rahul Wedding",
      type: "wedding",
      date: eventDate,
      location: "Mumbai, Maharashtra",
      guestCount: 300,
      budget: 2500000, // ₹25 lakhs
      currency: "INR",
      notes: "South Indian ceremony with North Indian reception. Prefer outdoor mandap. Vegetarian menu preferred.",
    },
  });

  console.log(`✅  Created event: ${event.name} (${event.id})`);

  // ── Budget Items ──────────────────────────────────────────────────────────
  await prisma.budgetItem.createMany({
    data: [
      { eventId: event.id, category: "venue",         label: "Venue & Banquet Hall",    percentage: 30, estimated: 750000,  actual: 720000, paid: true,  aiGenerated: true },
      { eventId: event.id, category: "catering",      label: "Catering & Food",         percentage: 25, estimated: 625000,  actual: 0,      paid: false, aiGenerated: true },
      { eventId: event.id, category: "decor",         label: "Floral & Décor",          percentage: 15, estimated: 375000,  actual: 0,      paid: false, aiGenerated: true },
      { eventId: event.id, category: "photography",   label: "Photography & Videography",percentage: 12, estimated: 300000,  actual: 280000, paid: true,  aiGenerated: true },
      { eventId: event.id, category: "attire",        label: "Bridal & Groom Attire",   percentage: 8,  estimated: 200000,  actual: 0,      paid: false, aiGenerated: true },
      { eventId: event.id, category: "entertainment", label: "Music & Entertainment",   percentage: 5,  estimated: 125000,  actual: 0,      paid: false, aiGenerated: true },
      { eventId: event.id, category: "misc",          label: "Miscellaneous & Contingency", percentage: 5, estimated: 125000, actual: 0,  paid: false, aiGenerated: true },
    ],
  });
  console.log("✅  Seeded budget items");

  // ── Timeline Tasks ────────────────────────────────────────────────────────
  const now = eventDate;
  const w = (weeks: number) => new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  await prisma.timelineTask.createMany({
    data: [
      { eventId: event.id, phase: "12 Weeks Before", title: "Finalise guest list",            description: "Confirm 300 guests and collect contact details.", dueDate: w(12), status: "DONE", aiGenerated: true },
      { eventId: event.id, phase: "12 Weeks Before", title: "Book venue",                     description: "Sign contract and pay advance for banquet hall.",    dueDate: w(12), status: "DONE", aiGenerated: true },
      { eventId: event.id, phase: "10 Weeks Before", title: "Book caterer",                   description: "Shortlist 3 vegetarian caterers, taste test menus.",  dueDate: w(10), status: "DONE", aiGenerated: true },
      { eventId: event.id, phase: "10 Weeks Before", title: "Book photographer",              description: "Confirm pre-wedding and wedding day photographers.",   dueDate: w(10), status: "DONE", aiGenerated: true },
      { eventId: event.id, phase: "8 Weeks Before",  title: "Send invitations",               description: "Print and courier/digitally send invites to all guests.", dueDate: w(8), status: "DOING", aiGenerated: true },
      { eventId: event.id, phase: "8 Weeks Before",  title: "Finalise décor theme",           description: "Choose floral colour palette and discuss mandap design.", dueDate: w(8), status: "DOING", aiGenerated: true },
      { eventId: event.id, phase: "6 Weeks Before",  title: "Bridal shopping",                description: "Purchase bridal lehenga and groom's sherwani.",         dueDate: w(6), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "6 Weeks Before",  title: "Book musicians / DJ",            description: "Finalise music for reception dance floor.",              dueDate: w(6), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "4 Weeks Before",  title: "Confirm menu with caterer",      description: "Finalise all dishes and dietary requirements.",          dueDate: w(4), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "4 Weeks Before",  title: "Collect RSVP confirmations",     description: "Call all pending guests to confirm attendance.",         dueDate: w(4), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "2 Weeks Before",  title: "Décor installation walkthrough", description: "Visit venue with decorator to review setup plan.",       dueDate: w(2), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "2 Weeks Before",  title: "Final dress fitting",            description: "Ensure lehenga and sherwani fit perfectly.",            dueDate: w(2), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "1 Week Before",   title: "Arrange wedding favors",         description: "Pack return gifts for 300 guests.",                     dueDate: w(1), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "1 Week Before",   title: "Confirm vendor arrival times",   description: "Call all vendors to reconfirm day-of schedule.",        dueDate: w(1), status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "Day Of",          title: "Oversee décor setup",            description: "Be present at venue at 6 AM for decorator setup.",      dueDate: eventDate, status: "TODO", aiGenerated: true },
      { eventId: event.id, phase: "Day Of",          title: "Coordinate with caterer",        description: "Confirm meal timings and guest seating arrangements.",  dueDate: eventDate, status: "TODO", aiGenerated: true },
    ],
  });
  console.log("✅  Seeded timeline tasks");

  // ── Vendor Items ──────────────────────────────────────────────────────────
  await prisma.vendorItem.createMany({
    data: [
      {
        eventId: event.id,
        category: "venue",
        name: "The Grand Ballroom, Bandra",
        contact: "+91 98765 43210",
        quote: 750000,
        status: "PAID",
        questionsToAsk: JSON.stringify(["What is included in the base price?", "Is backup power available?", "What is the parking capacity?"]),
        documentsNeeded: JSON.stringify(["Signed venue contract", "Payment receipt", "Cancellation policy"]),
        paymentTips: "Always pay the token amount via cheque or bank transfer. Avoid cash for large payments. Keep GST invoice.",
        aiGenerated: true,
      },
      {
        eventId: event.id,
        category: "catering",
        name: null,
        contact: null,
        quote: null,
        status: "SHORTLIST",
        questionsToAsk: JSON.stringify(["Do you provide vegetarian-only menus?", "Can you handle 300+ guests?", "Do you arrange for live counters?"]),
        documentsNeeded: JSON.stringify(["Catering agreement", "Menu confirmation letter", "FSSAI license copy"]),
        paymentTips: "Pay 30% advance on booking confirmation. Remaining 70% ideally 7 days before the event. Verify GST rate on food services.",
        aiGenerated: true,
      },
      {
        eventId: event.id,
        category: "photography",
        name: "Moments by Arjun",
        contact: "+91 99887 76655",
        quote: 280000,
        status: "BOOKED",
        questionsToAsk: ["How many photographers will be present?", "Do you offer drone coverage?", "What is the photo delivery timeline?"].join("||"),
        documentsNeeded: JSON.stringify(["Photography contract", "Package details in writing", "Sample album"]),
        paymentTips: "Standard is 50% advance, 50% post-event. Always check the contract for raw footage ownership rights.",
        aiGenerated: true,
      },
      {
        eventId: event.id,
        category: "decor",
        name: null,
        contact: null,
        quote: null,
        status: "SHORTLIST",
        questionsToAsk: JSON.stringify(["Do you provide mandap setup?", "What flowers are included?", "Do you dismantle after the event?"]),
        documentsNeeded: JSON.stringify(["Décor agreement", "Mood board / reference photos", "Itemised quote"]),
        paymentTips: "Decorator typically charges 40% advance. Ensure the quote includes fresh flowers vs. artificial distinction clearly.",
        aiGenerated: true,
      },
      {
        eventId: event.id,
        category: "music",
        name: null,
        contact: null,
        quote: null,
        status: "SHORTLIST",
        questionsToAsk: JSON.stringify(["What equipment do you bring?", "Do you take music requests?", "Is there an overtime charge?"]),
        documentsNeeded: JSON.stringify(["Performance contract", "Setlist agreement", "Equipment list"]),
        paymentTips: "Most DJs/musicians require 25-50% advance. Clarify whether sound system rental is included in the quote.",
        aiGenerated: true,
      },
    ],
  });
  console.log("✅  Seeded vendor items");

  // ── Ideas ─────────────────────────────────────────────────────────────────
  await prisma.idea.createMany({
    data: [
      { eventId: event.id, category: "theme",    title: "Royal Mughal Grandeur",        description: "A regal combination of gold and ivory with arched floral backdrops, peacock motifs, and chandeliers reminiscent of Mughal palaces. Perfect for a grand Mumbai wedding.", saved: true,  aiGenerated: true },
      { eventId: event.id, category: "theme",    title: "Pastel Garden Romance",        description: "Soft pinks, lilacs, and greens with floral ceiling installations and string lights for an ethereal outdoor mandap feel.", saved: false, aiGenerated: true },
      { eventId: event.id, category: "menu",     title: "South-North Fusion Feast",     description: "Start with South Indian starters (medu vada, idli chaat), move to a North Indian buffet main course, and finish with both regional desserts — payasam and gulab jamun.", saved: true,  aiGenerated: true },
      { eventId: event.id, category: "menu",     title: "Interactive Live Stations",    description: "Set up live dosa, pani puri, and chaat counters alongside a dessert station with kulfi and rabri. Guests love the engagement.", saved: false, aiGenerated: true },
      { eventId: event.id, category: "decor",    title: "Marigold & Rose Mandap",       description: "Traditional yet stunning mandap dripping in saffron marigolds and red roses — iconic for South Indian ceremonies and Instagram-worthy for receptions.", saved: true,  aiGenerated: true },
      { eventId: event.id, category: "activity", title: "Mehendi Lounge with DJ",       description: "Set up a curated mehendi corner with a chill playlist, ring-light selfie station, and mehndi artists for guests. A pre-wedding favourite.", saved: false, aiGenerated: true },
      { eventId: event.id, category: "activity", title: "Couple's Dance Surprise",      description: "Choreograph a 3-minute first dance medley with a mashup of the couple's favourite songs. Guests will love the personal touch.", saved: true,  aiGenerated: true },
      { eventId: event.id, category: "gift",     title: "Brass Pooja Thali Set",        description: "Traditional return gifts of mini brass pooja thalis with kumkum and dry fruits — culturally resonant and useful for guests of all ages.", saved: false, aiGenerated: true },
      { eventId: event.id, category: "gift",     title: "Personalised Clay Diyas",      description: "Hand-painted terracotta diyas with the couple's name and wedding date, packaged in a jute bag with a sweet note. Budget-friendly and meaningful.", saved: true,  aiGenerated: true },
    ],
  });
  console.log("✅  Seeded ideas");

  console.log(`\n🎉  Done! Event ID: ${event.id}`);
  console.log(`   Visit: http://localhost:3000/events/${event.id}`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
