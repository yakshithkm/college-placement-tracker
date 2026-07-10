import React from 'react';

/**
 * Reusable animated hamburger / close button.
 * Three bars morph into an X when `open` is true.
 *
 * Usage:
 *   <HamburgerIcon open={sidebarOpen} onClick={() => setSidebarOpen(o => !o)} />
 */
export default function HamburgerIcon({ open, onClick, label = 'Toggle menu', className = '', size = 40 }) {
  return (
    <button
      type="button"
      className={`hamburger-btn ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
    >
      <span className={`hamburger-bars ${open ? 'is-open' : ''}`}>
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
      </span>
    </button>
  );
}