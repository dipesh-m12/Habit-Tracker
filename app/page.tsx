"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Head from "next/head";

// Type definitions
interface Habit {
  id: number;
  name: string;
  goal: number;
  value: number;
  streak: number;
  unit: string;
  color: string;
  icon: string;
  history: { date: string; value: number }[];
}

interface Reminder {
  id: number;
  habitId: number;
  time: string;
  active: boolean;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

// Mock weekly data for charts
const getInitialHistory = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay() || 7; // Convert Sunday from 0 to 7

  return days.map((day, index) => {
    // Generate random historical data for days before today
    const value = index < today - 1 ? Math.random() * 10 : 0;
    return { date: day, value: Number.parseFloat(value.toFixed(1)) };
  });
};

// Initial habits with more detailed data
const initialHabits: Habit[] = [
  {
    id: 1,
    name: "Sleep",
    goal: 8,
    value: 0,
    streak: 3,
    unit: "hours",
    color: "#8B5CF6", // Purple
    icon: "🌙",
    history: getInitialHistory(),
  },
  {
    id: 2,
    name: "Water",
    goal: 2.5,
    value: 0,
    streak: 5,
    unit: "liters",
    color: "#3B82F6", // Blue
    icon: "💧",
    history: getInitialHistory(),
  },
  {
    id: 3,
    name: "Exercise",
    goal: 1,
    value: 0,
    streak: 2,
    unit: "hours",
    color: "#EF4444", // Red
    icon: "🏃",
    history: getInitialHistory(),
  },
  {
    id: 4,
    name: "Meditation",
    goal: 0.5,
    value: 0,
    streak: 7,
    unit: "hours",
    color: "#10B981", // Green
    icon: "🧘",
    history: getInitialHistory(),
  },
  {
    id: 5,
    name: "Reading",
    goal: 1,
    value: 0,
    streak: 1,
    unit: "hours",
    color: "#F59E0B", // Amber
    icon: "📚",
    history: getInitialHistory(),
  },
  {
    id: 6,
    name: "Screen Time",
    goal: 2,
    value: 0,
    streak: 0,
    unit: "hours",
    color: "#6B7280", // Gray
    icon: "📱",
    history: getInitialHistory(),
  },
];

// Initial reminders
const initialReminders: Reminder[] = [
  { id: 1, habitId: 1, time: "22:00", active: true },
  { id: 2, habitId: 2, time: "09:00", active: true },
  { id: 3, habitId: 2, time: "13:00", active: true },
  { id: 4, habitId: 2, time: "17:00", active: true },
  { id: 5, habitId: 3, time: "18:00", active: true },
  { id: 6, habitId: 4, time: "07:00", active: true },
];

