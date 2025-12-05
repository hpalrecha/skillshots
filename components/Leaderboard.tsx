
import React from 'react';
import { LeaderboardEntry } from '../types';
import { TrophyIcon, MedalIcon, UserCircleIcon } from './icons';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserId }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="flex items-center text-white">
          <TrophyIcon className="h-8 w-8 mr-3 text-yellow-300" />
          <h3 className="text-xl font-bold">Top Learners</h3>
        </div>
        <p className="text-indigo-100 text-sm mt-1">Earn points by completing courses and quizzes!</p>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Rank</th>
                        <th className="px-6 py-3">Learner</th>
                        <th className="px-6 py-3 text-right">Points</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {entries.map((entry) => {
                        const isCurrentUser = entry.userId === currentUserId;
                        let rankIcon;
                        let rankClass = "font-medium text-gray-900";
                        
                        if (entry.rank === 1) {
                            rankIcon = <MedalIcon className="h-6 w-6 text-yellow-500" />;
                            rankClass = "font-bold text-yellow-600";
                        } else if (entry.rank === 2) {
                             rankIcon = <MedalIcon className="h-6 w-6 text-gray-400" />;
                             rankClass = "font-bold text-gray-500";
                        } else if (entry.rank === 3) {
                             rankIcon = <MedalIcon className="h-6 w-6 text-amber-700" />;
                             rankClass = "font-bold text-amber-800";
                        } else {
                            rankIcon = <span className="w-6 h-6 flex items-center justify-center font-semibold text-gray-500">{entry.rank}</span>;
                        }

                        return (
                            <tr key={entry.userId} className={`${isCurrentUser ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition-colors`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center w-8">
                                        {rankIcon}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 text-gray-300">
                                            <UserCircleIcon className={`h-8 w-8 ${isCurrentUser ? 'text-primary' : ''}`} />
                                        </div>
                                        <div className="ml-4">
                                            <div className={`text-sm ${isCurrentUser ? 'font-bold text-primary' : 'font-medium text-gray-900'}`}>
                                                {entry.name} {isCurrentUser && '(You)'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-700">
                                    {entry.points.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
