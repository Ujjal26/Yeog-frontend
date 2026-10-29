import { Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { MenuProvider } from './context/MenuContext';
import { ComboProvider } from './context/ComboContext';
import { SocketProvider } from './context/SocketContext';
import { TableSocketProvider } from './context/TableSocketContext';
import AdminGate from './components/admin/AdminGate';
import GlobalConnectionStatus from './components/admin/GlobalConnectionStatus';

// Customer Pages
import LandingPage from './pages/customer/LandingPage';
import OrderingPage from './pages/customer/OrderingPage';
import CheckoutPage from './pages/customer/CheckoutPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveOrdersPage from './pages/admin/LiveOrdersPage';
import MenuEditorPage from './pages/admin/MenuEditorPage';
import ComboEditorPage from './pages/admin/ComboEditorPage';
import TableManagementPage from './pages/admin/TableManagementPage';
import SalesAnalysisPage from './pages/admin/SalesAnalysisPage';
import KitchenPage from './pages/kitchen/KitchenPage';

import './App.css';

function App() {
  return (
    <MenuProvider>
      <ComboProvider>
        <OrderProvider>
          <CartProvider>
          <Routes>
            {/* Customer Routes */}
            <Route element={<TableSocketProvider><Outlet /></TableSocketProvider>}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/order" element={<OrderingPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Route>

            {/*
              BUG-11 FIX: Admin + Kitchen routes now share a single <SocketProvider> via
              a parent layout route. Previously, each route had its own independent
              <SocketProvider>, which caused the WebSocket to disconnect and reconnect
              on every tab navigation. During the reconnect window, real-time order
              tickets were dropped. Now the socket connection persists for the full
              admin session regardless of which sub-page is active.
            */}
            <Route
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <Outlet />
                  </SocketProvider>
                </AdminGate>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<LiveOrdersPage />} />
              <Route path="/admin/menu" element={<MenuEditorPage />} />
              <Route path="/admin/tables" element={<TableManagementPage />} />
              <Route path="/admin/analytics" element={<SalesAnalysisPage />} />
              <Route path="/admin/combos" element={<ComboEditorPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
            </Route>
          </Routes>
          </CartProvider>
        </OrderProvider>
      </ComboProvider>
    </MenuProvider>
  );
}


export default App;