// Initial achievements
const initialAchievements: Achievement[] = [
  {
    id: 1,
    title: "Early Bird",
    description: "Wake up before 7 AM for 5 consecutive days",
    unlocked: true,
    icon: "🌅",
  },
  {
    id: 2,
    title: "Hydration Master",
    description: "Drink 3 liters of water for 7 consecutive days",
    unlocked: false,
    icon: "🌊",
  },
  {
    id: 3,
    title: "Fitness Enthusiast",
    description: "Exercise for at least 1 hour for 10 consecutive days",
    unlocked: false,
    icon: "💪",
  },
  {
    id: 4,
    title: "Zen Master",
    description: "Meditate for 30 minutes for 14 consecutive days",
    unlocked: true,
    icon: "✨",
  },
  {
    id: 5,
    title: "Bookworm",
    description: "Read for at least 1 hour for 5 consecutive days",
    unlocked: false,
    icon: "📖",
  },
  {
    id: 6,
    title: "Digital Detox",
    description: "Keep screen time under 2 hours for 3 consecutive days",
    unlocked: false,
    icon: "🔋",
  },
];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, darkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded-lg shadow-lg ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
      >
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.payload.unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Main component
const HabitTracker = () => {
  // State management
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [achievements, setAchievements] =
    useState<Achievement[]>(initialAchievements);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({
    name: "",
    goal: 1,
    unit: "hours",
    icon: "📊",
  });
  const [currentDay] = useState(
    new Date().toLocaleDateString("en-US", { weekday: "short" })
  );
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  // Update chart width on resize
  useEffect(() => {
    const updateChartWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateChartWidth();
    window.addEventListener("resize", updateChartWidth);

    return () => {
      window.removeEventListener("resize", updateChartWidth);
    };
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem("habits");
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    }

    const savedReminders = localStorage.getItem("reminders");
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }

    const savedAchievements = localStorage.getItem("achievements");
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }

    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
    localStorage.setItem("reminders", JSON.stringify(reminders));
    localStorage.setItem("achievements", JSON.stringify(achievements));
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [habits, reminders, achievements, darkMode]);

  // Handle daily check-in
  const handleCheckIn = (id: number, increment: number) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;

        const newValue = Math.max(
          0,
          Math.min(habit.goal * 2, habit.value + increment)
        );
        const metGoal = newValue >= habit.goal;
        const newStreak = metGoal ? habit.streak + 1 : habit.streak;

        // Find today's index in the history array
        const todayIndex = [
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
          "Sun",
        ].indexOf(currentDay);
        const newHistory = [...habit.history];

        if (todayIndex >= 0) {
          newHistory[todayIndex] = {
            ...newHistory[todayIndex],
            value: newValue,
          };
        }

        // Show notification if goal is met
        if (newValue >= habit.goal && habit.value < habit.goal) {
          setNotificationMessage(`🎉 Goal achieved for ${habit.name}!`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        }

        return {
          ...habit,
          value: newValue,
          streak: newStreak,
          history: newHistory,
        };
      })
    );
  };

  // Update goal in settings
  const updateGoal = (id: number, goal: number) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === id ? { ...habit, goal } : habit))
    );
  };

  // Reset all habits
  const resetHabits = () => {
    if (
      confirm(
        "Are you sure you want to reset all habits? This cannot be undone."
      )
    ) {
      setHabits(initialHabits);
      localStorage.setItem("habits", JSON.stringify(initialHabits));
      setNotificationMessage("All habits have been reset");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  // Toggle reminder status
  const toggleReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id
          ? { ...reminder, active: !reminder.active }
          : reminder
      )
    );
  };

  // Add new habit
  const addHabit = () => {
    if (!newHabit.name.trim()) {
      setNotificationMessage("Please enter a habit name");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    const colors = [
      "#8B5CF6",
      "#3B82F6",
      "#EF4444",
      "#10B981",
      "#F59E0B",
      "#6B7280",
    ];
    const newId = Math.max(...habits.map((h) => h.id)) + 1;

    const habit: Habit = {
      id: newId,
      name: newHabit.name,
      goal: newHabit.goal,
      value: 0,
      streak: 0,
      unit: newHabit.unit,
      color: colors[Math.floor(Math.random() * colors.length)],
      icon: newHabit.icon,
      history: getInitialHistory(),
    };

    setHabits([...habits, habit]);
    setNewHabit({
      name: "",
      goal: 1,
      unit: "hours",
      icon: "📊",
    });
    setIsAddHabitOpen(false);

    setNotificationMessage(`New habit "${habit.name}" added!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Delete habit
  const deleteHabit = (id: number) => {
    if (
      confirm(
        "Are you sure you want to delete this habit? This cannot be undone."
      )
    ) {
      const habitToDelete = habits.find((h) => h.id === id);
      setHabits(habits.filter((habit) => habit.id !== id));
      setReminders(reminders.filter((reminder) => reminder.habitId !== id));

      if (habitToDelete) {
        setNotificationMessage(`Habit "${habitToDelete.name}" deleted`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    }
  };

  // Add reminder
  const addReminder = (habitId: number, time: string) => {
    const newId =
      reminders.length > 0 ? Math.max(...reminders.map((r) => r.id)) + 1 : 1;
    const newReminder = { id: newId, habitId, time, active: true };
    setReminders([...reminders, newReminder]);
  };

  // Delete reminder
  const deleteReminder = (id: number) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id));
  };

  // Get habit details by ID
  const getHabitById = (id: number) => {
    return habits.find((habit) => habit.id === id);
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (habits.length === 0) return 0;

    const totalProgress = habits.reduce((sum, habit) => {
      const percentage = Math.min(100, (habit.value / habit.goal) * 100);
      return sum + percentage;
    }, 0);

    return totalProgress / habits.length;
  };

  // Prepare data for weekly overview chart
  const prepareWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => {
      const data: any = { date: day };
      habits.forEach((habit) => {
        const dayData = habit.history.find((h) => h.date === day);
        data[habit.name] = dayData ? dayData.value : 0;
        data[`${habit.name}Goal`] = habit.goal;
        data.unit = habit.unit;
      });
      return data;
    });
  };

  // Prepare data for streak chart
  const prepareStreakData = () => {
    return habits.map((habit) => ({
      name: habit.name,
      streak: habit.streak,
      color: habit.color,
      icon: habit.icon,
    }));
  };

  // Get today's progress percentage
  const getTodayProgress = (habit: Habit) => {
    return Math.min(100, (habit.value / habit.goal) * 100);
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(Number.parseInt(hours, 10));
    date.setMinutes(Number.parseInt(minutes, 10));

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get habit reminders
  const getHabitReminders = (habitId: number) => {
    return reminders.filter((reminder) => reminder.habitId === habitId);
  };

  // Calculate achievement progress
  const calculateAchievementProgress = () => {
    const unlocked = achievements.filter((a) => a.unlocked).length;
    return (unlocked / achievements.length) * 100;
  };

  // Prepare data for habit distribution chart
  const prepareDistributionData = () => {
    return habits.map((habit) => ({
      name: habit.name,
      value: habit.value,
      goal: habit.goal,
      color: habit.color,
      icon: habit.icon,
    }));
  };

  // Get today's date in a nice format
  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } font-sans transition-colors duration-300`}
    >
      <Head>
        <title>Habit Tracker | Personal Analytics</title>
        <meta
          name="description"
          content="Track your daily habits and personal stats"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navbar */}
      <nav
        className={`sticky top-0 ${
          darkMode ? "bg-gray-800" : "bg-white"
        } shadow-md z-50`}
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-2">📊</span>
            <h1 className="text-xl font-bold hidden sm:block">Habit Tracker</h1>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "dashboard"
                  ? darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              } transition-colors`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "analytics"
                  ? darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              } transition-colors`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "achievements"
                  ? darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              } transition-colors`}
            >
              Achievements
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsReminderOpen(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Reminders"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } ring-1 ring-black ring-opacity-5 focus:outline-none`}
                >
                  <button
                    onClick={() => {
                      setActiveTab("dashboard");
                      setIsMenuOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      activeTab === "dashboard"
                        ? darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-900"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("analytics");
                      setIsMenuOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      activeTab === "analytics"
                        ? darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-900"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("achievements");
                      setIsMenuOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      activeTab === "achievements"
                        ? darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-900"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Achievements
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Today's Overview */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Today's Overview</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getTodayDate()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddHabitOpen(true)}
                  className={`px-4 py-2 rounded-full text-white font-medium flex items-center ${
                    darkMode
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-indigo-500 hover:bg-indigo-600"
                  } transition-colors`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Add Habit</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-4 rounded-lg shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Overall Progress</h3>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateOverallProgress()}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                      ></motion.div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="text-sm font-medium">
                      {calculateOverallProgress().toFixed(0)}%
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-4 rounded-lg shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Habits Tracked</h3>
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="text-3xl font-bold">{habits.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Active habits
                  </p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-4 rounded-lg shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Best Streak</h3>
                    <span className="text-2xl">🔥</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {Math.max(...habits.map((h) => h.streak))} days
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {habits.find(
                      (h) =>
                        h.streak === Math.max(...habits.map((h) => h.streak))
                    )?.name || "No streaks yet"}
                  </p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-4 rounded-lg shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Achievements</h3>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {achievements.filter((a) => a.unlocked).length}/
                    {achievements.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Unlocked
                  </p>
                </motion.div>
              </div>

              {/* Habits Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {habits.map((habit) => (
                  <motion.div
                    key={habit.id}
                    variants={itemVariants}
                    className={`${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } p-6 rounded-lg shadow-md relative overflow-hidden`}
                    style={{ borderTop: `4px solid ${habit.color}` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{habit.icon}</span>
                          <h3 className="text-xl font-semibold">
                            {habit.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Goal: {habit.goal} {habit.unit}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-1">
                            {habit.value}/{habit.goal} {habit.unit}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">
                            Streak:
                          </span>
                          <span className="text-sm font-medium">
                            {habit.streak} days
                          </span>
                          {habit.streak > 0 && <span className="ml-1">🔥</span>}
                        </div>
                      </div>
                    </div>

                    <div className="relative pt-1 mb-4">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${getTodayProgress(habit)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ backgroundColor: habit.color }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                        ></motion.div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCheckIn(habit.id, 0.5)}
                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition text-sm font-medium"
                      >
                        +0.5
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCheckIn(habit.id, 1)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition text-sm font-medium"
                      >
                        +1
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCheckIn(habit.id, -0.5)}
                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition text-sm font-medium"
                      >
                        -0.5
                      </motion.button>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => {
                          setSelectedHabit(habit);
                          setIsReminderOpen(true);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
                      >
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Reminders
                        </span>
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition"
                      >
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Weekly Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Weekly Overview</h2>
              <div
                ref={chartContainerRef}
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } p-4 rounded-lg shadow-md`}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareWeeklyData()}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#4B5563" : "#E5E7EB"}
                    />
                    <XAxis dataKey="date" stroke={darkMode ? "#fff" : "#000"} />
                    <YAxis stroke={darkMode ? "#fff" : "#000"} />
                    <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                    <Legend />
                    {habits.map((habit) => (
                      <Bar
                        key={habit.id}
                        dataKey={habit.name}
                        name={habit.name}
                        fill={habit.color}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Streak Comparison */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } p-4 rounded-lg shadow-md`}
              >
                <h3 className="text-xl font-semibold mb-4">
                  Streak Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareStreakData()}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#4B5563" : "#E5E7EB"}
                    />
                    <XAxis dataKey="name" stroke={darkMode ? "#fff" : "#000"} />
                    <YAxis stroke={darkMode ? "#fff" : "#000"} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1F2937" : "#fff",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    />
                    <Bar
                      dataKey="streak"
                      name="Current Streak (days)"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    >
                      {prepareStreakData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Habit Distribution */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } p-4 rounded-lg shadow-md`}
              >
                <h3 className="text-xl font-semibold mb-4">
                  Habit Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {prepareDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1F2937" : "#fff",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg shadow-md mb-8`}
            >
              <h3 className="text-xl font-semibold mb-4">Detailed Analytics</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Habit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Goal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Streak
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {habits.map((habit) => (
                      <tr key={habit.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{habit.icon}</span>
                            <span className="font-medium">{habit.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {habit.value} {habit.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {habit.goal} {habit.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full"
                              style={{
                                width: `${getTodayProgress(habit)}%`,
                                backgroundColor: habit.color,
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {habit.streak} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>

            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-4 rounded-lg shadow-md mb-8`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Your Progress</h3>
                <span className="text-sm font-medium">
                  {achievements.filter((a) => a.unlocked).length}/
                  {achievements.length} Unlocked
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div
                  className="h-2.5 rounded-full bg-purple-600"
                  style={{ width: `${calculateAchievementProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } p-6 rounded-lg shadow-md ${
                    achievement.unlocked ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{achievement.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        achievement.unlocked
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {achievement.unlocked ? "Unlocked" : "Locked"}
                    </span>
                    {achievement.unlocked && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`${
          darkMode ? "bg-gray-800" : "bg-gray-900"
        } text-white py-8 mt-12`}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Habit Tracker</h3>
              <p className="text-sm text-gray-400">
                Track your daily habits and personal stats to improve your life
                one day at a time.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    Analytics
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("achievements")}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    Achievements
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    Settings
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-sm text-gray-400 mb-4">
                This app helps you build better habits through daily tracking
                and insightful analytics.
              </p>
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Habit Tracker. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Appearance</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <span className="text-sm font-medium">Dark Mode</span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                      darkMode ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                        darkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Habit Goals</h3>
                {habits.map((habit) => (
                  <div key={habit.id} className="mb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">{habit.icon}</span>
                      <label className="text-sm font-medium">
                        {habit.name} Goal
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="0"
                        max={
                          habit.name === "Water"
                            ? 5
                            : habit.name === "Sleep"
                            ? 12
                            : habit.name === "Screen Time"
                            ? 8
                            : 5
                        }
                        step="0.5"
                        value={habit.goal}
                        onChange={(e) =>
                          updateGoal(
                            habit.id,
                            Number.parseFloat(e.target.value)
                          )
                        }
                        className="w-full mr-3"
                      />
                      <span className="text-sm font-medium min-w-[60px]">
                        {habit.goal} {habit.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetHabits}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-medium"
                >
                  Reset All Habits
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminders Modal */}
      <AnimatePresence>
        {isReminderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg max-w-md w-full`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Reminders</h2>
                <button
                  onClick={() => {
                    setIsReminderOpen(false);
                    setSelectedHabit(null);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {selectedHabit ? (
                <div>
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">{selectedHabit.icon}</span>
                    <h3 className="text-lg font-semibold">
                      {selectedHabit.name} Reminders
                    </h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    {getHabitReminders(selectedHabit.id).map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700"
                      >
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            {formatTime(reminder.time)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleReminder(reminder.id)}
                            className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors mr-2 ${
                              reminder.active
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block w-3 h-3 transform transition-transform bg-white rounded-full ${
                                reminder.active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="p-1 rounded-full hover:bg-red-100 text-red-500 transition"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">
                      Add New Reminder
                    </h4>
                    <div className="flex items-center">
                      <input
                        type="time"
                        className={`flex-1 rounded-lg border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-white border-gray-300"
                        } px-3 py-2 mr-2`}
                        onChange={(e) => {
                          if (e.target.value && selectedHabit) {
                            addReminder(selectedHabit.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const timeInput = document.querySelector(
                            'input[type="time"]'
                          ) as HTMLInputElement;
                          if (timeInput.value && selectedHabit) {
                            addReminder(selectedHabit.id, timeInput.value);
                            timeInput.value = "";
                          }
                        }}
                        className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
                    Select a habit to manage its reminders
                  </p>
                  <div className="space-y-2">
                    {habits.map((habit) => (
                      <button
                        key={habit.id}
                        onClick={() => setSelectedHabit(habit)}
                        className={`w-full flex items-center p-3 rounded-lg ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        } transition`}
                      >
                        <span className="text-xl mr-2">{habit.icon}</span>
                        <span className="font-medium">{habit.name}</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {getHabitReminders(habit.id).length} reminders
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsReminderOpen(false);
                  setSelectedHabit(null);
                }}
                className="w-full mt-6 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddHabitOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg max-w-md w-full`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Habit</h2>
                <button
                  onClick={() => setIsAddHabitOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) =>
                      setNewHabit({ ...newHabit, name: e.target.value })
                    }
                    className={`w-full rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    } px-3 py-2`}
                    placeholder="e.g., Reading, Jogging, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Goal</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={newHabit.goal}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          goal: Number.parseFloat(e.target.value) || 1,
                        })
                      }
                      className={`w-full rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-300"
                      } px-3 py-2 mr-2`}
                    />
                    <select
                      value={newHabit.unit}
                      onChange={(e) =>
                        setNewHabit({ ...newHabit, unit: e.target.value })
                      }
                      className={`rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-300"
                      } px-3 py-2`}
                    >
                      <option value="hours">hours</option>
                      <option value="liters">liters</option>
                      <option value="times">times</option>
                      <option value="pages">pages</option>
                      <option value="steps">steps</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      "📊",
                      "🏃",
                      "💧",
                      "🌙",
                      "📚",
                      "🧘",
                      "🏋️",
                      "🍎",
                      "📱",
                      "🎯",
                      "🧠",
                      "✍️",
                    ].map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewHabit({ ...newHabit, icon })}
                        className={`p-2 text-xl rounded-lg ${
                          newHabit.icon === icon
                            ? "bg-indigo-100 dark:bg-indigo-900"
                            : darkMode
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addHabit}
                  className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition font-medium"
                >
                  Add Habit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddHabitOpen(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements Modal */}
      <AnimatePresence>
        {isAchievementOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Achievements</h2>
                <button
                  onClick={() => setIsAchievementOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg ${
                      achievement.unlocked
                        ? darkMode
                          ? "bg-indigo-900 bg-opacity-20"
                          : "bg-indigo-50"
                        : darkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-3xl mr-3">{achievement.icon}</span>
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          achievement.unlocked
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {achievement.unlocked ? "Unlocked" : "Locked"}
                      </span>
                      {achievement.unlocked && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAchievementOpen(false)}
                className="w-full mt-6 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitTracker;
