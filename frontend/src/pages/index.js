import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheckSquare, FiCalendar, FiArrowRight, FiHash } from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AppCard = ({ href, title, description, icon: Icon, colorClass }) => {
  return (
    <Link href={href} className="group block">
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 transition-colors hover:border-zinc-700 relative overflow-hidden"
      >
        <div className={cn("absolute top-0 right-0 p-32 opacity-5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-10", colorClass)} />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6", "bg-zinc-800 group-hover:bg-zinc-700 transition-colors")}>
            <Icon className={cn("w-6 h-6", colorClass.replace('bg-', 'text-'))} />
          </div>
          
          <h2 className="text-xl font-bold text-zinc-100 mb-2">{title}</h2>
          <p className="text-zinc-400 text-sm mb-6 flex-grow">{description}</p>
          
          <div className="flex items-center text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
            Open App <FiArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col justify-center items-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent"
          >
            Your Workspace
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Manage your tasks, visualize your goals, and stay organized in one central hub.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AppCard
              href="/todo"
              title="Task Master"
              description="A powerful todo list to keep track of your daily tasks, organize them into lists, and boost your productivity."
              icon={FiCheckSquare}
              colorClass="bg-indigo-500"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AppCard
              href="/vision-board"
              title="Vision Board"
              description="Define your long-term goals, break them down into actionable steps, and track your progress over time."
              icon={FiCalendar}
              colorClass="bg-emerald-500"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AppCard
              href="/logger"
              title="Logger"
              description="Track anything with custom categories and flexible data columns. Perfect for habits, workouts, or daily logs."
              icon={FiHash}
              colorClass="bg-rose-500"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
