import type { FridgeIllustrationProps } from '../types/interfaces/FridgeIllustrationProps';

export const FridgeIllustration = ({ width, height }: FridgeIllustrationProps) => {
  return (
    <svg width={width} height={height} viewBox="0 30 400 340" role="img" aria-label="An open refrigerator stocked with eggs, milk, leftovers, tomatoes and greens">
      <circle cx="200" cy="205" r="150" fill="#DCEBE3" />
      <ellipse cx="205" cy="358" rx="120" ry="8" fill="#0D3B2E" fillOpacity="0.12" />
      <rect x="164" y="350" width="14" height="8" rx="2" fill="#0D3B2E" />
      <rect x="272" y="350" width="14" height="8" rx="2" fill="#0D3B2E" />
      <rect x="150" y="70" width="150" height="284" rx="18" fill="#0D3B2E" />
      <rect x="162" y="84" width="126" height="176" rx="10" fill="#F0FDF4" />
      <rect x="180" y="89" width="90" height="4" rx="2" fill="#FEF3C7" />
      <rect x="162" y="142" width="126" height="4" fill="#A7F3D0" />
      <rect x="162" y="200" width="126" height="4" fill="#A7F3D0" />
      <rect x="172" y="126" width="58" height="16" rx="5" fill="#FED7AA" />
      <ellipse cx="185" cy="122" rx="7" ry="9" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
      <ellipse cx="201" cy="122" rx="7" ry="9" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
      <ellipse cx="217" cy="122" rx="7" ry="9" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M246 142 L246 108 L254 98 L272 98 L280 108 L280 142 Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="246" y="118" width="34" height="10" fill="#15803D" />
      <rect x="168" y="164" width="60" height="9" rx="4" fill="#9A3412" />
      <rect x="172" y="170" width="52" height="30" rx="6" fill="#C2410C" />
      <circle cx="248" cy="188" r="12" fill="#EF4444" />
      <circle cx="270" cy="190" r="10" fill="#EF4444" />
      <path d="M248 176 L244 172 M248 176 L252 172 M270 180 L267 176 M270 180 L274 177" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M182 216 C176 198 188 190 196 194 C192 204 190 210 192 216 Z" fill="#22C55E" />
      <path d="M198 216 C198 196 210 188 216 192 C210 202 208 210 208 216 Z" fill="#15803D" />
      <ellipse cx="252" cy="212" rx="16" ry="6" transform="rotate(-18 252 212)" fill="#DC2626" />
      <rect x="168" y="212" width="114" height="42" rx="8" fill="#DCFCE7" fillOpacity="0.9" stroke="#A7F3D0" strokeWidth="2" />
      <rect x="205" y="236" width="40" height="6" rx="3" fill="#A7F3D0" />
      <rect x="162" y="272" width="126" height="70" rx="10" fill="#134E4A" />
      <rect x="195" y="284" width="60" height="6" rx="3" fill="#A7F3D0" />
      <rect x="174" y="306" width="40" height="22" rx="6" fill="#0D3B2E" />
      <text x="194" y="321" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fontWeight="700" fill="#A7F3D0">4°C</text>
      <path d="M150 78 L92 96 L92 334 L150 346 Z" fill="#FFFFFF" stroke="#0D3B2E" strokeWidth="3" strokeLinejoin="round" />
      <rect x="106" y="110" width="11" height="34" rx="4" fill="#EA580C" />
      <rect x="108" y="104" width="7" height="7" rx="1.5" fill="#0D3B2E" />
      <rect x="123" y="114" width="11" height="30" rx="4" fill="#84CC16" />
      <rect x="125" y="108" width="7" height="7" rx="1.5" fill="#0D3B2E" />
      <path d="M100 142 L144 136 L144 152 L100 157 Z" fill="#DCEBE3" />
      <rect x="106" y="200" width="14" height="22" rx="4" fill="#D97706" />
      <rect x="125" y="203" width="12" height="18" rx="4" fill="#F59E0B" />
      <path d="M100 222 L144 218 L144 234 L100 238 Z" fill="#DCEBE3" />
    </svg>
  );
};
