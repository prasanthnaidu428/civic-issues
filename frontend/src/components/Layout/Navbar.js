import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  SunIcon, 
  MoonIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  MapIcon,
  InformationCircleIcon,
  PhoneIcon,
  SignalIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import civicLogo from '../../assets/civic-logo.png';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  // Enhanced navigation items with new pages
  const publicNavigationItems = [
    { name: 'Home', href: '/', icon: HomeIcon, gradient: 'from-blue-500 to-purple-500' },
    { name: 'About Us', href: '/about', icon: InformationCircleIcon, gradient: 'from-green-500 to-teal-500' },
    { name: 'Contact', href: '/contact', icon: PhoneIcon, gradient: 'from-orange-500 to-red-500' },
    { name: 'Status', href: '/status', icon: SignalIcon, gradient: 'from-indigo-500 to-blue-500' },
    { name: 'Updates', href: '/updates', icon: BellIcon, gradient: 'from-yellow-500 to-orange-500' },
  ];

  const navigationItems = isAuthenticated 
    ? isAdmin 
      ? [
          { name: 'Dashboard', href: '/admin', icon: HomeIcon, gradient: 'from-blue-500 to-purple-500' },
          { name: 'All Issues', href: '/admin/issues', icon: ClipboardDocumentListIcon, gradient: 'from-green-500 to-teal-500' },
          { name: 'Map View', href: '/admin/map', icon: MapIcon, gradient: 'from-orange-500 to-red-500' },
          { name: 'Status', href: '/status', icon: SignalIcon, gradient: 'from-indigo-500 to-blue-500' },
        ]
      : [
          { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, gradient: 'from-blue-500 to-purple-500' },
          { name: 'Report Issue', href: '/report-issue', icon: PlusCircleIcon, gradient: 'from-green-500 to-teal-500' },
          { name: 'My Issues', href: '/my-issues', icon: ClipboardDocumentListIcon, gradient: 'from-orange-500 to-red-500' },
        ]
    : publicNavigationItems;

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-xl' 
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      {/* Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Enhanced Logo - Left Aligned with 1cm gap */}
          <Link to="/" className="flex items-center space-x-4 group" style={{ marginLeft: '1cm' }}>
            {/* Animated Circular Logo */}
            <motion.div
              className="relative w-16 h-16 flex items-center justify-center"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Outer rotating ring with gradient */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                  padding: '3px',
                }}
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full"></div>
              </motion.div>

              {/* Middle pulsing glow */}
              <motion.div
                className="absolute inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-md"
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Logo image in center */}
              <motion.img 
                src={civicLogo} 
                alt="Civic Issues Logo" 
                className="w-12 h-12 rounded-full object-cover relative z-10 shadow-2xl"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              {/* Inner rotating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((i * Math.PI * 2) / 8) * 28],
                    y: [0, Math.sin((i * Math.PI * 2) / 8) * 28],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: "easeInOut"
                  }}
                />
              ))}

              {/* Orbiting dots */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -360 }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2 shadow-lg shadow-blue-500/50"></div>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full -translate-x-1/2 shadow-lg shadow-purple-500/50"></div>
              </motion.div>
            </motion.div>

            {/* CIVIC ISSUES Text */}
            <motion.span 
              className="text-2xl md:text-3xl font-extrabold tracking-wide bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            >
              CIVIC ISSUES
            </motion.span>
          </Link>

          {/* Enhanced Desktop Navigation (centered) */}
          <div className="hidden lg:flex items-center space-x-1 mx-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    to={item.href}
                    className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:text-white dark:text-gray-300 dark:hover:text-white hover:scale-105'
                    }`}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} transition-all duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'
                    }`}></div>
                    
                    {/* Icon */}
                    <motion.div
                      className="relative z-10"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    
                    {/* Text */}
                    <span className="relative z-10">{item.name}</span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-white rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        layoutId="activeIndicator"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Compact Navigation for Medium Screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            {navigationItems.slice(0, 4).map((item, index) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.href}
                    className={`relative p-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800'
                    }`}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-blue-600 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        layoutId="compactActiveIndicator"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* ALL RIGHT SIDE ITEMS IN HORIZONTAL SEQUENCE (right-aligned) */}
          <div className="flex items-center space-x-3 ml-auto">
            {/* For non-authenticated users: AI Demo + Theme + Sign In + Get Started */}
            {!isAuthenticated ? (
              <>
                {/* Theme Toggle */}
                <motion.button
                  onClick={toggleTheme}
                  className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait">
                    {theme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SunIcon className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MoonIcon className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Sign In Button - Visible on all screens */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Link
                    to="/login-user"
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline sm:inline">Sign In</span>
                  </Link>
                </motion.div>

                {/* Get Started Button - Hidden on mobile, visible on tablet+ */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="hidden sm:block"
                >
                  <Link
                    to="/signup-user"
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-lg text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Get Started</span>
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                {/* Theme Toggle for authenticated users */}
                <motion.button
                  onClick={toggleTheme}
                  className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait">
                    {theme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SunIcon className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MoonIcon className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* User Profile Menu */}
                <div className="relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                    }}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className="relative w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="text-white text-sm font-bold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    </motion.div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        <span>{user?.role}</span>
                      </p>
                    </div>
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {user?.role}
                            </span>
                          </div>
                        </div>
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <UserCircleIcon className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Cog6ToothIcon className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Enhanced Mobile menu button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Bars3Icon className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 mb-2 ${
                        isActive
                          ? 'text-white shadow-lg'
                          : 'text-gray-700 hover:text-white dark:text-gray-300 dark:hover:text-white'
                      }`}
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} transition-all duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'
                      }`}></div>
                      
                      {/* Icon */}
                      <Icon className="w-5 h-5 relative z-10" />
                      
                      {/* Text */}
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
              
              {!isAuthenticated && (
                <motion.div
                  className="pt-6 pb-2 border-t border-gray-200 dark:border-gray-700 space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: navigationItems.length * 0.1 }}
                >
                  <Link
                    to="/login-user"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup-user"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menus - Behind navbar (z-40) but above page content */}
      {(isMobileMenuOpen || isProfileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          style={{ top: '80px' }}
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsProfileMenuOpen(false);
          }}
        />
      )}
    </motion.nav>
  );
};

export default Navbar;