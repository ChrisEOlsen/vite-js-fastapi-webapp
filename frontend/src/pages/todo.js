import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiEdit3, FiCheck, FiCheckSquare
} from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TodoListCard = ({ list, todos, onAddTodo, onUpdateTodo, onDeleteTodo, onToggleComplete, onDeleteList }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef(null);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    onAddTodo(list ? list.id : null, { title: newTodoTitle });
    setNewTodoTitle('');
    setIsAdding(false);
  };

  const startEditing = (todo) => {
    setEditingTodoId(todo.id);
    setEditTitle(todo.title);
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditTitle('');
  };

  const saveEditing = (todo) => {
    if (editTitle.trim() !== '' && editTitle !== todo.title) {
        onUpdateTodo({ ...todo, title: editTitle });
    }
    setEditingTodoId(null);
  };

  const handleEditKeyDown = (e, todo) => {
      if (e.key === 'Enter') {
          saveEditing(todo);
      } else if (e.key === 'Escape') {
          cancelEditing();
      }
  };

  useEffect(() => {
      if (editingTodoId && editInputRef.current) {
          editInputRef.current.focus();
      }
  }, [editingTodoId]);


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[400px] shadow-lg shadow-black/20"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-100 truncate">
          {list ? list.title : "Inbox"}
        </h3>
        {list && (
           <button
           onClick={() => onDeleteList(list.id)}
           className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
           title="Delete List"
         >
           <FiTrash2 className="w-4 h-4" />
         </button>
        )}
      </div>

      {/* Card Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm opacity-60">
            <FiCheckSquare className="w-8 h-8 mb-2" />
            <p>No tasks yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className={cn(
                  "group flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                  todo.completed
                    ? "bg-zinc-900/30 border-transparent opacity-60"
                    : "bg-zinc-800/40 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                )}
              >
                <button
                  onClick={() => onToggleComplete(todo)}
                  className={cn(
                    "mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all",
                    todo.completed
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-zinc-600 hover:border-indigo-400"
                  )}
                >
                  {todo.completed && <FiCheck className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                    {editingTodoId === todo.id ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveEditing(todo)}
                            onKeyDown={(e) => handleEditKeyDown(e, todo)}
                            className="w-full bg-zinc-950 text-sm text-zinc-200 border border-indigo-500/50 rounded px-1 py-0.5 focus:outline-none"
                        />
                    ) : (
                        <p className={cn(
                            "text-sm leading-tight transition-all break-words",
                            todo.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                        )}>
                            {todo.title}
                        </p>
                    )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingTodoId !== todo.id && (
                       <>
                           <button
                            onClick={() => startEditing(todo)}
                            className="text-zinc-500 hover:text-indigo-400 p-0.5"
                          >
                            <FiEdit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTodo(todo.id)}
                            className="text-zinc-500 hover:text-red-400 p-0.5"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                       </>
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Card Footer - Add Task */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Task name..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onBlur={() => !newTodoTitle && setIsAdding(false)}
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-md"
            >
              <FiCheck className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-sm text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 transition-colors border border-dashed border-zinc-800 hover:border-zinc-700"
          >
            <FiPlus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>
    </motion.div>
  );
};

const CreateListCard = ({ onCreateList }) => {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateList(title);
    setTitle('');
    setIsCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl flex flex-col items-center justify-center h-[400px] border-2 border-dashed transition-all",
        isCreating
          ? "bg-zinc-900 border-indigo-500/50"
          : "bg-transparent border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30 cursor-pointer text-zinc-600 hover:text-zinc-400"
      )}
      onClick={() => !isCreating && setIsCreating(true)}
    >
      {isCreating ? (
        <form onSubmit={handleSubmit} className="w-full px-6" onClick={(e) => e.stopPropagation()}>
           <h3 className="text-center font-medium text-zinc-300 mb-4">New List</h3>
           <input
              autoFocus
              type="text"
              placeholder="List Title..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-center text-zinc-100 focus:outline-none focus:border-indigo-500 mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !title && setIsCreating(false)}
            />
             <div className="flex gap-2 justify-center">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsCreating(false); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
        </form>
      ) : (
        <>
          <FiPlus className="w-12 h-12 mb-3 opacity-50" />
          <span className="font-medium">Create New List</span>
        </>
      )}
    </motion.div>
  );
}


