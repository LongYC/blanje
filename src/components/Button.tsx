import type { ComponentPropsWithRef } from 'react';
import styles from "./Button.module.css";

type ButtonVariant = 'muted' | 'main' | 'danger';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

export function Button({
  label,
  onClick,
  variant,
  ...props 
}: ButtonProps) {
  const variantClass: string = variant ? `${styles.button} ${styles[variant]}` : styles.button;

  return <button {...props} type="button" className={variantClass} onClick={onClick}>
    {label}
  </button>;
}
