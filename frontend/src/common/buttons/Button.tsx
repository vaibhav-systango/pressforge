import React from 'react';
import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';

export type ButtonProps = MantineButtonProps & {
  /**
   * If true, applies the gradient brand styling used across the app.
   * Defaults to true for primary actions.
   */
  gradientBrand?: boolean;
  component?: React.ElementType;
  href?: string;
};

export const Button: React.FC<ButtonProps> = ({ gradientBrand = true, children, style, className, ...props }) => {
  const gradientStyle = gradientBrand
    ? {
        background: 'var(--gradient-brand)',
        color: 'white',
        border: '0',
        ...style,
      }
    : style;

  const gradientClass = gradientBrand
    ? `${className || ''} glow hover:opacity-90 transition-opacity`.trim()
    : className;

  return (
    <MantineButton style={gradientStyle} className={gradientClass} {...(props as Record<string, unknown>)}>
      {children}
    </MantineButton>
  );
};

export default Button;
