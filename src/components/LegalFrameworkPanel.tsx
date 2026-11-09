import React from 'react';
import { CODIGO_MINAS_SECTIONS, LEY_SEGUNDA_SECTION, LEY_685_PDF_URL, LegalSection } from '../services/legalFramework';

const Section: React.FC<{ s: LegalSection }> = ({ s }) => (
  <div className="border-l-2 pl-2" style={{ borderColor: s.color }}>
    <p className="font-bold" style={{ color: s.color }}>
      {s.titulo} <span className="text-slate-400 font-normal">({s.articulos})</span>
    </p>
    <ul className="list-disc pl-4 text-slate-300">
      {s.items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
    {s.nota && <p className="italic text-slate-400">{s.nota}</p>}
  </div>
);

export const LegalFrameworkPanel: React.FC = () => (
  <div className="space-y-2 text-[11px] leading-snug">
    <Section s={LEY_SEGUNDA_SECTION} />
    <p className="font-bold text-slate-200 pt-1">Capas condicionantes del Código de Minas</p>
    {CODIGO_MINAS_SECTIONS.map((s) => (
      <Section key={s.id} s={s} />
    ))}
    <a href={LEY_685_PDF_URL} target="_blank" rel="noopener noreferrer" className="inline-block font-bold text-sky-400 hover:underline">
      Ley 685 de 2001 (PDF ANM)
    </a>
  </div>
);
