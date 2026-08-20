// src/components/common/LangFlag.tsx
import React from 'react';

interface Props {
  lang: string;
}

export const LangFlag: React.FC<Props> = ({ lang }) => {
  if (lang === 'ru') {
    return (
      <svg width="18" height="12" viewBox="0 0 18 12" style={{ borderRadius: 2, flexShrink: 0 }}>
        <rect width="18" height="4" fill="#fff" />
        <rect y="4" width="18" height="4" fill="#0032A0" />
        <rect y="8" width="18" height="4" fill="#DA291C" />
      </svg>
    );
  }

  return (
    <svg width="18" height="12" viewBox="0 0 18 12" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="18" height="4" fill="#009FCA" />
      <rect y="4" width="18" height="4" fill="#fff" />
      <rect y="8" width="18" height="4" fill="#1EB53A" />
    </svg>
  );
};

export default LangFlag;
