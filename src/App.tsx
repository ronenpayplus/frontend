import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CompaniesList from './pages/CompaniesList';
import CompanyCreate from './pages/CompanyCreate';
import CompanyDetail from './pages/CompanyDetail';
import CompanyEdit from './pages/CompanyEdit';
import CompanyLegalEntities from './pages/CompanyLegalEntities';
import LegalEntityMerchants from './pages/LegalEntityMerchants';
import MerchantAccountsPage from './pages/MerchantAccountsPage';
import StoresPage from './pages/StoresPage';
import TerminalGroupsPage from './pages/TerminalGroupsPage';
import TerminalsPage from './pages/TerminalsPage';

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
          <Route path="/legal-entities" element={<CompanyLegalEntities />} />
          <Route path="/companies/:uuid/legal-entities" element={<CompanyLegalEntities />} />
          <Route path="/legal-entities/:uuid/merchants" element={<LegalEntityMerchants />} />
          <Route path="/merchants" element={<LegalEntityMerchants />} />
          <Route path="/merchants/:uuid/merchant-accounts" element={<MerchantAccountsPage />} />
          <Route path="/merchant-accounts" element={<MerchantAccountsPage />} />
          <Route path="/merchant-accounts/:uuid/stores" element={<StoresPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/stores/:uuid/terminal-groups" element={<TerminalGroupsPage />} />
          <Route path="/terminal-groups" element={<TerminalGroupsPage />} />
          <Route path="/terminal-groups/:uuid/terminals" element={<TerminalsPage />} />
          <Route path="/terminals" element={<TerminalsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
