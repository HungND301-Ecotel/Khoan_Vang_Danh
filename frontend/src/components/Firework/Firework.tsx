import React, { useEffect, useState } from 'react';

interface FireworkProps {
  show: boolean;
  onComplete?: () => void;
}

const Firework = ({ show, onComplete }: FireworkProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
  }>>([]);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      return;
    }

    // Create firework particles
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#fd79a8'];
    const newParticles = [];
    
    // Create multiple firework bursts
    for (let burst = 0; burst < 3; burst++) {
      const centerX = Math.random() * 400 + 200;
      const centerY = Math.random() * 200 + 150;
      
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = Math.random() * 5 + 3;
        newParticles.push({
          id: burst * 30 + i,
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          life: 100,
          maxLife: 100,
        });
      }
    }
    
    setParticles(newParticles);

    // Animation loop
    const animate = () => {
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          vx: particle.vx * 0.99, // air resistance
          life: particle.life - 1,
        })).filter(particle => particle.life > 0);
        
        return updatedParticles;
      });
    };

    const animationId = setInterval(animate, 16); // ~60fps

    // Clean up after animation
    const timeout = setTimeout(() => {
      clearInterval(animationId);
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => {
      clearInterval(animationId);
      clearTimeout(timeout);
    };
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: '50%',
            opacity: particle.life / particle.maxLife,
            transform: `scale(${particle.life / particle.maxLife})`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transition: 'none',
          }}
        />
      ))}
      
      {/* Success message overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '12px',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          animation: 'bounce 1s ease-out',
        }}
      >
        🎉 Tạo thành công! 🎉
      </div>
      
      <style>{`
        @keyframes bounce {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Firework;