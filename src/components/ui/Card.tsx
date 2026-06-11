import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "glowing";
  hoverable?: boolean;
}

/**
 * Premium glassmorphic reusable Card component.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "glass",
  hoverable = true,
  ...props
}) => {
  const baseClass = variant === "glass" ? "glass-card" : variant === "glowing" ? "glass-card hover-glow" : "glass-panel";
  const hoverClass = hoverable ? "hover-scale" : "";
  
  return (
    <div 
      className={`${baseClass} ${hoverClass} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};
