import React from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';

interface LandingPageProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigateToAuth={onNavigateToAuth} />
      <main>
        <HeroSection onNavigateToAuth={onNavigateToAuth} />
        <FeaturesSection onNavigateToAuth={onNavigateToAuth} />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection onNavigateToAuth={onNavigateToAuth} />
      </main>
      <Footer onNavigateToAuth={onNavigateToAuth} />
    </div>
  );
}