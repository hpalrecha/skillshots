import React, { useMemo, useState } from 'react';
import { Topic, TopicStatus, Group, LeaderboardEntry, User, ContentType } from '../types';
import TopicCard from './TopicCard';
import ProgressChart from './ProgressChart';
import Leaderboard from './Leaderboard';
import { SearchIcon, FilterIcon, ClipboardListIcon, BrainIcon } from './icons';

interface DashboardProps {
  topics: Topic[];
  categories: string[];
  onSelectTopic: (topic: Topic) => void;
  groups: Group[];
  leaderboard: LeaderboardEntry[];
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ topics, categories, onSelectTopic, groups, leaderboard, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'learning' | 'sop'>('learning');

  const { pendingTopics, completedTopics, filteredTotal } = useMemo(() => {
    // 1. First apply all filters to the full list
    const filtered = topics.filter(topic => {
        // View Mode Filter (Learning vs SOP)
        // CHANGE: "My Learning" now shows ALL topics (Courses + SOPs). 
        // "SOP Library" shows ONLY SOPs.
        if (viewMode === 'sop' && !topic.isSop) return false;

        // Search Filter (Deep Search)
        const lowerSearch = searchTerm.toLowerCase();
        const titleMatch = topic.title.toLowerCase().includes(lowerSearch);
        const contentMatch = topic.content.some(block => 
            block.type === ContentType.Paragraph && block.content.toLowerCase().includes(lowerSearch)
        );
        const matchesSearch = titleMatch || contentMatch;
        
        // Category Filter
        const matchesCategory = selectedCategory === 'All' || topic.category === selectedCategory;

        // Status Filter
        let matchesStatus = true;
        if (selectedStatus === 'Pending') matchesStatus = topic.status === TopicStatus.Pending;
        if (selectedStatus === 'Completed') matchesStatus = topic.status === TopicStatus.Completed;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // 2. Then split into pending/completed for display
    return filtered.reduce(
      (acc, topic) => {
        if (topic.status === TopicStatus.Pending) {
          acc.pendingTopics.push(topic);
        } else {
          acc.completedTopics.push(topic);
        }
        return acc;
      },
      { pendingTopics: [] as Topic[], completedTopics: [] as Topic[], filteredTotal: filtered.length }
    );
  }, [topics, searchTerm, selectedCategory, selectedStatus, viewMode]);

  const showPendingSection = selectedStatus === 'All' || selectedStatus === 'Pending';
  const showCompletedSection = selectedStatus === 'All' || selectedStatus === 'Completed';

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">
                    {viewMode === 'learning' ? 'Your Learning Dashboard' : 'SOP Library'}
                </h2>
                <p className="text-gray-500 mt-1">
                    {viewMode === 'learning' 
                        ? 'Track your progress and climb the leaderboard!' 
                        : 'Access Standard Operating Procedures and Reference Guides.'}
                </p>
            </div>
            
            {/* View Switcher Tabs */}
            <div className="flex p-1 bg-gray-200 rounded-lg self-start md:self-auto">
                <button
                    onClick={() => setViewMode('learning')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-all ${viewMode === 'learning' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <BrainIcon className="h-4 w-4 mr-2" />
                    My Learning
                </button>
                <button
                    onClick={() => setViewMode('sop')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-all ${viewMode === 'sop' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <ClipboardListIcon className="h-4 w-4 mr-2" />
                    SOP Library
                </button>
            </div>
         </div>
         
         {/* Search and Filters Bar */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder={viewMode === 'learning' ? "Search courses & content..." : "Search SOPs & procedures..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 !bg-white !text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                />
            </div>
            
            <div className="flex w-full md:w-auto space-x-3 overflow-x-auto">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                     <FilterIcon className="h-4 w-4 text-gray-500" />
                     <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer"
                     >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                </div>

                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                     <div className={`h-2 w-2 rounded-full ${selectedStatus === 'All' ? 'bg-gray-400' : selectedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                     <select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer"
                     >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                     </select>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                {showPendingSection && (
                    <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${viewMode === 'sop' ? 'border-purple-500' : 'border-indigo-500'}`}>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className={`${viewMode === 'sop' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'} py-1 px-3 rounded-full text-sm font-extrabold mr-3`}>{pendingTopics.length}</span>
                            {viewMode === 'sop' ? 'Available SOPs' : 'Pending Courses'}
                        </h3>
                        {pendingTopics.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pendingTopics.map(topic => (
                                <TopicCard key={topic.id} topic={topic} onSelect={onSelectTopic} groups={groups} />
                            ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No items found matching your criteria.</p>
                        )}
                    </div>
                )}

                {showCompletedSection && (
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className="bg-emerald-100 text-emerald-600 py-1 px-3 rounded-full text-sm font-extrabold mr-3">{completedTopics.length}</span>
                            {viewMode === 'sop' ? 'Read SOPs' : 'Completed Courses'}
                        </h3>
                        {completedTopics.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {completedTopics.map(topic => (
                                <TopicCard key={topic.id} topic={topic} onSelect={onSelectTopic} groups={groups} />
                            ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No items found matching your criteria.</p>
                        )}
                    </div>
                )}
                
                {filteredTotal === 0 && (
                     <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                         <SearchIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                         <p className="text-gray-500 text-lg">No content matches your search.</p>
                         <button 
                            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedStatus('All'); }}
                            className="mt-4 text-primary hover:text-indigo-700 font-medium"
                         >
                            Clear all filters
                         </button>
                     </div>
                )}
            </div>

            <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Progress Overview</h3>
                    <ProgressChart completed={completedTopics.length} pending={pendingTopics.length} />
                </div>
                
                {viewMode === 'learning' && (
                    <Leaderboard entries={leaderboard} currentUserId={currentUser.id} />
                )}
                
                {viewMode === 'sop' && (
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                        <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center">
                            <ClipboardListIcon className="h-5 w-5 mr-2" />
                            SOP Quick Access
                        </h3>
                        <p className="text-sm text-purple-700 mb-4">Standard Operating Procedures are critical for compliance and safety. Ensure you have read all SOPs relevant to your department.</p>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};

export default Dashboard;