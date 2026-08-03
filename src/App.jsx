import { Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { MenuProvider } from './context/MenuContext';
import { SocketProvider } from './context/SocketContext';
import { TableSocketProvider } from './context/TableSocketContext';
import AdminGate from './components/admin/AdminGate';

// Customer Pages
import LandingPage from './pages/customer/LandingPage';
import OrderingPage from './pages/customer/OrderingPage';
import CheckoutPage from './pages/customer/CheckoutPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveOrdersPage from './pages/admin/LiveOrdersPage';
import MenuEditorPage from './pages/admin/MenuEditorPage';
import TableManagementPage from './pages/admin/TableManagementPage';

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
                    <TableManagementPage />
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
