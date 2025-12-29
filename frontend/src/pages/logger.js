import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiEdit3, FiArrowLeft, FiSettings, FiX,
  FiMoreHorizontal, FiCalendar, FiType, FiHash, FiCheckSquare, FiAlertTriangle
} from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- API Helpers ---

const fetchCategories = async () => {
  const res = await fetch('/api/logger_categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

const createCategory = async (data) => {
  const res = await fetch('/api/logger_categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
};

const updateCategory = async (id, data) => {
  const res = await fetch(`/api/logger_categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
};

const deleteCategory = async (id) => {
  const res = await fetch(`/api/logger_categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
};

const fetchEntries = async () => {
    // Ideally this would accept a query param to filter by category
    const res = await fetch('/api/logger_entries');
    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
};

const createEntry = async (data) => {
  const res = await fetch('/api/logger_entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create entry');
  return res.json();
};

const updateEntry = async (id, data) => {
  const res = await fetch(`/api/logger_entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
};

const deleteEntry = async (id) => {
  const res = await fetch(`/api/logger_entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
};


// --- Components ---

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-red-500 transition-colors">
                        <FiX className="w-6 h-6" /> 
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Page Component ---

export default function LoggerPage() {
    const [categories, setCategories] = useState([]);
    const [entries, setEntries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [isCreateCatModalOpen, setIsCreateCatModalOpen] = useState(false);
    const [isConfigColumnsModalOpen, setIsConfigColumnsModalOpen] = useState(false);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

    // Form state
    const [currentEntry, setCurrentEntry] = useState(null); // For editing
    
    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [cats, ents] = await Promise.all([fetchCategories(), fetchEntries()]);
            setCategories(cats);
            setEntries(ents);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Computed ---
    const activeEntries = selectedCategory 
        ? entries.filter(e => e.category_id === selectedCategory.id).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
        : [];

    // --- Actions ---

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newCat = {
            title: formData.get('title'),
            description: formData.get('description'),
            schema_definition: [] // Empty schema initially
        };
        try {
            const saved = await createCategory(newCat);
            setCategories([...categories, saved]);
            setIsCreateCatModalOpen(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteCategory = async (id, e) => {
        e.stopPropagation();
        if(!confirm("Delete this log category? All entries will be hidden/deleted.")) return;
        try {
            await deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            // Cleanup local entries for this category
            setEntries(entries.filter(e => e.category_id !== id));
        } catch(err) {
            alert(err.message);
        }
    };

    const handleSaveColumns = async (newSchema) => {
        try {
            const updatedCat = { ...selectedCategory, schema_definition: newSchema };
            const saved = await updateCategory(selectedCategory.id, updatedCat);
            setCategories(categories.map(c => c.id === saved.id ? saved : c));
            setSelectedCategory(saved);
            setIsConfigColumnsModalOpen(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSaveEntry = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const dataPayload = {};
        selectedCategory.schema_definition.forEach(col => {
            const val = formData.get(col.id);
            if (col.type === 'number') {
                dataPayload[col.id] = val ? parseFloat(val) : null;
            } else if (col.type === 'checkbox') {
                dataPayload[col.id] = formData.get(col.id) === 'on';
            } else {
                dataPayload[col.id] = val;
            }
        });

        const loggedAt = formData.get('logged_at') ? new Date(formData.get('logged_at')).toISOString() : new Date().toISOString();

        const entryPayload = {
            category_id: selectedCategory.id,
            data: dataPayload,
            logged_at: loggedAt
        };

        try {
            if (currentEntry) {
                // Update
                const saved = await updateEntry(currentEntry.id, entryPayload);
                setEntries(entries.map(e => e.id === saved.id ? saved : e));
            } else {
                // Create
                const saved = await createEntry(entryPayload);
                setEntries([...entries, saved]);
            }
            setIsEntryModalOpen(false);
            setCurrentEntry(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteEntry = async (id) => {
        if(!confirm("Delete this entry?")) return;
        try {
            await deleteEntry(id);
            setEntries(entries.filter(e => e.id !== id));
        } catch(err) {
            alert(err.message);
        }
    };

    // --- Sub-Components for Modals ---

    const ColumnEditor = ({ schema, onSave }) => {
        const [cols, setCols] = useState(schema || []);
        
        const addCol = () => {
            setCols([...cols, { id: crypto.randomUUID(), name: 'New Column', type: 'text' }]);
        };

        const removeCol = (id) => {
            if(!confirm("Deleting this column will delete the data associated with it for all existing logs!")) return;
            setCols(cols.filter(c => c.id !== id));
        };

        const updateCol = (id, field, val) => {
            setCols(cols.map(c => c.id === id ? { ...c, [field]: val } : c));
        };

        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    {cols.map((col, idx) => (
                        <div key={col.id} className="flex gap-2 items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                            <div className="bg-zinc-800 p-2 rounded text-zinc-400">
                                {col.type === 'number' && <FiHash />}
                                {col.type === 'text' && <FiType />}
                                {col.type === 'date' && <FiCalendar />}
                                {col.type === 'checkbox' && <FiCheckSquare />}
                            </div>
                            <input 
                                className="bg-transparent border-b border-zinc-700 focus:border-indigo-500 outline-none text-zinc-200 px-1 py-0.5 flex-1"
                                value={col.name}
                                onChange={(e) => updateCol(col.id, 'name', e.target.value)}
                                placeholder="Column Name"
                            />
                            <select
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                                value={col.type}
                                onChange={(e) => updateCol(col.id, 'type', e.target.value)}
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="checkbox">Checkbox</option>
                            </select>
                            <button onClick={() => removeCol(col.id)} className="text-zinc-500 hover:text-red-400 p-1">
                                <FiTrash2 />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={addCol} className="w-full py-2 border border-dashed border-zinc-700 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <FiPlus /> Add Column
                </button>
                <div className="flex justify-end pt-4">
                    <button onClick={() => onSave(cols)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Save Changes
                    </button>
                </div>
            </div>
        );
    };

    // --- Render ---

    if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;

    // View: Detail (Table)
    if (selectedCategory) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
                {/* Header */}
                <header className="h-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur fixed top-0 w-full z-10 flex items-center justify-between px-6 lg:px-12">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedCategory(null)} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
                        >
                            <FiArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">{selectedCategory.title}</h1>
                            <p className="text-xs text-zinc-500">{selectedCategory.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsConfigColumnsModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <FiSettings className="w-4 h-4" /> Configure Columns
                        </button>
                        <button 
                            onClick={() => { setCurrentEntry(null); setIsEntryModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <FiPlus className="w-4 h-4" /> Log Entry
                        </button>
                    </div>
                </header>

                <main className="pt-24 pb-12 px-6 lg:px-12 overflow-x-auto">
                    {selectedCategory.schema_definition.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 gap-4">
                            <FiAlertTriangle className="w-12 h-12 opacity-50" />
                            <p>No columns configured yet.</p>
                            <button 
                                onClick={() => setIsConfigColumnsModalOpen(true)}
                                className="text-indigo-400 hover:underline"
                            >
                                Setup your logger columns
                            </button>
                        </div>
                    ) : (
                        <div className="min-w-full inline-block align-middle">
                            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                                <table className="min-w-full divide-y divide-zinc-800">
                                    <thead className="bg-zinc-900/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            {selectedCategory.schema_definition.map(col => (
                                                <th key={col.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    {col.name}
                                                </th>
                                            ))}
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-zinc-950 divide-y divide-zinc-800">
                                        {activeEntries.length === 0 ? (
                                             <tr>
                                                <td colSpan={selectedCategory.schema_definition.length + 2} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                                    No entries yet.
                                                </td>
                                             </tr>
                                        ) : (
                                            activeEntries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-zinc-900/30 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                                        {new Date(entry.logged_at).toLocaleString()}
                                                    </td>
                                                    {selectedCategory.schema_definition.map(col => {
                                                        const val = entry.data[col.id];
                                                        return (
                                                            <td key={col.id} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                                                {col.type === 'checkbox' ? (
                                                                    val ? <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs">Yes</span> : <span className="text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded text-xs">No</span>
                                                                ) : col.type === 'date' ? (
                                                                    val ? new Date(val).toLocaleDateString() : '-'
                                                                ) : (
                                                                    val
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setCurrentEntry(entry); setIsEntryModalOpen(true); }}
                                                            className="text-zinc-400 hover:text-indigo-400 mr-3"
                                                        >
                                                            <FiEdit3 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                            className="text-zinc-400 hover:text-red-400"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>

                {/* Modals for Detail View */}
                <Modal 
                    isOpen={isConfigColumnsModalOpen} 
                    onClose={() => setIsConfigColumnsModalOpen(false)}
                    title="Configure Columns"
                >
                    <ColumnEditor schema={selectedCategory.schema_definition} onSave={handleSaveColumns} />
                </Modal>

                <Modal 
                    isOpen={isEntryModalOpen} 
                    onClose={() => setIsEntryModalOpen(false)}
                    title={currentEntry ? "Edit Entry" : "New Log Entry"}
                >
                    <form onSubmit={handleSaveEntry} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Timestamp</label>
                            <input 
                                type="datetime-local" 
                                name="logged_at"
                                defaultValue={currentEntry ? new Date(currentEntry.logged_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {selectedCategory.schema_definition.map(col => (
                            <div key={col.id}>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">{col.name}</label>
                                {col.type === 'checkbox' ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            name={col.id}
                                            defaultChecked={currentEntry?.data[col.id]}
                                            className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-zinc-300">Enabled</span>
                                    </div>
                                ) : (
                                    <input 
                                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'} 
                                        name={col.id}
                                        step={col.type === 'number' ? 'any' : undefined}
                                        defaultValue={currentEntry?.data[col.id]}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-indigo-500 outline-none"
                                        placeholder={`Enter ${col.name.toLowerCase()}...`}
                                    />
                                )}
                            </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium">
                                Save
                            </button>
                            <button type="button" onClick={() => setIsEntryModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>

            </div>
        );
    }

    // View: Hub (List of Categories)
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
             <header className="h-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur fixed top-0 w-full z-10 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FiHash className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Logger</h1>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Create New Card */}
                    <motion.div
                        onClick={() => setIsCreateCatModalOpen(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-transparent border-2 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer text-zinc-600 hover:text-zinc-400 transition-all"
                    >
                        <FiPlus className="w-10 h-10 mb-2 opacity-50" />
                        <span className="font-medium">New Category</span>
                    </motion.div>

                    {/* Category Cards */}
                    {categories.map(cat => (
                        <motion.div
                            key={cat.id}
                            layoutId={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            whileHover={{ y: -5 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-48 flex flex-col justify-between cursor-pointer group hover:border-zinc-700 relative overflow-hidden"
                        >
                             {/* Delete Button (Visible on Hover) */}
                             <button 
                                onClick={(e) => handleDeleteCategory(cat.id, e)}
                                className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1"
                            >
                                <FiTrash2 />
                            </button>

                            <div>
                                <h3 className="text-xl font-bold text-zinc-100 mb-1">{cat.title}</h3>
                                <p className="text-zinc-500 text-sm line-clamp-2">{cat.description}</p>
                            </div>
                            <div className="flex items-center text-xs font-medium text-zinc-400 group-hover:text-indigo-400 transition-colors">
                                {entries.filter(e => e.category_id === cat.id).length} entries
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Create Category Modal */}
            <Modal
                isOpen={isCreateCatModalOpen}
                onClose={() => setIsCreateCatModalOpen(false)}
                title="Create New Logger Category"
            >
                 <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
                        <input 
                            name="title" 
                            required 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-indigo-500 outline-none" 
                            placeholder="e.g. Daily Gym Stats" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                        <textarea 
                            name="description" 
                            rows="3" 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-indigo-500 outline-none resize-none" 
                            placeholder="What are you tracking?" 
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium">
                            Create
                        </button>
                        <button type="button" onClick={() => setIsCreateCatModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
