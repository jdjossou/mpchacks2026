import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  dark?: boolean;
  reflection?: boolean;
  children: React.ReactNode;
}

export default function GlassPanel({
  dark = false,
  reflection = true,
  children,
  className = '',
  ...props
}: GlassPanelProps) {
  const baseClass = dark ? 'glass-panel-dark' : 'glass-panel';
  const reflectionClass = reflection ? 'glass-reflection-container' : '';

  return (
    <div className={`${baseClass} ${reflectionClass} ${className}`} {...props}>
      {reflection && <div className="glass-reflection-shine" />}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
