'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeProps) {
  return (
    <div style={{ padding: 16, background: 'white', borderRadius: 12, display: 'inline-block' }}>
      <QRCodeSVG value={value} size={size} level="M" />
    </div>
  );
}