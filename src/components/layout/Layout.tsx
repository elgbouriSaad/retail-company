import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};