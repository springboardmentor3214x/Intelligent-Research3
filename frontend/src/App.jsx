import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ResearchNotifications from './components/ResearchNotifications';
import ProfileIdentitySync from './components/ProfileIdentitySync';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ResearchNotifications />
        <ProfileIdentitySync />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;