import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Departments from './pages/Departments.jsx';
import Programs from './pages/Programs.jsx';
import Admissions from './pages/Admissions.jsx';
import Fees from './pages/Fees.jsx';
import Scholarships from './pages/Scholarships.jsx';
import MeritLists from './pages/MeritLists.jsx';
import Compare from './pages/Compare.jsx';
import Search from './pages/Search.jsx';
import SystemStatus from './pages/SystemStatus.jsx';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="departments" element={<Departments />} />
          <Route path="programs" element={<Programs />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="fees" element={<Fees />} />
          <Route path="scholarships" element={<Scholarships />} />
          <Route path="merit-lists" element={<MeritLists />} />
          <Route path="compare" element={<Compare />} />
          <Route path="search" element={<Search />} />
          <Route path="system" element={<SystemStatus />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
