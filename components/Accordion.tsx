import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon } from './IconComponents';

interface AccordionProps {
  title: string;
  children: ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left font-semibold text-lg text-white"
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 pt-0 text-gray-300">{children}</div>
      </div>
    </div>
  );
};

export default Accordion;