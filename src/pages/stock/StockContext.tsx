// StockContext.tsx
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { EntradaEstoque } from 'types/models';
import { getStockEntries, updateStockEntry } from '../../api/methods';

interface StockContextType {
  stockEntries: EntradaEstoque[];
  updateStockQuantity: (productId: string, quantityToDeduct: number) => Promise<void>;
  fetchStock: () => Promise<void>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockEntries, setStockEntries] = useState<EntradaEstoque[]>([]);

  const fetchStock = async () => {
    try {
      const entries = await getStockEntries();
      setStockEntries(entries);
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
    }
  };

  const updateStockQuantity = async (productId: string, quantityToDeduct: number) => {
    const entry = stockEntries.find((entry) => entry.id_produto === productId);
    if (!entry) throw new Error('Produto não encontrado no estoque.');

    const currentQuantity = Number(entry.quantidadeRecebida) || 0;
    if (currentQuantity < quantityToDeduct) throw new Error('Quantidade insuficiente no estoque.');

    const newQuantity = currentQuantity - quantityToDeduct;
    await updateStockEntry(entry.id!, { ...entry, quantidadeRecebida: newQuantity });
    setStockEntries((prev) =>
      prev.map((item) =>
        item.id === entry.id ? { ...item, quantidadeRecebida: newQuantity } : item,
      ),
    );
  };

  return (
    <StockContext.Provider value={{ stockEntries, updateStockQuantity, fetchStock }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStock deve ser usado dentro de um StockProvider');
  return context;
};
