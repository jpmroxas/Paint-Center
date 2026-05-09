import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart((prev) => {
      // Check if item exists in cart already to just increment qty
      const existingIdx = prev.findIndex(i => i.product_id === item.product_id && i.type === item.type);
      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx].qty += (item.qty || 1);
        return newCart;
      }
      return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9), qty: item.qty || 1 }];
    });
  };

  const removeFromCart = (index) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const updateQty = (index, newQty) => {
    const qty = Math.max(1, Number(newQty));
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], qty };
      return newCart;
    });
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
