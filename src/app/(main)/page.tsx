import {
  HeroSection,
  GamesSection,
  FAQSection,
} from "@/components/sections";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <HeroSection />
      <GamesSection />
      <FAQSection />
    </main>
  );
}
