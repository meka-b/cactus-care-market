import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

export default function SiteBreadcrumbDefault({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <Breadcrumb data-testid="site-breadcrumb-default">
      <BreadcrumbList className="flex-nowrap min-w-max text-sm sm:text-base">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href || '#'}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        );
      })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
