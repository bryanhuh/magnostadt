import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  linkText?: string;
  onLinkClick?: () => void;
  className?: string;
}

export function SectionHeader({ title, subtitle, linkText, onLinkClick, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between mb-8 ${className}`}>
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 italic uppercase tracking-tighter">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-500 mt-2 text-sm md:text-base font-medium">
            {subtitle}
          </p>
        )}
      </div>
      
      {linkText && onLinkClick && (
        <button 
          onClick={onLinkClick}
          className="group flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-bold uppercase text-sm tracking-wider transition-colors"
        >
          {linkText}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
}
