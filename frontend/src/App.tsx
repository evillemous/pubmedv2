import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Beaker, Settings, Home } from 'lucide-react';
import './App.css';

import { lazy, Suspense } from 'react';
const AdminPage = lazy(() => import('./pages/AdminPage'));
const HomePage = lazy(() => import('./pages/HomePage'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Beaker className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Medical Research Assistant</h1>
            </div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link to="/">
                    <Button variant="ghost" className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link to="/admin">
                    <Button variant="ghost" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Suspense>
        </main>
        
        <footer className="bg-white border-t mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-gray-500">
            <p>© 2025 Medical Research Assistant. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
