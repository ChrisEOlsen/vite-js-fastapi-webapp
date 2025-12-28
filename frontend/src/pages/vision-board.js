import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiEdit3, FiCheck, FiCheckSquare, FiClock
} from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Utility to calculate time remaining
const calculateTimeLeft = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    if (diff < 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    
    if (days > 365) return `${Math.floor(days / 365)} years left`;
    if (days > 30) return `${Math.floor(days / 30)} months left`;
    if (days > 0) return `${days} days left`;
    return `${hours} hours left`;
};

const VisionGoalCard = ({ goal, subgoals, onAddSubgoal, onUpdateSubgoal, onDeleteSubgoal, onToggleSubgoal, onDeleteGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubgoalTitle, setNewSubgoalTitle] = useState('');
  const [editingSubgoalId, setEditingSubgoalId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef(null);

  const timeLeft = calculateTimeLeft(goal.deadline);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newSubgoalTitle.trim()) return;
    onAddSubgoal(goal.id, { title: newSubgoalTitle, is_completed: false, vision_goal_id: goal.id });
    setNewSubgoalTitle('');
    setIsAdding(false);
  };

  const startEditing = (subgoal) => {
    setEditingSubgoalId(subgoal.id);
    setEditTitle(subgoal.title);
  };

  const cancelEditing = () => {
    setEditingSubgoalId(null);
    setEditTitle('');
  };

  const saveEditing = (subgoal) => {
    if (editTitle.trim() !== '' && editTitle !== subgoal.title) {
        onUpdateSubgoal({ ...subgoal, title: editTitle });
    }
    setEditingSubgoalId(null);
  };

  const handleEditKeyDown = (e, subgoal) => {
      if (e.key === 'Enter') {
          saveEditing(subgoal);
      } else if (e.key === 'Escape') {
          cancelEditing();
      }
  };

  useEffect(() => {
      if (editingSubgoalId && editInputRef.current) {
          editInputRef.current.focus();
      }
  }, [editingSubgoalId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[450px] shadow-lg shadow-black/20"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-zinc-100 truncate text-lg">
            {goal.title}
            </h3>
            <button
            onClick={() => onDeleteGoal(goal.id)}
            className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
            title="Delete Goal"
            >
            <FiTrash2 className="w-4 h-4" />
            </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
            <FiClock className="w-3.5 h-3.5 text-indigo-400" />
            <span className={cn(
                timeLeft === "Expired" ? "text-red-400" : "text-zinc-400"
            )}>
                {timeLeft || "No deadline"}
            </span>
        </div>
        {goal.description && (
             <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{goal.description}</p>
        )}
      </div>

      {/* Card Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {subgoals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm opacity-60">
            <FiCheckSquare className="w-8 h-8 mb-2" />
            <p>No sub-goals yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {subgoals.map((subgoal) => (
              <motion.div
                key={subgoal.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className={cn(
                  "group flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                  subgoal.is_completed
                    ? "bg-zinc-900/30 border-transparent opacity-60"
                    : "bg-zinc-800/40 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                )}
              >
                <button
                  onClick={() => onToggleSubgoal(subgoal)}
                  className={cn(
                    "mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all",
                    subgoal.is_completed
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-zinc-600 hover:border-indigo-400"
                  )}
                >
                  {subgoal.is_completed && <FiCheck className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                    {editingSubgoalId === subgoal.id ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveEditing(subgoal)}
                            onKeyDown={(e) => handleEditKeyDown(e, subgoal)}
                            className="w-full bg-zinc-950 text-sm text-zinc-200 border border-indigo-500/50 rounded px-1 py-0.5 focus:outline-none"
                        />
                    ) : (
                        <p className={cn(
                            "text-sm leading-tight transition-all break-words",
                            subgoal.is_completed ? "text-zinc-500 line-through" : "text-zinc-200"
                        )}>
                            {subgoal.title}
                        </p>
                    )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingSubgoalId !== subgoal.id && (
                       <>
                           <button
                            onClick={() => startEditing(subgoal)}
                            className="text-zinc-500 hover:text-indigo-400 p-0.5"
                          >
                            <FiEdit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSubgoal(subgoal.id)}
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
              placeholder="Step name..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              value={newSubgoalTitle}
              onChange={(e) => setNewSubgoalTitle(e.target.value)}
              onBlur={() => !newSubgoalTitle && setIsAdding(false)}
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
            <FiPlus className="w-4 h-4" /> Add Step
          </button>
        )}
      </div>
    </motion.div>
  );
};

const CreateGoalCard = ({ onCreateGoal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Ensure deadline is an ISO string or null
    const formattedDeadline = deadline ? new Date(deadline).toISOString() : null;
    
    onCreateGoal({ title, description, deadline: formattedDeadline });
    setTitle('');
    setDescription('');
    setDeadline('');
    setIsCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl flex flex-col items-center justify-center h-[450px] border-2 border-dashed transition-all",
        isCreating
          ? "bg-zinc-900 border-indigo-500/50"
          : "bg-transparent border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30 cursor-pointer text-zinc-600 hover:text-zinc-400"
      )}
      onClick={() => !isCreating && setIsCreating(true)}
    >
      {isCreating ? (
        <form onSubmit={handleSubmit} className="w-full px-6 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
           <h3 className="text-center font-medium text-zinc-300 mb-2">New Vision Goal</h3>
           
           <input
              autoFocus
              type="text"
              placeholder="Goal Title..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <textarea
              placeholder="Description (optional)..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 text-sm resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 ml-1">Target Deadline</label>
                <input
                type="date"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 text-sm"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                />
            </div>

             <div className="flex gap-2 justify-center mt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1"
              >
                Create Goal
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
          <span className="font-medium">Create New Goal</span>
        </>
      )}
    </motion.div>
  );
}


const VisionBoardPage = () => {
  const [goals, setGoals] = useState([]);
  const [subgoals, setSubgoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, subgoalsRes] = await Promise.all([
          fetch('/api/vision_goals'),
          fetch('/api/vision_subgoals')
        ]);
        
        if (goalsRes.ok && subgoalsRes.ok) {
          const goalsData = await goalsRes.json();
          const subgoalsData = await subgoalsRes.json();
          setGoals(goalsData);
          setSubgoals(subgoalsData);
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

  const handleCreateGoal = async (goalData) => {
    try {
      const res = await fetch('/api/vision_goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals(prev => [...prev, newGoal]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm("Delete this goal and all its steps?")) return;
    
    setGoals(prev => prev.filter(g => g.id !== id));
    setSubgoals(prev => prev.filter(s => s.vision_goal_id !== id));

    try {
      await fetch(`/api/vision_goals/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubgoal = async (goalId, subgoalData) => {
    const tempId = Date.now();
    const optimisticSubgoal = { ...subgoalData, id: tempId };
    setSubgoals(prev => [...prev, optimisticSubgoal]);

    try {
      const res = await fetch('/api/vision_subgoals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subgoalData)
      });
      if (res.ok) {
        const savedSubgoal = await res.json();
        setSubgoals(prev => prev.map(s => s.id === tempId ? savedSubgoal : s));
      } else {
        setSubgoals(prev => prev.filter(s => s.id !== tempId));
      }
    } catch (e) {
      console.error(e);
      setSubgoals(prev => prev.filter(s => s.id !== tempId));
    }
  };

  const handleToggleSubgoal = async (subgoal) => {
    const updated = { ...subgoal, is_completed: !subgoal.is_completed };
    setSubgoals(prev => prev.map(s => s.id === subgoal.id ? updated : s));

    try {
      await fetch(`/api/vision_subgoals/${subgoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
       console.error(e);
       setSubgoals(prev => prev.map(s => s.id === subgoal.id ? subgoal : s)); 
    }
  };

  const handleDeleteSubgoal = async (id) => {
     setSubgoals(prev => prev.filter(s => s.id !== id));
     try {
       await fetch(`/api/vision_subgoals/${id}`, { method: 'DELETE' });
     } catch (e) {
       console.error(e);
     }
  };
  
  const handleUpdateSubgoal = async (subgoal) => {
    setSubgoals(prev => prev.map(s => s.id === subgoal.id ? subgoal : s));

    try {
      await fetch(`/api/vision_subgoals/${subgoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subgoal)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Group Subgoals
  const subgoalsByGoal = {};
  goals.forEach(g => { subgoalsByGoal[g.id] = []; });
  
  subgoals.forEach(sub => {
    if (sub.vision_goal_id && subgoalsByGoal[sub.vision_goal_id]) {
      subgoalsByGoal[sub.vision_goal_id].push(sub);
    }
  });


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <main className="pt-24 pb-12 px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Create New Goal Placeholder */}
          <CreateGoalCard onCreateGoal={handleCreateGoal} />

          {/* Goal Cards */}
          {goals.map(goal => (
            <VisionGoalCard
              key={goal.id}
              goal={goal}
              subgoals={subgoalsByGoal[goal.id] || []}
              onAddSubgoal={handleAddSubgoal}
              onToggleSubgoal={handleToggleSubgoal}
              onDeleteSubgoal={handleDeleteSubgoal}
              onUpdateSubgoal={handleUpdateSubgoal}
              onDeleteGoal={handleDeleteGoal}
            />
          ))}

        </div>
      </main>
    </div>
  );
};

export default VisionBoardPage;
