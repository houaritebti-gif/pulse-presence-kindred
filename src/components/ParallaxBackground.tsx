import { useParallax } from '@/hooks/useParallax';

interface ParallaxBackgroundProps {
  variant?: 'profile' | 'landing' | 'list' | 'default';
}

const ParallaxBackground = ({ variant = 'default' }: ParallaxBackgroundProps) => {
  const { y: y1, opacity: opacity1 } = useParallax({ speed: 0.15, fadeOut: true });
  const { y: y2, opacity: opacity2 } = useParallax({ speed: 0.25, fadeOut: true });
  const { y: y3 } = useParallax({ speed: 0.08, fadeOut: false });

  if (variant === 'profile') {
    return (
      <>
        {/* Primary glow - moves faster */}
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translate(-50%, ${y1}px)`,
            opacity: opacity1 
          }}
        />
        {/* Secondary glow - moves slower */}
        <div 
          className="absolute bottom-40 right-0 w-[300px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translateY(${-y2}px)`,
            opacity: opacity2 
          }}
        />
        {/* Subtle ambient layer - barely moves */}
        <div 
          className="absolute top-1/2 left-0 w-[200px] h-[400px] bg-secondary/3 blur-[150px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translateY(${y3}px)` 
          }}
        />
      </>
    );
  }

  if (variant === 'landing') {
    return (
      <>
        {/* Large hero glow */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 blur-[150px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translate(-50%, ${y1 * 0.8}px)`,
            opacity: opacity1 
          }}
        />
        {/* Accent side glow */}
        <div 
          className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translateY(${-y2}px)`,
            opacity: opacity2 
          }}
        />
        {/* Bottom ambient */}
        <div 
          className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translateY(${y3 * 0.5}px)` 
          }}
        />
      </>
    );
  }

  if (variant === 'list') {
    return (
      <>
        {/* Top center glow */}
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translate(-50%, ${y1}px)`,
            opacity: opacity1 
          }}
        />
        {/* Bottom right accent */}
        <div 
          className="absolute bottom-20 right-0 w-[300px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none transition-transform duration-100"
          style={{ 
            transform: `translateY(${-y2 * 0.7}px)`,
            opacity: opacity2 
          }}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <div 
        className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none transition-transform duration-100"
        style={{ 
          transform: `translateY(${y1}px)`,
          opacity: opacity1 
        }}
      />
      <div 
        className="absolute bottom-1/4 right-0 w-[350px] h-[350px] bg-accent/5 blur-[120px] rounded-full pointer-events-none transition-transform duration-100"
        style={{ 
          transform: `translateY(${-y2}px)`,
          opacity: opacity2 
        }}
      />
    </>
  );
};

export default ParallaxBackground;
