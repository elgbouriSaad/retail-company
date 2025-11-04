import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-700">404</h1>
          <div className="text-slate-500 text-lg mb-4">Page Not Found</div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Oops! Page not found</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            as={Link}
            to="/"
            icon={Home}
          >
            Go Home
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            icon={ArrowLeft}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};