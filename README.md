# ☕ yoeg-Cafe Frontend

A modern, real-time digital ordering, table management, and sales analytics application designed for artisan cafes and restaurants. Built with **React 19**, **Vite**, **React Router v7**, and **Socket.IO**, yoeg-Cafe provides a seamless experience for both customers ordering at their tables and cafe managers overseeing live operations and business intelligence.

---

## ✨ Features

### 🛒 Customer Interface

- **Table-Aware Ordering**: Scan a QR code or access table-specific URLs for seamless table ordering.
- **Dynamic Menu Browsing**: Browse categories, search items, and check availability in real time.
- **Cart Management**: Add items with customization options, adjust quantities, and view price breakdowns in Indian Rupees (`₹`).
- **Live Order Status**: Track order status in real time via Socket.IO connection.

### 🛡️ Admin Dashboard & Operations

- **Protected Access**: Admin Gate authentication to secure management routes with JWT tokens.
- **Live Order Board**: Monitor incoming, preparing, ready, and completed orders live without manual page refreshes.
- **Menu Management**: Dynamic menu editor to add, edit, toggle availability (`isAvailable`), set pricing in `₹`, and upload dish photos to Cloudinary.
- **Table & QR Code Generator**: Manage table layouts, track active table sessions, and generate printable QR codes for customer scanning (`qrcode.react`).
- **📈 Sales Analytics Dashboard**: Integrated financial reporting dashboard (`/admin/analytics`) featuring:
  - **KPI Metrics**: Total Revenue (`₹`), Items Sold, Order Data Records count, and Avg Item Price.
  - **📊 Monthly Sales & Profit Chart**: Interactive SVG bar graph showing monthly revenue, customizable profit margins (40%–80%), year selector, and hover tooltips.
  - **🔥 Top Selling Items**: Visual list and progress bars ranking top-selling menu items.
  - **📜 OrderData Transaction Log**: Searchable table displaying order entries, quantity, unit price (`₹`), line total, and shortened `YYYY/MM/DD` date timestamps.

---

## 🛠️ Tech Stack

| Category       | Technology                                  |
| :------------- | :------------------------------------------ |
| **Framework**  | [React 19](https://react.dev/)              |
| **Build Tool** | [Vite 8](https://vitejs.dev/)               |
| **Routing**    | [React Router v7](https://reactrouter.com/) |
| **Real-time**  | [Socket.IO Client](https://socket.io/)      |
| **QR Code**    | `qrcode.react`                              |
| **Styling**    | Modular Vanilla CSS + Design System         |
| **Linting**    | ESLint                                      |
| **Hosting**    | Netlify Ready (`netlify.toml`)              |

---

## 📁 Project Structure

```text
yoeg-Cafe/
├── public/                 # Static public assets
├── src/
│   ├── assets/             # Brand images and icons
│   ├── components/         # UI components
│   │   ├── admin/          # Admin-specific components (AdminGate, TableCard, OrderTicket, Sidebar)
│   │   ├── common/         # Shared components (Navbar, Modal)
│   │   └── customer/       # Customer UI components (ProductCard, MenuCategory, CheckoutItem)
│   ├── context/            # React Context Providers
│   │   ├── CartContext.jsx         # Cart state & local storage persistence
│   │   ├── MenuContext.jsx         # Menu items & availability state
│   │   ├── OrderContext.jsx        # Customer order placement & history
│   │   ├── SocketContext.jsx       # Global Socket.IO connection for admin
│   │   └── TableSocketContext.jsx  # Table-level Socket.IO context
│   ├── pages/
│   │   ├── admin/          # Admin pages (AdminDashboard, LiveOrdersPage, MenuEditorPage, TableManagementPage, SalesAnalysisPage)
│   │   │   └── components/ # Admin page components (MonthlySalesChart.jsx)
│   │   └── customer/       # Customer pages (LandingPage, OrderingPage, CheckoutPage)
│   ├── utils/              # Helper functions & URL parsers
│   ├── App.jsx             # Main Application routing & provider tree
│   ├── main.jsx            # Entry point
│   ├── App.css             # Main component styles
│   └── index.css           # Global design system & theme resets
├── .env.local              # Local environment variables
├── eslint.config.js        # ESLint rules configuration
├── netlify.toml            # Deployment rules and SPA redirects
├── package.json            # Project dependencies & scripts
└── vite.config.js          # Vite build configuration
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### Installation

1. Navigate to the project directory:
   ```bash
   cd frontend/Yeog-Cafe
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev` — Launches the Vite development server with HMR.
- `npm run build` — Builds the application for production into the `dist/` directory.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Runs ESLint to check for code quality and style issues.
