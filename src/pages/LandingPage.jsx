import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import PlatformOverview from '../components/PlatformOverview';
import ModuleGrid from '../components/ModuleGrid';
import DataSources from '../components/DataSources';
import Workflow from '../components/Workflow';
import UserTypes from '../components/UserTypes';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PlatformOverview />
        <ModuleGrid />
        <DataSources />
        <Workflow />
        <UserTypes />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
