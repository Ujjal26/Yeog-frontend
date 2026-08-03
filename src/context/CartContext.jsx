/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useMemo } from 'react';

const CartContext = createContext(null);

const initialState = {
  items: [],
  tableNumber: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_TABLE':
      return { ...state, tableNumber: action.payload };

    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, qty: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      const { id, qty } = action.payload;
      if (qty <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== id),
        };
      }
      return {
        ...state,
        items: state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const actions = useMemo(
    () => ({
      setTable: (tableNumber) =>
        dispatch({ type: 'SET_TABLE', payload: tableNumber }),
      addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      updateQuantity: (id, qty) =>
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, qty } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    }),
    []
  );

  const computed = useMemo(() => {
    const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = subtotal;
    return { totalItems, subtotal, tax: 0, total };
  }, [state.items]);

  const value = useMemo(
    () => ({ ...state, ...actions, ...computed }),
    [state, actions, computed]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
