'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldX } from 'lucide-react';

export default function ApiKeyIndicator() {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
      setHasApiKey(!!apiKey);
    };

    checkApiKey();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gemini_api_key') {
        checkApiKey();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkApiKey, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center mr-2" title={hasApiKey ? 'API Key configured' : 'API Key not configured'}>
      {hasApiKey ? (
        <Shield className="h-4 w-4 text-green-500" />
      ) : (
        <ShieldX className="h-4 w-4 text-red-500" />
      )}
    </div>
  );
}
