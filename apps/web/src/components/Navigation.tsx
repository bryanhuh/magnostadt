import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const links = [
    { name: 'Collection', path: '/collections' },
    { name: 'Products', path: '/shop' },
  ];

  return (
    <nav className="flex items-center">
      <ul className="flex items-center gap-8">
        {links.map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={`text-sm md:text-base uppercase tracking-widest transition-colors font-orbitron ${
                location.pathname === link.path 
                  ? 'text-yellow-600' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
