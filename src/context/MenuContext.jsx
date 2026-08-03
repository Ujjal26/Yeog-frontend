/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/menu`;
const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);

  // Fetch menu on load
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
        
        // Extract unique categories dynamically
        const uniqueCategories = [...new Set(data.map((item) => item.category))];
        setMenuCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const toggleAvailability = useCallback(async (itemId) => {
    try {
      const token = sessionStorage.getItem('yeog_admin_token');
      const res = await fetch(`${API_URL}/${itemId}/toggle-availability`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { item } = await res.json();
        setMenuItems((prev) => prev.map((i) => (i.id === itemId ? item : i)));
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  }, []);

  const addItem = useCallback(async (newItemData) => {
    try {
      const token = sessionStorage.getItem('yeog_admin_token');
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newItemData),
      });
      if (res.ok) {
        const { item } = await res.json();
        setMenuItems((prev) => [item, ...prev]);
        
        // Update categories if this item introduces a new one
        setMenuCategories((prev) => {
          if (!prev.includes(item.category)) {
            return [...prev, item.category];
          }
          return prev;
        });
        return { success: true, item };
      }
      return { success: false, error: 'Failed to add item' };
    } catch (err) {
      console.error('Failed to add item:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateItem = useCallback(async (itemId, updates) => {
    try {
      const token = sessionStorage.getItem('yeog_admin_token');
      const res = await fetch(`${API_URL}/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const { item } = await res.json();
        setMenuItems((prev) => prev.map((i) => (i.id === itemId ? item : i)));
        
        // Re-evaluate categories just in case
        setMenuCategories((prev) => {
          if (!prev.includes(item.category)) {
            return [...prev, item.category];
          }
          return prev;
        });
        return { success: true, item };
      }
      return { success: false, error: 'Failed to update item' };
    } catch (err) {
      console.error('Failed to update item:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteItem = useCallback(async (itemId) => {
    try {
      const token = sessionStorage.getItem('yeog_admin_token');
      const res = await fetch(`${API_URL}/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
        // We don't remove categories here in case another item uses it, 
        // or we could recalculate completely. Recalculating is safer but heavier.
        fetchMenu(); // Re-fetch to guarantee clean state
        return { success: true };
      }
      return { success: false, error: 'Failed to delete item' };
    } catch (err) {
      console.error('Failed to delete item:', err);
      return { success: false, error: err.message };
    }
  }, [fetchMenu]);

  const getByCategory = useCallback(
    (category) => {
      if (!category || category === 'All') return menuItems;
      return menuItems.filter((item) => item.category === category);
    },
    [menuItems]
  );

  const value = useMemo(
    () => ({
      menuItems,
      menuCategories,
      toggleAvailability,
      addItem,
      updateItem,
      deleteItem,
      getByCategory,
    }),
    [menuItems, menuCategories, toggleAvailability, addItem, updateItem, deleteItem, getByCategory]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
