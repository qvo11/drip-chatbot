"use client";

import { useState } from 'react';
import DripIntro from '@/components/drip/DripIntro';

export default function Page() {
  const [showIntro, setShowIntro] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const handleGetQuote = () => {
    setShowIntro(false);
    setShowChat(true);
  }

  const handleLearnMore = () => {
    console.log("Learn more clicked");
  }

  return (
    <main className="relative min-h-screen">
      {showIntro && (
        <DripIntro
          onGetQuote={handleGetQuote}
          onLearnMore={handleLearnMore}
        />
      )}
      {showChat && (
        <div className="flex items-center justify-center h-screen">
          Chat panel...
        </div>
      )}
    </main>
  )

}