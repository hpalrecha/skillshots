
import React, { useState, useEffect } from 'react';
import { Topic, TopicStatus, ContentType, User, Group, UserRole, ContentBlock } from '../types';
import { FileTextIcon, VideoIcon, PlusIcon, TrashIcon, EditIcon, CheckIcon, XIcon, UserCircleIcon, UsersIcon, SparklesIcon, LoaderIcon, UploadIcon, LinkIcon, MailIcon, KeyIcon, ClipboardListIcon } from './icons';
import { generateCourseFromPrompt, CourseResource } from '../services/geminiService';

interface CreatorDashboardProps {
  topics: Topic[];
  users: User[];
  groups: Group[];
  categories: string[];
  onAddTopic: (topic: Topic) => void;
  onUpdateTopic: (topic: Topic) => void;
  onDeleteTopic: (id: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onAddGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (cat: string) => void;
}

type Tab = 'courses' | 'users' | 'settings';

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ 
    topics, users, groups, categories,
    onAddTopic, onUpdateTopic, onDeleteTopic,
    onAddUser, onUpdateUser, onDeleteUser,
    onAddGroup, onDeleteGroup,
    onAddCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('courses');

  // --- TOPIC FORM STATE ---
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicId, setEditTopicId] = useState<string | null>(null);
  
  const [topicTitle, setTopicTitle] = useState('');
  const [topicCategory, setTopicCategory] = useState('');
  const [topicReadTime, setTopicReadTime] = useState(5);
  const [topicImage, setTopicImage] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200');
  const [isSop, setIsSop] = useState(false);
  
  // Dynamic Content Blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  // Map to track which blocks are in upload mode { [index]: true/false }
  const [uploadModeMap, setUploadModeMap] = useState<Record<number, boolean>>({});
  
  // Sharing State
  const [shareMode, setShareMode] = useState<'all' | 'departments' | 'users'>('all');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResources, setAiResources] = useState<CourseResource[]>([]);
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<ContentType>(ContentType.Video);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- USER FORM STATE ---
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.Learner);
  const [newUserGroups, setNewUserGroups] = useState<string[]>([]);

  // --- SETTINGS STATE ---
  const [newGroupInput, setNewGroupInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // Email Config State
  const [emailHost, setEmailHost] = useState('');
  const [emailPort, setEmailPort] = useState('587');
  const [emailUser, setEmailUser] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
      // Load Settings on mount
      const storedKey = localStorage.getItem('skillshots_gemini_api_key');
      if (storedKey) setApiKeyInput(storedKey);

      // Load Email Settings
      setEmailHost(localStorage.getItem('skillshots_smtp_host') || '');
      setEmailPort(localStorage.getItem('skillshots_smtp_port') || '587');
      setEmailUser(localStorage.getItem('skillshots_smtp_user') || '');
      setEmailPass(localStorage.getItem('skillshots_smtp_pass') || '');
      setEmailEnabled(localStorage.getItem('skillshots_smtp_enabled') === 'true');
  }, []);

  // Initial Data Load for Edit
  const startEditTopic = (topic: Topic) => {
      setEditTopicId(topic.id);
      setTopicTitle(topic.title);
      setTopicCategory(topic.category);
      setTopicReadTime(topic.readTime);
      setTopicImage(topic.imageUrl);
      setIsSop(topic.isSop || false);
      
      // Load content blocks
      setContentBlocks([...topic.content]);
      setUploadModeMap({}); // Reset upload modes
      
      // Load Sharing logic
      if (topic.sharedWith.includes('group-3') && groups.find(g => g.id === 'group-3')?.name === 'All Employees') {
          setShareMode('all');
          setSelectedGroups([]);
          setSelectedUsers([]);
      } else if (topic.sharedWithUsers && topic.sharedWithUsers.length > 0) {
          setShareMode('users');
          setSelectedUsers(topic.sharedWithUsers);
          setSelectedGroups(topic.sharedWith);
      } else {
          setShareMode('departments');
          setSelectedGroups(topic.sharedWith);
          setSelectedUsers([]);
      }
      
      setIsEditingTopic(true);
  };

  const resetTopicForm = () => {
      setIsEditingTopic(false);
      setEditTopicId(null);
      setTopicTitle('');
      setTopicCategory(categories[0] || 'General');
      setTopicReadTime(5);
      setTopicImage('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200');
      setContentBlocks([{ type: ContentType.Paragraph, content: '', order: 1 }]);
      setUploadModeMap({});
      setIsSop(false);
      setShareMode('all');
      setSelectedGroups([]);
      setSelectedUsers([]);
      // Reset AI
      setAiPrompt('');
      setAiResources([]);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    // Filter out empty blocks if needed or just save as is
    const validBlocks = contentBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));

    // Sharing Logic
    let finalSharedWithGroups: string[] = [];
    let finalSharedWithUsers: string[] = [];

    if (shareMode === 'all') {
        const allGroup = groups.find(g => g.name === 'All Employees');
        if (allGroup) finalSharedWithGroups = [allGroup.id];
    } else if (shareMode === 'departments') {
        finalSharedWithGroups = selectedGroups;
    } else if (shareMode === 'users') {
        finalSharedWithUsers = selectedUsers;
    }

    const topicData: Topic = {
        id: editTopicId || Date.now().toString(),
        title: topicTitle,
        category: topicCategory || 'General',
        authorId: 'user-1', // Defaulting to current admin
        readTime: topicReadTime,
        imageUrl: topicImage,
        status: TopicStatus.Pending,
        content: validBlocks,
        sharedWith: finalSharedWithGroups,
        sharedWithUsers: finalSharedWithUsers,
        isSop: isSop
    };

    if (editTopicId) {
        onUpdateTopic(topicData);
    } else {
        onAddTopic(topicData);
    }
    resetTopicForm();
  };

  // Content Block Handlers
  const addBlock = (type: ContentType) => {
      setContentBlocks([...contentBlocks, { type, content: '', title: '', order: contentBlocks.length + 1 }]);
  };

  const removeBlock = (index: number) => {
      const newBlocks = [...contentBlocks];
      newBlocks.splice(index, 1);
      setContentBlocks(newBlocks);
      
      // Cleanup map
      const newMap = { ...uploadModeMap };
      delete newMap[index];
      setUploadModeMap(newMap);
  };

  const updateBlock = (index: number, field: keyof ContentBlock, value: any) => {
      const newBlocks = [...contentBlocks];
      newBlocks[index] = { ...newBlocks[index], [field]: value };
      setContentBlocks(newBlocks);
  };
  
  const toggleUploadMode = (index: number) => {
      setUploadModeMap(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleFileUpload = (index: number, file: File | null) => {
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result as string;
          updateBlock(index, 'content', result);
          if (!contentBlocks[index].title) {
              updateBlock(index, 'title', file.name);
          }
      };
      reader.readAsDataURL(file);
  };

  // AI Modal Handlers
  const addAiResource = () => {
      if(!newResourceUrl) return;
      setAiResources([...aiResources, { type: newResourceType, url: newResourceUrl }]);
      setNewResourceUrl('');
  };

  const removeAiResource = (index: number) => {
      const newRes = [...aiResources];
      newRes.splice(index, 1);
      setAiResources(newRes);
  };

  // AI Generation Handler
  const handleAiGenerate = async () => {
      if (!aiPrompt.trim() && aiResources.length === 0) {
          alert("Please enter a topic or add at least one resource.");
          return;
      }
      setIsGenerating(true);
      try {
          const effectivePrompt = aiPrompt || "Create a comprehensive course based on the provided resources.";
          const generatedData = await generateCourseFromPrompt(effectivePrompt, aiResources);
          
          setTopicTitle(generatedData.title);
          setTopicCategory(generatedData.category);
          setTopicReadTime(generatedData.readTime);
          
          if (generatedData.coverImageKeyword) {
               setTopicImage(`https://source.unsplash.com/800x600/?${generatedData.coverImageKeyword}`);
          }
          
          const processedBlocks = generatedData.content.map(block => {
              if (block.content === 'placeholder') {
                   if (block.type === ContentType.Image) return { ...block, content: `https://source.unsplash.com/800x400/?${generatedData.coverImageKeyword || 'office'}` };
                   if (block.type === ContentType.Video) return { ...block, content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' };
              }
              return block;
          });
          
          setContentBlocks(processedBlocks);
          setShowAiModal(false);
          setAiPrompt('');
          setAiResources([]);
      } catch (error) {
          alert("Failed to generate course. Please ensure your Gemini API Key is configured in the Settings tab.");
          console.error(error);
      } finally {
          setIsGenerating(false);
      }
  };


  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUserName || !newUserEmail) return;

      const newUser: User = {
          id: Date.now().toString(),
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          groupIds: newUserGroups,
          password: 'password123'
      };
      
      onAddUser(newUser);
      
      // Simulated Email Notification
      alert(`User Created!\n\nAn email has been sent to ${newUserEmail} with their temporary password: "password123".`);

      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole(UserRole.Learner);
      setNewUserGroups([]);
      setIsCreatingUser(false);
  };

  const handleResetPassword = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const confirmReset = window.confirm(`Are you sure you want to reset the password for ${user.name}?`);
      if (!confirmReset) return;

      const newTempPassword = Math.random().toString(36).slice(-8); // Generate random string
      const updatedUser = { ...user, password: newTempPassword };
      
      onUpdateUser(updatedUser);
      
      if (emailEnabled) {
          alert(`[Simulated Email Sent]\n\nTo: ${user.email}\nSubject: Password Reset\n\nYour new temporary password is: ${newTempPassword}`);
      } else {
          alert(`Password reset successfully.\n\nNew Password: ${newTempPassword}\n\n(Enable Email Settings to send this automatically)`);
      }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('skillshots_gemini_api_key', apiKeyInput);
      
      localStorage.setItem('skillshots_smtp_host', emailHost);
      localStorage.setItem('skillshots_smtp_port', emailPort);
      localStorage.setItem('skillshots_smtp_user', emailUser);
      localStorage.setItem('skillshots_smtp_pass', emailPass);
      localStorage.setItem('skillshots_smtp_enabled', String(emailEnabled));
      
      alert("Settings Saved Successfully!");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[80vh]">
      <div className="flex border-b">
        <button
          className={`flex-1 py-4 text-center font-medium ${activeTab === 'courses' ? 'text-primary border-b-2 border-primary bg-sky-50' : 'text-gray-500 hover:text-primary'}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses & Content
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium ${activeTab === 'users' ? 'text-primary border-b-2 border-primary bg-sky-50' : 'text-gray-500 hover:text-primary'}`}
          onClick={() => setActiveTab('users')}
        >
          Users & Access
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary bg-sky-50' : 'text-gray-500 hover:text-primary'}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings & Config
        </button>
      </div>

      <div className="p-6">
        {/* ================= COURSES TAB ================= */}
        {activeTab === 'courses' && (
          <div>
            {!isEditingTopic ? (
                // LIST VIEW
                <div>
                   <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
                        <div className="flex space-x-3">
                             <button
                                onClick={() => setShowAiModal(true)}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                AI Generator
                            </button>
                            <button
                                onClick={() => { resetTopicForm(); setIsEditingTopic(true); }}
                                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-sky-600 shadow-md transition-all"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Create New
                            </button>
                        </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topics.map(topic => (
                            <div key={topic.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <div className="h-40 bg-gray-200 relative">
                                    <img src={topic.imageUrl} alt={topic.title} className="w-full h-full object-cover" />
                                    {topic.isSop && (
                                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">SOP</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity space-x-2">
                                         <button onClick={() => startEditTopic(topic)} className="p-2 bg-white rounded-full text-gray-800 hover:text-primary">
                                             <EditIcon className="h-5 w-5"/>
                                         </button>
                                         <button onClick={() => { if(window.confirm('Delete this course?')) onDeleteTopic(topic.id); }} className="p-2 bg-white rounded-full text-gray-800 hover:text-error">
                                             <TrashIcon className="h-5 w-5"/>
                                         </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 truncate">{topic.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{topic.category} • {topic.readTime} min</p>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>
            ) : (
                // EDIT/CREATE FORM
                <form onSubmit={handleSaveTopic} className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{editTopicId ? 'Edit Course' : 'Create New Course'}</h3>
                        <button type="button" onClick={resetTopicForm} className="text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={topicTitle}
                                onChange={e => setTopicTitle(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                                placeholder="e.g. Workplace Safety Standards 2024"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                             <select
                                value={topicCategory}
                                onChange={e => setTopicCategory(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Read Time (min)</label>
                            <input
                                type="number"
                                required
                                value={topicReadTime}
                                onChange={e => setTopicReadTime(parseInt(e.target.value))}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                            <input
                                type="text"
                                value={topicImage}
                                onChange={e => setTopicImage(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <input 
                            type="checkbox" 
                            id="isSop" 
                            checked={isSop} 
                            onChange={(e) => setIsSop(e.target.checked)}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isSop" className="font-medium text-purple-900 flex items-center">
                            <ClipboardListIcon className="h-5 w-5 mr-2" />
                            Mark as Standard Operating Procedure (SOP)
                        </label>
                    </div>

                    {/* Sharing Section */}
                    <div className="bg-sky-50 p-6 rounded-lg border border-sky-100">
                        <h4 className="font-bold text-sky-900 mb-4 flex items-center">
                            <UsersIcon className="h-5 w-5 mr-2" />
                            Who can see this course?
                        </h4>
                        
                        <div className="flex space-x-6 mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={shareMode === 'all'} onChange={() => setShareMode('all')} className="mr-2 text-primary" />
                                <span className="text-gray-800">Everyone</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={shareMode === 'departments'} onChange={() => setShareMode('departments')} className="mr-2 text-primary" />
                                <span className="text-gray-800">Departments</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={shareMode === 'users'} onChange={() => setShareMode('users')} className="mr-2 text-primary" />
                                <span className="text-gray-800">Specific Users</span>
                            </label>
                        </div>
                        
                        {shareMode === 'departments' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded border">
                                {groups.map(g => (
                                    <label key={g.id} className="flex items-center space-x-2">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedGroups.includes(g.id)}
                                            onChange={(e) => {
                                                if(e.target.checked) setSelectedGroups([...selectedGroups, g.id]);
                                                else setSelectedGroups(selectedGroups.filter(id => id !== g.id));
                                            }}
                                            className="rounded text-primary focus:ring-primary" 
                                        />
                                        <span className="text-sm text-gray-700">{g.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        
                        {shareMode === 'users' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded border max-h-40 overflow-y-auto">
                                {users.filter(u => u.role === UserRole.Learner).map(u => (
                                    <label key={u.id} className="flex items-center space-x-2">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedUsers.includes(u.id)}
                                            onChange={(e) => {
                                                if(e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                                                else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                            }}
                                            className="rounded text-primary focus:ring-primary" 
                                        />
                                        <span className="text-sm text-gray-700">{u.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Dynamic Content Builder */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-800">Course Content</h4>
                            <div className="flex space-x-2 text-sm">
                                <button type="button" onClick={() => addBlock(ContentType.Paragraph)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">+ Text</button>
                                <button type="button" onClick={() => addBlock(ContentType.Image)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">+ Image</button>
                                <button type="button" onClick={() => addBlock(ContentType.Video)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">+ Video</button>
                                <button type="button" onClick={() => addBlock(ContentType.Document)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">+ PDF</button>
                            </div>
                        </div>
                        
                        {contentBlocks.map((block, index) => (
                            <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative group">
                                <button type="button" onClick={() => removeBlock(index)} className="absolute top-2 right-2 text-gray-400 hover:text-error p-1">
                                    <XIcon className="h-4 w-4" />
                                </button>
                                <span className="text-xs uppercase font-bold text-gray-400 mb-2 block tracking-wider">{block.type} Block</span>
                                
                                {block.type === ContentType.Paragraph ? (
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => updateBlock(index, 'content', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                                        rows={4}
                                        placeholder="Enter educational text here..."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={block.title || ''}
                                            onChange={(e) => updateBlock(index, 'title', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                            placeholder={`Title / Caption for ${block.type}`}
                                        />
                                        
                                        <div className="flex gap-2">
                                            {/* Toggle Input Mode */}
                                            <button 
                                                type="button" 
                                                onClick={() => toggleUploadMode(index)}
                                                className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                                                title={uploadModeMap[index] ? "Switch to URL Link" : "Switch to File Upload"}
                                            >
                                                {uploadModeMap[index] ? <LinkIcon className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
                                            </button>

                                            {uploadModeMap[index] ? (
                                                 <input
                                                    type="file"
                                                    accept={block.type === ContentType.Image ? "image/*" : block.type === ContentType.Document ? ".pdf" : "video/*"}
                                                    onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                                                    className="flex-1 p-1 border border-gray-300 rounded bg-white text-sm"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={block.content}
                                                    onChange={(e) => updateBlock(index, 'content', e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                                    placeholder={block.type === ContentType.Video ? "YouTube URL" : "https://..."}
                                                />
                                            )}
                                        </div>
                                        {block.content && block.content.startsWith('data:') && (
                                            <p className="text-xs text-green-600 font-medium">File uploaded successfully.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-sky-600 shadow-md">
                            {editTopicId ? 'Update Course' : 'Publish Course'}
                        </button>
                    </div>
                </form>
            )}
          </div>
        )}

        {/* ================= USERS TAB ================= */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{isCreatingUser ? 'Add New User' : 'User Directory'}</h3>
                
                {isCreatingUser ? (
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input
                                type="text"
                                placeholder="Full Name"
                                required
                                value={newUserName}
                                onChange={e => setNewUserName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                            />
                             <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <select
                                value={newUserRole}
                                onChange={e => setNewUserRole(e.target.value as UserRole)}
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                            >
                                <option value={UserRole.Learner}>Learner</option>
                                <option value={UserRole.Creator}>Creator/Admin</option>
                            </select>
                            
                            <div className="p-2 border border-gray-300 rounded bg-white h-24 overflow-y-auto">
                                <p className="text-xs text-gray-500 mb-1">Assign Groups:</p>
                                {groups.map(g => (
                                    <label key={g.id} className="flex items-center space-x-2 text-sm">
                                        <input 
                                            type="checkbox"
                                            checked={newUserGroups.includes(g.id)}
                                            onChange={(e) => {
                                                if(e.target.checked) setNewUserGroups([...newUserGroups, g.id]);
                                                else setNewUserGroups(newUserGroups.filter(id => id !== g.id));
                                            }}
                                            className="rounded text-primary"
                                        />
                                        <span className="text-gray-700">{g.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button type="submit" className="px-4 py-2 bg-success text-white rounded font-medium">Create User</button>
                            <button type="button" onClick={() => setIsCreatingUser(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium">Cancel</button>
                        </div>
                    </form>
                ) : (
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500">Manage learner access and departments.</p>
                        <button onClick={() => setIsCreatingUser(true)} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center shadow-sm hover:bg-sky-600">
                            <PlusIcon className="h-5 w-5 mr-2" /> Add User
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groups</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                            <span className="font-bold text-xs">{user.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' || user.role === 'Creator' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.groupIds.map(gid => groups.find(g => g.id === gid)?.name).filter(Boolean).join(', ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-3">
                                    <button 
                                        onClick={() => handleResetPassword(user.id)} 
                                        className="text-amber-600 hover:text-amber-900 flex items-center" 
                                        title="Reset Password"
                                    >
                                        <KeyIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => { if(window.confirm('Remove this user?')) onDeleteUser(user.id); }} className="text-red-600 hover:text-red-900">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl mx-auto">
             
             {/* API Keys */}
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-primary" />
                    AI Configuration
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Enter your Gemini API key to enable AI features (Quiz Generation, Chatbot, Video Analysis).
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                        <input 
                            type="password" 
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                        />
                    </div>
                </div>
            </div>

            {/* Email Config */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <MailIcon className="h-5 w-5 mr-2 text-primary" />
                    Email Service Configuration
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Configure your SMTP server to send password reset emails and notifications.
                </p>
                <div className="space-y-4">
                     <div className="flex items-center space-x-2 mb-2">
                        <input 
                            type="checkbox" 
                            id="emailEnabled"
                            checked={emailEnabled}
                            onChange={(e) => setEmailEnabled(e.target.checked)}
                            className="h-4 w-4 text-primary rounded"
                        />
                        <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">Enable Email Notifications</label>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                            <input 
                                type="text" 
                                value={emailHost}
                                onChange={(e) => setEmailHost(e.target.value)}
                                placeholder="smtp.gmail.com"
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                                disabled={!emailEnabled}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                            <input 
                                type="text" 
                                value={emailPort}
                                onChange={(e) => setEmailPort(e.target.value)}
                                placeholder="587"
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                                disabled={!emailEnabled}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input 
                                type="text" 
                                value={emailUser}
                                onChange={(e) => setEmailUser(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                                disabled={!emailEnabled}
                            />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={emailPass}
                                onChange={(e) => setEmailPass(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                                disabled={!emailEnabled}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Organization Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Departments / Groups</h4>
                        <div className="flex space-x-2 mb-3">
                            <input 
                                type="text" 
                                value={newGroupInput} 
                                onChange={e => setNewGroupInput(e.target.value)}
                                placeholder="New Department"
                                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900"
                            />
                            <button 
                                onClick={() => { if(newGroupInput) { onAddGroup({id: Date.now().toString(), name: newGroupInput}); setNewGroupInput(''); }}}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                <PlusIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {groups.map(g => (
                                <li key={g.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                    <span>{g.name}</span>
                                    <button onClick={() => { if(window.confirm('Delete group?')) onDeleteGroup(g.id); }} className="text-red-400 hover:text-red-600"><XIcon className="h-3 w-3"/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Course Categories</h4>
                         <div className="flex space-x-2 mb-3">
                            <input 
                                type="text" 
                                value={newCategoryInput} 
                                onChange={e => setNewCategoryInput(e.target.value)}
                                placeholder="New Category"
                                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900"
                            />
                            <button 
                                onClick={() => { if(newCategoryInput) { onAddCategory(newCategoryInput); setNewCategoryInput(''); }}}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                <PlusIcon className="h-4 w-4" />
                            </button>
                        </div>
                         <ul className="space-y-2">
                            {categories.map(c => (
                                <li key={c} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                    <span>{c}</span>
                                    <button onClick={() => { if(window.confirm('Delete category?')) onDeleteCategory(c); }} className="text-red-400 hover:text-red-600"><XIcon className="h-3 w-3"/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSaveSettings}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transform active:scale-95 transition-all"
                >
                    Save All Settings
                </button>
            </div>
          </div>
        )}
      </div>

      {/* AI GENERATOR MODAL */}
      {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                          <SparklesIcon className="h-6 w-6 mr-2 text-indigo-500" />
                          AI Course Generator
                      </h3>
                      <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                          <XIcon className="h-6 w-6" />
                      </button>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                      Describe what you want to teach, and optionally add resources (PDFs, Videos, Images). 
                      The AI will structure the course and incorporate your files.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Topic or Instructions</label>
                          <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              className="w-full border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                              placeholder="e.g. Create a safety induction course for new warehouse employees focusing on forklifts."
                              rows={3}
                          />
                      </div>
                      
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                          <label className="block text-sm font-bold text-indigo-900 mb-2">Context Resources (Optional)</label>
                          <div className="flex space-x-2 mb-2">
                               <select 
                                  value={newResourceType} 
                                  onChange={(e) => setNewResourceType(e.target.value as ContentType)}
                                  className="border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                               >
                                  <option value={ContentType.Video}>Video URL</option>
                                  <option value={ContentType.Document}>PDF URL</option>
                                  <option value={ContentType.Image}>Image URL</option>
                               </select>
                               <input 
                                  type="text" 
                                  value={newResourceUrl}
                                  onChange={(e) => setNewResourceUrl(e.target.value)}
                                  placeholder="Paste URL here..."
                                  className="flex-1 border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                               />
                               <button 
                                  onClick={addAiResource}
                                  type="button"
                                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                               >
                                  Add
                               </button>
                          </div>
                          
                          {aiResources.length > 0 && (
                              <ul className="space-y-1 mt-2">
                                  {aiResources.map((res, i) => (
                                      <li key={i} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-indigo-100">
                                          <span className="truncate max-w-[80%]">
                                              <span className="font-bold uppercase mr-2 text-indigo-500">{res.type}</span>
                                              {res.url}
                                          </span>
                                          <button onClick={() => removeAiResource(i)} className="text-red-400 hover:text-red-600">
                                              <XIcon className="h-3 w-3" />
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          )}
                      </div>
                  </div>
                  
                  <div className="flex justify-end">
                      <button 
                          onClick={handleAiGenerate}
                          disabled={isGenerating}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 flex items-center transform transition-transform hover:scale-105"
                      >
                          {isGenerating ? (
                              <>
                                  <LoaderIcon className="animate-spin h-5 w-5 mr-2" />
                                  Designing Course...
                              </>
                          ) : (
                              <>
                                  <SparklesIcon className="h-5 w-5 mr-2" />
                                  Generate Magic Course
                              </>
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
