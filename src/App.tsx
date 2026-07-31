import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import English from './pages/English';
import Dictation from './pages/Dictation';
import Speaking from './pages/Speaking';
import Vocabulary from './pages/Vocabulary';
import WrongBook from './pages/WrongBook';
import Reading from './pages/Reading';
import BookDetail from './pages/BookDetail';
import Sports from './pages/Sports';
import Report from './pages/Report';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/english" element={<English />} />
          <Route path="/english/dictation" element={<Dictation />} />
          <Route path="/english/speaking" element={<Speaking />} />
          <Route path="/english/vocabulary" element={<Vocabulary />} />
          <Route path="/english/wrongbook" element={<WrongBook />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/reading/:bookId" element={<BookDetail />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/report" element={<Report />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
