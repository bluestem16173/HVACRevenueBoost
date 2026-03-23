import React from 'react';
import Link from 'next/link';
import { BasePageViewModel } from '@/lib/content';
import { GitMerge } from 'lucide-react';

interface Props {
  relationships?: BasePageViewModel['relationships'];
  currentPageType: string;
  currentSlug: string;
}

export default function RelationshipGraph({ relationships, currentPageType, currentSlug }: Props) {
  if (!relationships) return null;

  const renderSection = (title: string, items: string[] | undefined, generatePath: (slug: string) => string) => {
    if (!items || items.length === 0) return null;
    
    // Filter out identical self-referencing links
    const filtered = items.filter(slug => slug !== currentSlug);
    if (filtered.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-sm font-bold tracking-widest text-hvac-blue uppercase mb-3 flex items-center">
          <span className="w-2 h-2 rounded-full bg-hvac-gold mr-2"></span>
          {title}
        </h4>
        <ul className="space-y-2">
          {filtered.map(slug => (
            <li key={slug} className="flex items-start group">
              <span className="text-gray-400 group-hover:text-hvac-blue mr-2 mt-1 transition-colors duration-200">↳</span>
              <Link 
                href={generatePath(slug)} 
                className="text-gray-700 hover:text-hvac-blue font-medium decoration-hvac-blue/30 hover:underline underline-offset-4 transition-all duration-200"
              >
                {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const hasAnyLinks = Object.values(relationships).some(arr => arr && arr.length > 0);
  if (!hasAnyLinks) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm my-8 mt-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-hvac-blue to-hvac-gold"></div>
      
      <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
        <GitMerge className="text-hvac-blue w-6 h-6 mr-3" />
        <h3 className="text-2xl font-bold text-hvac-navy">Diagnostic Connections</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        {renderSection("System Hierarchy", relationships.systems, (s) => `/system/${s}`)}
        {renderSection("Related Symptoms", relationships.symptoms, (s) => `/conditions/${s}`)}
        {renderSection("Diagnostic Guides", relationships.diagnostics, (s) => `/diagnose/${s}`)}
        {renderSection("Possible Causes", relationships.causes, (s) => `/causes/${s}`)}
        {renderSection("Faulty Components", relationships.components, (s) => `/components/${s}`)}
        {renderSection("Recommended Fixes", relationships.repairs, (s) => `/fix/${s}`)}
        {renderSection("Context & Situations", relationships.context, (s) => `/conditions/${s}`)}
      </div>
    </div>
  );
}
