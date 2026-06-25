import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteBreadcrumbMinimalSlash({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" data-testid="site-breadcrumb-minimal">
      <ol className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center">
              {isLast ? (
                <span className="text-gray-900">{item.label}</span>
              ) : (
                <>
                  <Link to={item.href || '#'} className="hover:text-gray-900 transition-colors">
                    {item.label}
                  </Link>
                  <span className="mx-2 text-gray-300">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
