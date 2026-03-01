import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on admin routes
  if (!mounted || location.pathname.startsWith('/admin')) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-1 sm:p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0E6CA] transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-6 h-6" strokeWidth={1.5} />
      ) : (
        <Moon className="w-6 h-6" strokeWidth={1.5} />
      )}
    </button>
  );
}
