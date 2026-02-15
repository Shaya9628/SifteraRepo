import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Domain } from '@/lib/constants/domains';

interface DomainContextType {
  currentDomain: Domain;
  setCurrentDomain: (domain: Domain) => void;
  domainSettings: {
    allow_user_domain_change: boolean;
    allow_admin_domain_change: boolean;
  };
  canUserChangeDomain: boolean;
  canAdminChangeDomain: boolean;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

interface DomainProviderProps {
  children: ReactNode;
}

export const DomainProvider: React.FC<DomainProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentDomain, setCurrentDomainState] = useState<Domain>('sales');
  const [domainSettings, setDomainSettings] = useState({
    allow_user_domain_change: true,
    allow_admin_domain_change: true,
  });

  useEffect(() => {
    // Load domain settings from localStorage
    const savedSettings = localStorage.getItem('domain_settings');
    if (savedSettings) {
      setDomainSettings(JSON.parse(savedSettings));
    }

    // Load user's domain from localStorage
    if (user) {
      const userDomain = localStorage.getItem(`user_domain_${user.id}`) as Domain || 'Sales';
      setCurrentDomainState(userDomain.toLowerCase() as Domain || 'sales');
    }

    // Listen for domain changes
    const handleDomainChange = (event: CustomEvent) => {
      setCurrentDomainState(event.detail.domain);
    };

    window.addEventListener('domainChanged', handleDomainChange as EventListener);
    
    return () => {
      window.removeEventListener('domainChanged', handleDomainChange as EventListener);
    };
  }, [user]);

  const setCurrentDomain = (domain: Domain) => {
    if (user) {
      localStorage.setItem(`user_domain_${user.id}`, domain);
      setCurrentDomainState(domain);
      
      // Emit domain change event
      window.dispatchEvent(new CustomEvent('domainChanged', { detail: { domain } }));
    }
  };

  const value: DomainContextType = {
    currentDomain,
    setCurrentDomain,
    domainSettings,
    canUserChangeDomain: domainSettings.allow_user_domain_change,
    canAdminChangeDomain: domainSettings.allow_admin_domain_change,
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = (): DomainContextType => {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
};