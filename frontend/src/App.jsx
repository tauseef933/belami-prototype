import { useState } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import SelectionPage from './pages/SelectionPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import { useTryOn } from './hooks/useTryOn.js';

export default function App() {
  const [page, setPage] = useState('landing');
  const tryOn = useTryOn();

  return (
    <div className="min-h-screen bg-belami-cream font-sans">
      {page === 'landing' && <LandingPage onStart={() => setPage('selection')} />}
      {page === 'selection' && <SelectionPage tryOn={tryOn} onResult={() => setPage('result')} />}
      {page === 'result' && <ResultPage tryOn={tryOn} onBack={() => setPage('selection')} />}
    </div>
  );
}