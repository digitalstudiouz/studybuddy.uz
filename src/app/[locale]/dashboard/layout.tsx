'use client';

import { useState, useEffect } from 'react';
import { BackgroundModal } from '@/components/BackgroundModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showBgModal, setShowBgModal] = useState(false);
  const [background, setBackground] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-bg');
    if (saved) setBackground(saved);
  }, []);

  const handleSelect = (bg: { src: string }) => {
    setBackground(bg.src);
    localStorage.setItem('dashboard-bg', bg.src);
    setShowBgModal(false);
  };
 
  return (
    <div
      className="min-h-screen bg-background relative"
      style={background ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 0.5s' } : {}}
    >
      {/* Background Button */}
      

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Background Modal */}
      <BackgroundModal
        isOpen={showBgModal}
        onClose={() => setShowBgModal(false)}
        onSelect={handleSelect}
        selected={background || ''}
      />
    </div>
  );
} 