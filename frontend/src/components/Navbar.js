import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiChevronDown, FiCheckSquare, FiCalendar, FiHome, FiHash } from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Todo List', href: '/todo', icon: FiCheckSquare },
    { name: 'Vision Board', href: '/vision-board', icon: FiCalendar },
    { name: 'Logger', href: '/logger', icon: FiHash },
  ];

  const currentPath = router.pathname;
  const activeItem = navItems.find(item => item.href === currentPath);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center p-4">
      <div 
        ref={dropdownRef}
        className="pointer-events-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full shadow-xl p-1.5 flex items-center gap-2"
      >
        <Link 
            href="/"
            className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                currentPath === "/" ? "bg-zinc-800 text-indigo-400" : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
            )}
            title="Home"
        >
            <FiHome className="w-4 h-4" />
        </Link>

        <div className="relative">
            <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium text-zinc-200 transition-colors"
            >
            {activeItem ? (
                <>
                <activeItem.icon className="w-4 h-4 text-indigo-400" />
                <span>{activeItem.name}</span>
                </>
            ) : (
                <>
                <FiGrid className="w-4 h-4 text-zinc-400" />
                <span>Apps</span>
                </>
            )}
            <FiChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
            {isOpen && (
                <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1"
                >
                {navItems.map((item) => (
                    <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDropdown}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        currentPath === item.href
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    )}
                    >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    </Link>
                ))}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
