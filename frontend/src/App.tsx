import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthChecker from './components/common/AuthChecker';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import AllTasks from './pages/AllTasks';
import AddTask from './pages/AddTask';
import Routines from './pages/Routines';
import ScheduledTasks from './pages/ScheduledTasks';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <AuthChecker>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<AllTasks />} />
              <Route path="tasks/add" element={<AddTask />} />
              <Route path="routines" element={<Routines />} />
              <Route path="scheduled" element={<ScheduledTasks />} />
              <Route path="categories" element={<Categories />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthChecker>
      </LanguageProvider>
    </SettingsProvider>
  );
};

export default App;
