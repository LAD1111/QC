import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen font-sans">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;