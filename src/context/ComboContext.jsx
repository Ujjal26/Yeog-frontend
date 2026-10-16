/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/combos`;
const ComboContext = createContext(null);

export function ComboProvider({ children }) {
  const [combos, setCombos] = useState([]);

  /**
   * Fetch all combos from the API.
   * Pass all=true to include admin-disabled combos (for the admin panel).
   */
  const fetchCombos = useCallback(async ({ all = false } = {}) => {
    try {
      const url = all ? `${API_URL}?all=true` : API_URL;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCombos(data);
      }
    } catch (err) {
      console.error('Failed to fetch combos:', err);
    }
  }, []);

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  /** Admin: create a new combo */
  const addCombo = useCallback(async (comboData) => {
    try {
      const token = sessionStorage.getItem('yoeg_admin_token');
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(comboData),
      });
      if (res.ok) {
        const { combo } = await res.json();
        setCombos((prev) => [combo, ...prev]);
        return { success: true, combo };
      }
      const err = await res.json();
      return { success: false, error: err.message || 'Failed to add combo' };
    } catch (err) {
      console.error('Failed to add combo:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /** Admin: update an existing combo */
  const updateCombo = useCallback(async (comboId, updates) => {
    try {
      const token = sessionStorage.getItem('yoeg_admin_token');
      const res = await fetch(`${API_URL}/${comboId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const { combo } = await res.json();
        setCombos((prev) => prev.map((c) => (c.id === comboId ? combo : c)));
        return { success: true, combo };
      }
      const err = await res.json();
      return { success: false, error: err.message || 'Failed to update combo' };
    } catch (err) {
      console.error('Failed to update combo:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /** Admin: delete a combo */
  const deleteCombo = useCallback(async (comboId) => {
    try {
      const token = sessionStorage.getItem('yoeg_admin_token');
      const res = await fetch(`${API_URL}/${comboId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCombos((prev) => prev.filter((c) => c.id !== comboId));
        return { success: true };
      }
      return { success: false, error: 'Failed to delete combo' };
    } catch (err) {
      console.error('Failed to delete combo:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /** Admin: toggle combo availability */
  const toggleComboAvailability = useCallback(async (comboId) => {
    try {
      const token = sessionStorage.getItem('yoeg_admin_token');
      const res = await fetch(`${API_URL}/${comboId}/toggle-availability`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { combo } = await res.json();
        setCombos((prev) => prev.map((c) => (c.id === comboId ? combo : c)));
        return { success: true, combo };
      }
      return { success: false, error: 'Failed to toggle combo availability' };
    } catch (err) {
      console.error('Failed to toggle combo availability:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const value = useMemo(
    () => ({
      combos,
      fetchCombos,
      addCombo,
      updateCombo,
      deleteCombo,
      toggleComboAvailability,
    }),
    [combos, fetchCombos, addCombo, updateCombo, deleteCombo, toggleComboAvailability]
  );

  return <ComboContext.Provider value={value}>{children}</ComboContext.Provider>;
}

export function useCombo() {
  const context = useContext(ComboContext);
  if (!context) {
    throw new Error('useCombo must be used within a ComboProvider');
  }
  return context;
}
