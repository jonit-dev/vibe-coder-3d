import React from 'react';

interface ICardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<ICardProps> = ({ title, children, className }) => (
  <div className={`card bg-base-100 w-full shadow-sm ${className ?? ''}`}>
    <div className="card-body">
      <h2 className="card-title mb-2">{title}</h2>
      {children}
    </div>
  </div>
); 
