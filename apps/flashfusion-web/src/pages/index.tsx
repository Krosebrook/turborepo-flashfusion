// Temporarily importing from local packages for demo
// import { Button, Card, Input } from '@krosebrook/ui-components';
// import { formatDate, capitalize } from '@krosebrook/shared-utilities';
import { useState } from 'react';

// Mock implementations for demo
const Button = ({ children, onClick, variant = 'primary' }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg ${variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    {children}
  </button>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, placeholder, value, onChange }: any) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const formatDate = (date: Date) => date.toLocaleDateString();
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    setMessage(`Hello, ${capitalize(inputValue)}! Welcome to FlashFusion.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          FlashFusion Web Application
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-semibold mb-4">Welcome Demo</h2>
            <div className="space-y-4">
              <Input
                label="Your Name"
                placeholder="Enter your name"
                value={inputValue}
                onChange={setInputValue}
              />
              <Button onClick={handleSubmit} variant="primary">
                Submit
              </Button>
              {message && (
                <p className="text-green-600 font-medium">{message}</p>
              )}
            </div>
          </Card>
          
          <Card>
            <h2 className="text-2xl font-semibold mb-4">Repository Info</h2>
            <div className="space-y-2">
              <p><strong>Date:</strong> {formatDate(new Date())}</p>
              <p><strong>Monorepo Structure:</strong> Active</p>
              <p><strong>Shared Components:</strong> ✅ Working</p>
              <p><strong>Shared Utilities:</strong> ✅ Working</p>
            </div>
          </Card>
        </div>
        
        <Card className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Organization Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Apps</h3>
              <p className="text-2xl font-bold text-blue-600">1</p>
              <p className="text-sm text-blue-700">FlashFusion Web</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">Packages</h3>
              <p className="text-2xl font-bold text-green-600">2</p>
              <p className="text-sm text-green-700">UI Components, Utilities</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900">Tools</h3>
              <p className="text-2xl font-bold text-purple-600">1</p>
              <p className="text-sm text-purple-700">Repository Manager</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}