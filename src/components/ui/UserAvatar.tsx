'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  border?: string;
}

/**
 * Normalizes avatar URLs:
 * Strips localhost origins if present so the relative path (/api/upload/r2) works on Vercel production.
 */
function normalizeAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // If URL has localhost prefix, strip it so it routes to the current host
  if (trimmed.startsWith('http://localhost:') || trimmed.startsWith('https://localhost:')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname + parsed.search;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function UserAvatar({
  photoURL,
  displayName,
  email,
  size = 34,
  className,
  style,
  border = '1.5px solid rgba(0, 122, 255, 0.4)',
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedUrl = normalizeAvatarUrl(photoURL);

  // Reset error state if the URL changes
  useEffect(() => {
    setHasError(false);
  }, [photoURL]);

  const initial = (displayName?.trim()?.charAt(0) || email?.trim()?.charAt(0) || '').toUpperCase();

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #007AFF 0%, #0051a8 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${Math.max(11, Math.round(size * 0.42))}px`,
    fontWeight: 800,
    overflow: 'hidden',
    flexShrink: 0,
    border,
    position: 'relative',
    userSelect: 'none',
    ...style,
  };

  if (normalizedUrl && !hasError) {
    return (
      <div className={className} style={containerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizedUrl}
          alt={displayName || 'User Avatar'}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Fallback: User initial or sleek SVG User icon
  return (
    <div className={className} style={containerStyle}>
      {initial ? (
        <span style={{ lineHeight: 1 }}>{initial}</span>
      ) : (
        <UserIcon size={Math.round(size * 0.55)} color="#ffffff" />
      )}
    </div>
  );
}
