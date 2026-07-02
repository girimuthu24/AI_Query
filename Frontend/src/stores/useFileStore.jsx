import { createContext, useContext, useState, useCallback } from 'react';

const FileStoreContext = createContext({ files: [], addFile: () => {}, updateStatus: () => {}, clearAll: () => {} });

export const useFileStore = () => useContext(FileStoreContext);

const STATUS = { PROCESSING: 'Processing', COMPLETED: 'Completed', FAILED: 'Failed' };

export function FileStoreProvider({ children }) {
  const [files, setFiles] = useState([
    { id: '1', name: 'Q2_Revenue_Analysis.xlsx', type: '.xlsx', date: '2025-07-10 09:14', size: '1.2 MB', status: STATUS.COMPLETED, rows: 2847, cols: 12 },
    { id: '2', name: 'Sales_Dashboard_2024.pbix', type: '.pbix', date: '2025-07-10 08:52', size: '3.8 MB', status: STATUS.COMPLETED, rows: null, cols: null },
    { id: '3', name: 'HR_Data_Export.xlsx',       type: '.xlsx', date: '2025-07-09 17:31', size: '654 KB', status: STATUS.FAILED,    rows: null, cols: null },
  ]);

  const addFile = useCallback((file) => {
    const entry = {
      id:     Date.now().toString(),
      name:   file.name,
      type:   '.' + file.name.split('.').pop().toLowerCase(),
      date:   new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ''),
      size:   file.size ? `${(file.size / 1024).toFixed(0)} KB` : '—',
      status: STATUS.PROCESSING,
      rows:   null,
      cols:   null,
    };
    setFiles(prev => [entry, ...prev]);

    // Simulate AI processing completing after 4-7 seconds
    const delay = 4000 + Math.random() * 3000;
    const succeed = Math.random() > 0.15; // 85% success rate
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === entry.id
        ? { ...f, status: succeed ? STATUS.COMPLETED : STATUS.FAILED, rows: succeed ? Math.floor(Math.random() * 5000 + 500) : null, cols: succeed ? Math.floor(Math.random() * 15 + 4) : null }
        : f
      ));
    }, delay);

    return entry.id;
  }, []);

  const updateStatus = useCallback((id, status) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  }, []);

  const clearAll = useCallback(() => setFiles([]), []);

  return (
    <FileStoreContext.Provider value={{ files, addFile, updateStatus, clearAll, STATUS }}>
      {children}
    </FileStoreContext.Provider>
  );
}
