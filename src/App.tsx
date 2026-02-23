import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CompaniesList from './pages/CompaniesList';
import CompanyCreate from './pages/CompanyCreate';
import CompanyDetail from './pages/CompanyDetail';
import CompanyEdit from './pages/CompanyEdit';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/companies" replace />} />
          <Route path="/companies" element={<CompaniesList />} />
          <Route path="/companies/new" element={<CompanyCreate />} />
          <Route path="/companies/:uuid" element={<CompanyDetail />} />
          <Route path="/companies/:uuid/edit" element={<CompanyEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
