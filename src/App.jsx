import { Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { MenuProvider } from './context/MenuContext';
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
import TableManagementPage from './pages/admin/TableManagementPage';
import SalesAnalysisPage from './pages/admin/SalesAnalysisPage';
import KitchenPage from './pages/kitchen/KitchenPage';

import './App.css';

function App() {
  return (
    <MenuProvider>
      <OrderProvider>
        <CartProvider>
          <Routes>
            {/* Customer Routes */}
            <Route element={<TableSocketProvider><Outlet /></TableSocketProvider>}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/order" element={<OrderingPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Route>

            {/* Admin Routes (Password Protected + Socket Connected) */}
            <Route
              path="/admin"
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <AdminDashboard />
                  </SocketProvider>
                </AdminGate>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <LiveOrdersPage />
                  </SocketProvider>
                </AdminGate>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <MenuEditorPage />
                  </SocketProvider>
                </AdminGate>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <TableManagementPage />
                  </SocketProvider>
                </AdminGate>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <SalesAnalysisPage />
                  </SocketProvider>
                </AdminGate>
              }
            />
            
            {/* Kitchen Route (Password Protected + Socket Connected) */}
            <Route
              path="/kitchen"
              element={
                <AdminGate>
                  <SocketProvider>
                    <GlobalConnectionStatus />
                    <KitchenPage />
                  </SocketProvider>
                </AdminGate>
              }
            />
          </Routes>
        </CartProvider>
      </OrderProvider>
    </MenuProvider>
  );
}


export default App;
