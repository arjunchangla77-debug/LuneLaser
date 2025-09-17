import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateOffice from './components/CreateOffice';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CreateOffice />} />
          <Route path="/create-office" element={<CreateOffice />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
