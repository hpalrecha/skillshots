
import React from 'react';
import { User, UserRole } from '../types';
import { SkillShotsLogo, UserCircleIcon, LogOutIcon, EditIcon } from './icons';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onAdminClick }) => {
  const isCreator = user.role === UserRole.Creator;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
          <SkillShotsLogo className="h-9 w-9 text-primary" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SkillShots</h1>
        </div>
        <div className="flex items-center space-x-4">
            {isCreator && (
                 <button 
                    onClick={onAdminClick}
                    className="hidden sm:flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                 >
                    <EditIcon className="h-4 w-4 mr-1.5" />
                    Creator Studio
                 </button>
            )}
            <div className="text-right">
                <span className="hidden sm:inline text-gray-800 font-medium">{user.name}</span>
                <span className="hidden sm:block text-xs text-gray-500">{user.role}</span>
            </div>
            <UserCircleIcon className="h-9 w-9 text-gray-400" />
            <button onClick={onLogout} aria-label="Logout" className="p-2 text-gray-500 hover:text-error rounded-full hover:bg-red-50">
                <LogOutIcon className="h-6 w-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;