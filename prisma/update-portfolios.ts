import { prisma } from "../src/lib/prisma";

async function updatePortfolios() {
  // Portfolio data for each committee slug
  const portfolioData: Record<string, string[]> = {
    unsc: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    unga: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    unhrc: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    csw: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    unicef: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    unep: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    wto: [
      "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
      "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
      "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
      "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
    ],
    aippm: [
      "Bharatiya Janata Party", "Indian National Congress", "All India Majlis-e-Ittehaad-ul-Muslimeen",
      "Biju Janata Dal", "Trinamool Congress", "Dravida Munnetra Kazhagam", "Samajwadi Party",
      "Shivsena", "Telugu Desam Party", "Jharkhand Mukti Morcha", "Nationalist Congress Party",
      "Communist Party of India", "Aam Aadmi Party", "Yadav Samaj", "Regional Alliance"
    ],
    "lok-sabha": [
      "Bharatiya Janata Party", "Indian National Congress", "All India Majlis-e-Ittehaad-ul-Muslimeen",
      "Biju Janata Dal", "Trinamool Congress", "Dravida Munnetra Kazhagam", "Samajwadi Party",
      "Shivsena", "Telugu Desam Party", "Jharkhand Mukti Morcha", "Nationalist Congress Party",
      "Communist Party of India", "Aam Aadmi Party", "Yadav Samaj", "Regional Alliance"
    ],
    "war-cabinet": [
      "Prime Minister", "Defence Minister", "Foreign Minister", "Finance Minister", "Home Minister",
      "Chief of Defence Staff", "Army Chief", "Navy Chief", "Air Chief", "National Security Advisor"
    ],
    
  };

  for (const [slug, portfolios] of Object.entries(portfolioData)) {
    // Delete old portfolios for this track
    await prisma.portfolio.deleteMany({ where: { trackSlug: slug } });
    
    // Create new portfolios
    for (let i = 0; i < portfolios.length; i++) {
      await prisma.portfolio.create({
        data: {
          trackSlug: slug,
          name: portfolios[i],
          order: i,
          status: "AVAILABLE"
        }
      });
    }
    
    console.log(`✓ Updated ${portfolios.length} portfolios for ${slug}`);
  }

  console.log("✓ All portfolios updated successfully");
}

updatePortfolios()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
