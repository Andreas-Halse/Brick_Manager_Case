import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import UserPage from './UserPage';

const Root: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/username/:username" element={<UserPage />} />
            </Routes>
        </Router>
    );
};

export default Root;  
