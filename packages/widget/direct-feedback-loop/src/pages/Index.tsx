import HeroSection from "@/components/hero-section";
import FeaturesSection from "@/components/features-section"; 
import IntegrationSection from "@/components/integration-section";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <IntegrationSection />
    </div>
  );
};

export default Index;
