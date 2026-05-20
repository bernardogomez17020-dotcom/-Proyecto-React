import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ECommerce from './pages/Dashboard/ECommerce';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Loader from './common/Loader';
import routes, { AppRoute } from './routes';

import ProtectedRoute from "../src/components/Auth/ProtectedRoute";
import { LocalStorageProvider } from './storage/LocalStorageProvider';
import { User } from './models/User';

const DefaultLayout = lazy(() => import('./layout/DefaultLayout'));

const storage = new LocalStorageProvider();

function GuardedRoute({ route }: { route: AppRoute }) {
  if (route.roles) {
    const raw = storage.getItem('user');
    if (raw) {
      try {
        const user: User = JSON.parse(raw);
        if (!route.roles.includes(user.role as any)) {
          return <Navigate to="/" replace />;
        }
      } catch {
        return <Navigate to="/auth/signin" replace />;
      }
    }
  }
  const Component = route.component;
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

function App() {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />
      <Routes>
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DefaultLayout />}>
            <Route index element={<ECommerce />} />
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={<GuardedRoute route={route} />}
              />
            ))}
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
