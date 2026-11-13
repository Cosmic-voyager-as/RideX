import React, { createContext, useContext, useState } from 'react';
import { OOPEvent } from '../types';

interface OOPContextType {
  events: OOPEvent[];
  logOOPEvent: (
    principle: 'Encapsulation' | 'Inheritance' | 'Abstraction' | 'Polymorphism',
    title: string,
    description: string,
    codeSnippet?: string
  ) => void;
  clearEvents: () => void;
}

const OOPContext = createContext<OOPContextType | undefined>(undefined);

export const OOPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<OOPEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      principle: 'Encapsulation',
      title: 'Wallet Balance Invariants',
      description: 'Wallet.balance is private. Mutated only via credit() & debit() methods with strict validation checks.',
      codeSnippet: 'wallet.credit(500); // balance increases safely\nwallet.debit(1000); // throws InsufficientFundsError if low'
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      principle: 'Inheritance',
      title: 'Unified User & Vehicle Hierarchies',
      description: 'Customer, Driver, and Admin extend User. Bike, Auto, Sedan, SUV, and Premium extend Vehicle.',
      codeSnippet: 'class Driver extends User { private _vehicle: Vehicle; ... }\nclass Sedan extends Vehicle { ... }'
    },
    {
      id: 'init-3',
      timestamp: new Date().toLocaleTimeString(),
      principle: 'Abstraction',
      title: 'Contracts over Implementations',
      description: 'Domain services depend exclusively on interfaces (IPricingStrategy, IPaymentMethod, IRepository<T>).',
      codeSnippet: 'class FareCalculator {\n  constructor(private _strategy: IPricingStrategy) {}\n}'
    },
    {
      id: 'init-4',
      timestamp: new Date().toLocaleTimeString(),
      principle: 'Polymorphism',
      title: 'Runtime Dispatch Without Type Checking',
      description: 'PaymentProcessor.process(method, amount) and Vehicle.calculateFare() execute subclass logic with zero if/switch checks.',
      codeSnippet: 'processor.process(new WalletPayment(wallet), amount); // executes WalletPayment.pay()'
    }
  ]);

  const logOOPEvent = (
    principle: 'Encapsulation' | 'Inheritance' | 'Abstraction' | 'Polymorphism',
    title: string,
    description: string,
    codeSnippet?: string
  ) => {
    const newEvent: OOPEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      principle,
      title,
      description,
      codeSnippet
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // keep latest 50
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <OOPContext.Provider value={{ events, logOOPEvent, clearEvents }}>
      {children}
    </OOPContext.Provider>
  );
};

export const useOOP = (): OOPContextType => {
  const context = useContext(OOPContext);
  if (!context) {
    throw new Error('useOOP must be used within an OOPProvider');
  }
  return context;
};