const TodoPage = () => {
  const [todoItems, setTodoItems] = useState([]);
  const [todoLists, setTodoLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listsRes, itemsRes] = await Promise.all([
          fetch('/api/todo_lists'),
          fetch('/api/todo_items')
        ]);
        
        if (listsRes.ok && itemsRes.ok) {
          const listsData = await listsRes.json();
          const itemsData = await itemsRes.json();
          setTodoLists(listsData);
          setTodoItems(itemsData);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Actions ---

  const handleAddTodo = async (listId, todoData) => {
    // Optimistic Update
    const tempId = Date.now();
    const optimisticTodo = { ...todoData, id: tempId, list_id: listId, completed: false };
    setTodoItems(prev => [...prev, optimisticTodo]);

    try {
      const res = await fetch('/api/todo_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todoData, list_id: listId, completed: false })
      });
      if (res.ok) {
        const savedTodo = await res.json();
        // Replace optimistic
        setTodoItems(prev => prev.map(t => t.id === tempId ? savedTodo : t));
      } else {
        // Revert
        setTodoItems(prev => prev.filter(t => t.id !== tempId));
      }
    } catch (e) {
      console.error(e);
      setTodoItems(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const handleToggleComplete = async (todo) => {
    const updated = { ...todo, completed: !todo.completed };
    setTodoItems(prev => prev.map(t => t.id === todo.id ? updated : t));

    try {
      await fetch(`/api/todo_items/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
       console.error(e);
       setTodoItems(prev => prev.map(t => t.id === todo.id ? todo : t)); // Revert
    }
  };

  const handleDeleteTodo = async (id) => {
     setTodoItems(prev => prev.filter(t => t.id !== id));
     try {
       await fetch(`/api/todo_items/${id}`, { method: 'DELETE' });
     } catch (e) {
       console.error(e);
       // Ideally re-fetch or revert here
     }
  };
  
  const handleUpdateTodo = async (todo) => {
    // Optimistic update
    setTodoItems(prev => prev.map(t => t.id === todo.id ? todo : t));

    try {
      await fetch(`/api/todo_items/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      });
    } catch (e) {
      console.error(e);
      // Ideally revert logic would require fetching fresh state or keeping previous state
    }
  };


  const handleCreateList = async (title) => {
    try {
      const res = await fetch('/api/todo_lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const newList = await res.json();
        setTodoLists(prev => [...prev, newList]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteList = async (id) => {
    if (!confirm("Are you sure? This might delete all tasks in this list.")) return;
    
    setTodoLists(prev => prev.filter(l => l.id !== id));
    // Also remove tasks locally for that list
    setTodoItems(prev => prev.filter(t => t.list_id !== id));

    try {
      await fetch(`/api/todo_lists/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  // Group Todos
  const todosByList = {};
  // Initialize buckets for known lists
  todoLists.forEach(l => { todosByList[l.id] = []; });
  todosByList['uncategorized'] = [];

  todoItems.forEach(todo => {
    if (todo.list_id && todosByList[todo.list_id]) {
      todosByList[todo.list_id].push(todo);
    } else {
      todosByList['uncategorized'].push(todo);
    }
  });


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <main className="pt-24 pb-12 px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Uncategorized "Inbox" List */}
          <TodoListCard
            list={null} // Null implies Inbox
            todos={todosByList['uncategorized']}
            onAddTodo={handleAddTodo}
            onToggleComplete={handleToggleComplete}
            onDeleteTodo={handleDeleteTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteList={() => {}} // Cannot delete inbox
          />

          {/* User Lists */}
          {todoLists.map(list => (
            <TodoListCard
              key={list.id}
              list={list}
              todos={todosByList[list.id]}
              onAddTodo={handleAddTodo}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onUpdateTodo={handleUpdateTodo}
              onDeleteList={handleDeleteList}
            />
          ))}

          {/* Create New List Placeholder */}
          <CreateListCard onCreateList={handleCreateList} />
        </div>
      </main>
    </div>
  );
};

export default TodoPage;