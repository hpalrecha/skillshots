
import React, { useState, useEffect, useCallback } from 'react';
import { Topic, User, Group, TopicStatus, LeaderboardEntry, UserRole } from './types';
import { INITIAL_TOPICS, INITIAL_USERS, INITIAL_GROUPS, INITIAL_CATEGORIES } from './services/dataService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TopicSwiperView from './components/TopicSwiperView';
import CreatorDashboard from './components/CreatorDashboard';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import { MessageSquareIcon, LoaderIcon } from './components/icons';
import { loadData, saveData } from './services/db'; // Import db service

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Persistent State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'swiper' | 'admin'>('dashboard');
  const [initialTopicIndex, setInitialTopicIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Integration State
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Persistence Keys (kept for reference, but using IndexedDB for main data)
  const STORAGE_KEYS = {
      USERS: 'microlearn_users_v2',
      GROUPS: 'microlearn_groups_v2',
      CATEGORIES: 'microlearn_categories_v2'
  };

  useEffect(() => {
    const bootstrap = async () => {
      // Load Data from IndexedDB (falling back to LocalStorage/Mock)
      const storedTopics = await loadData<Topic[]>('topics');
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

      setTopics(storedTopics || INITIAL_TOPICS);
      
      // USER RECOVERY LOGIC
      let parsedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
      
      // Critical Safety: Check if Admin exists. If not, restore them.
      const adminExists = parsedUsers.find(u => u.email === 'alex@example.com');
      if (!adminExists) {
          const defaultAdmin = INITIAL_USERS.find(u => u.email === 'alex@example.com');
          if (defaultAdmin) {
              console.warn("Admin user missing. Restoring default admin.");
              parsedUsers = [...parsedUsers, defaultAdmin];
              // Force update local storage immediately
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsedUsers));
          }
      }
      setUsers(parsedUsers);

      setGroups(storedGroups ? JSON.parse(storedGroups) : INITIAL_GROUPS);
      setCategories(storedCategories ? JSON.parse(storedCategories) : INITIAL_CATEGORIES);

      // Mock Leaderboard (kept static for now)
      setLeaderboard([
        { userId: 'user-3', name: 'Sarah Jenkins', points: 1250, rank: 1 },
        { userId: 'user-1', name: 'Alex Ray', points: 950, rank: 2 },
        { userId: 'user-4', name: 'Mike Chen', points: 800, rank: 3 },
      ]);
      
      // --- INTEGRATION LOGIC ---
      const params = new URLSearchParams(window.location.search);
      
      // 1. Check for Embed Mode (Hides Header)
      if (params.get('embed') === 'true') {
          setIsEmbedded(true);
      }

      // 2. Check for SSO Email (Auto-Login)
      const ssoEmail = params.get('email');
      if (ssoEmail) {
          const matchedUser = parsedUsers.find(u => u.email.toLowerCase() === ssoEmail.toLowerCase());
          if (matchedUser) {
              // Auto-login logic
              const newToken = `mock-token-${matchedUser.id}`;
              localStorage.setItem('authToken', newToken);
              setToken(newToken);
              setCurrentUser(matchedUser);
          }
      }

      setIsLoading(false);
    };
    bootstrap();
  }, []);

  // Persist State Changes
  useEffect(() => { if (topics.length > 0) saveData('topics', topics); }, [topics]);
  useEffect(() => { if (users.length > 0) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { if (groups.length > 0) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups)); }, [groups]);
  useEffect(() => { if (categories.length > 0) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);

  // Handle Token/User Restoration
  useEffect(() => {
      if (token && users.length > 0) {
          const userIdFromToken = token.replace('mock-token-', '');
          const foundUser = users.find(u => u.id === userIdFromToken);
          if (foundUser) {
              setCurrentUser(foundUser);
          } else {
              // Only logout if we are NOT currently trying to SSO via URL in the bootstrap phase
              const params = new URLSearchParams(window.location.search);
              if (!params.get('email')) {
                  handleLogout();
              }
          }
      }
  }, [token, users]);

  const handleLogin = (userId: string) => {
      const newToken = `mock-token-${userId}`;
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      // Current user will be set by the useEffect above
  };
  
  const handleLogout = () => {
      localStorage.removeItem('authToken');
      setToken(null);
      setCurrentUser(null);
      setView('dashboard');
  };

  const handleSelectTopic = (topic: Topic) => {
    const topicIndex = topics.findIndex(t => t.id === topic.id);
    if (topicIndex !== -1) {
      setInitialTopicIndex(topicIndex);
      setView('swiper');
    }
  };

  const handleCloseSwiper = () => {
    setView('dashboard');
  };

  const handleMarkComplete = useCallback((topicId: string) => {
    setTopics(prevTopics =>
      prevTopics.map(t =>
        t.id === topicId ? { ...t, status: TopicStatus.Completed } : t
      )
    );
  }, []);

  // --- Admin Handlers ---

  const handleAddTopic = (newTopic: Topic) => {
    setTopics(prev => [newTopic, ...prev]);
  };

  const handleUpdateTopic = (updatedTopic: Topic) => {
      setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));
  };

  const handleDeleteTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const handleAddUser = (user: User) => {
      setUsers(prev => [...prev, user]);
  };

  // NEW: Update User (for password reset, etc)
  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleDeleteUser = (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleAddGroup = (group: Group) => {
      setGroups(prev => [...prev, group]);
  };

  const handleDeleteGroup = (id: string) => {
      setGroups(prev => prev.filter(g => g.id !== id));
  };
  
  const handleAddCategory = (cat: string) => {
      setCategories(prev => [...prev, cat]);
  };
  
  const handleDeleteCategory = (cat: string) => {
      setCategories(prev => prev.filter(c => c !== cat));
  };

  // --- Render ---

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!token || !currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  // Filter topics for the dashboard
  const userTopics = topics.filter(topic => {
      const isSharedWithGroup = topic.sharedWith.some(groupId => currentUser.groupIds.includes(groupId));
      const isSharedWithUser = topic.sharedWithUsers?.includes(currentUser.id);
      return isSharedWithGroup || isSharedWithUser;
  });

  return (
    <div className={`min-h-screen bg-gray-50 ${isEmbedded ? 'bg-transparent' : ''}`}>
      {!isEmbedded && (
          <Header 
            user={currentUser} 
            onLogout={handleLogout} 
            onAdminClick={() => setView(view === 'admin' ? 'dashboard' : 'admin')} 
          />
      )}
      <main className={`max-w-7xl mx-auto ${isEmbedded ? 'p-0 pt-4' : 'p-4 sm:p-6 md:p-8'}`}>
        {view === 'swiper' ? (
           <TopicSwiperView
            topics={userTopics}
            initialTopicIndex={initialTopicIndex}
            onClose={handleCloseSwiper}
            onMarkComplete={handleMarkComplete}
            groups={groups}
          />
        ) : view === 'admin' && currentUser.role === UserRole.Creator ? (
           <CreatorDashboard 
                topics={topics}
                users={users}
                groups={groups}
                categories={categories}
                onAddTopic={handleAddTopic}
                onUpdateTopic={handleUpdateTopic}
                onDeleteTopic={handleDeleteTopic}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser} // Pass the update handler
                onDeleteUser={handleDeleteUser}
                onAddGroup={handleAddGroup}
                onDeleteGroup={handleDeleteGroup}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
           />
        ) : (
          <Dashboard 
            topics={userTopics} 
            categories={categories}
            onSelectTopic={handleSelectTopic} 
            groups={groups} 
            leaderboard={leaderboard}
            currentUser={currentUser}
          />
        )}
      </main>
       {view === 'dashboard' && (
        <>
            {!isEmbedded && (
                <footer className="text-center py-4 text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} SkillShots. All rights reserved.</p>
                </footer>
            )}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transform transition-transform hover:scale-110"
                aria-label="Open AI Assistant"
            >
                <MessageSquareIcon className="h-6 w-6" />
            </button>
            <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} topics={topics} />
        </>
      )}
    </div>
  );
};

export default App;
