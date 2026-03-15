import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AccountsList from './pages/AccountsList';
import AccountCreate from './pages/AccountCreate';
import AccountDetail from './pages/AccountDetail';
import AccountEdit from './pages/AccountEdit';
import AccountLegalEntities from './pages/AccountLegalEntities';
import LegalEntityMerchants from './pages/LegalEntityMerchants';
import MerchantAccountsPage from './pages/MerchantAccountsPage';
import StoresPage from './pages/StoresPage';
import TerminalGroupsPage from './pages/TerminalGroupsPage';
import TerminalsPage from './pages/TerminalsPage';
import CountriesPage from './pages/CountriesPage';
import CurrenciesPage from './pages/CurrenciesPage';
import TimezonesPage from './pages/TimezonesPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ChannelTypesPage from './pages/ChannelTypesPage';
import BeneficialOwnersPage from './pages/BeneficialOwnersPage';
import AccountContactsPage from './pages/AccountContactsPage';
import ComplianceDocumentsPage from './pages/ComplianceDocumentsPage';
import SubMerchantAccountsPage from './pages/SubMerchantAccountsPage';
import AddressesPage from './pages/AddressesPage';
import LocationsPage from './pages/LocationsPage';
import StationsPage from './pages/StationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/accounts" replace />} />
          <Route path="/accounts" element={<AccountsList />} />
          <Route path="/accounts/new" element={<AccountCreate />} />
          <Route path="/accounts/:uuid" element={<AccountDetail />} />
          <Route path="/accounts/:uuid/edit" element={<AccountEdit />} />
          <Route path="/accounts/:uuid/contacts" element={<AccountContactsPage />} />
          <Route path="/legal-entities" element={<AccountLegalEntities />} />
          <Route path="/accounts/:uuid/legal-entities" element={<AccountLegalEntities />} />
          <Route path="/legal-entities/:uuid/merchants" element={<LegalEntityMerchants />} />
          <Route path="/legal-entities/:uuid/beneficial-owners" element={<BeneficialOwnersPage />} />
          <Route path="/legal-entities/:uuid/compliance-documents" element={<ComplianceDocumentsPage />} />
          <Route path="/beneficial-owners" element={<BeneficialOwnersPage />} />
          <Route path="/compliance-documents" element={<ComplianceDocumentsPage />} />
          <Route path="/contacts" element={<AccountContactsPage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/merchants" element={<LegalEntityMerchants />} />
          <Route path="/merchants/:uuid/merchant-accounts" element={<MerchantAccountsPage />} />
          <Route path="/merchant-accounts" element={<MerchantAccountsPage />} />
          <Route path="/merchant-accounts/:uuid/sub-merchants" element={<SubMerchantAccountsPage />} />
          <Route path="/sub-merchants" element={<SubMerchantAccountsPage />} />
          <Route path="/merchant-accounts/:uuid/stores" element={<StoresPage />} />
          <Route path="/sub-merchants/:uuid/stores" element={<StoresPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/stores/:uuid/stations" element={<StationsPage />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/stores/:uuid/terminal-groups" element={<TerminalGroupsPage />} />
          <Route path="/terminal-groups" element={<TerminalGroupsPage />} />
          <Route path="/terminal-groups/:uuid/terminals" element={<TerminalsPage />} />
          <Route path="/terminals" element={<TerminalsPage />} />
          <Route path="/reference/countries" element={<CountriesPage />} />
          <Route path="/reference/currencies" element={<CurrenciesPage />} />
          <Route path="/reference/timezones" element={<TimezonesPage />} />
          <Route path="/reference/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="/reference/channel-types" element={<ChannelTypesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
