import { useState, useEffect } from 'react';
import { getItems, createItem, updateItem, deleteItem } from '../services/itemService';
import './Items.css';

export default function Items() {
  const [items, setItems]       = useState([]);
  const [form, setForm]         = useState({ name: '', description: '' });
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  // Fetch all items on mount
  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getItems();
      setItems(res.data);
    } catch {
      setError('Failed to load items.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await updateItem(editId, form);
        setSuccess('Item updated successfully.');
      } else {
        await createItem(form);
        setSuccess('Item created successfully.');
      }
      setForm({ name: '', description: '' });
      setEditId(null);
      fetchItems();
    } catch {
      setError('Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description });
    setSuccess('');
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteItem(id);
      setSuccess('Item deleted.');
      fetchItems();
    } catch {
      setError('Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="items-container">
      <h1>Items Manager</h1>

      {/* Feedback messages */}
      {success && <p className="msg success">{success}</p>}
      {error   && <p className="msg error">{error}</p>}

      {/* Create / Edit Form */}
      <form className="item-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : editId ? 'Update' : 'Create'}
        </button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }}>
            Cancel
          </button>
        )}
      </form>

      {/* Items List */}
      {loading && !items.length ? (
        <p className="msg">Loading...</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className="item-card">
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button className="delete" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
