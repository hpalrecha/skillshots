
import React, { useMemo } from 'react';
import { Topic, TopicStatus, Group } from '../types';
import { ClockIcon, CheckCircleIcon, UsersIcon, ClipboardListIcon } from './icons';

interface TopicCardProps {
  topic: Topic;
  onSelect: (topic: Topic) => void;
  groups: Group[];
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onSelect, groups }) => {
  const isCompleted = topic.status === TopicStatus.Completed;

  const sharedWithGroupNames = useMemo(() => {
    return topic.sharedWith
      .map(groupId => groups.find(g => g.id === groupId)?.name)
      .filter(Boolean) as string[];
  }, [topic.sharedWith, groups]);

  return (
    <div
      onClick={() => onSelect(topic)}
      className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer group flex flex-col relative border border-gray-100"
    >
      <div className="relative">
        <img src={topic.imageUrl} alt={topic.title} className="w-full h-40 object-cover" />
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold text-white rounded-full ${
          isCompleted ? 'bg-success' : 'bg-primary'
        }`}>
          {topic.category}
        </div>
        
        {topic.isSop && (
             <div className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded-full bg-purple-600 flex items-center shadow-md">
                <ClipboardListIcon className="h-3 w-3 mr-1" />
                SOP
             </div>
        )}

        {isCompleted && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <CheckCircleIcon className="h-12 w-12 text-white opacity-90" />
          </div>
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate group-hover:text-primary transition-colors">
          {topic.title}
        </h3>
        <div className="flex-grow"></div>
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1.5" />
            <span>{topic.readTime} min read</span>
          </div>
          {sharedWithGroupNames.length > 0 && (
            <div className="flex items-center" title={`Shared with: ${sharedWithGroupNames.join(', ')}`}>
              <UsersIcon className="h-4 w-4 mr-1.5" />
              <span className="truncate">{sharedWithGroupNames[0]}</span>
              {sharedWithGroupNames.length > 1 && <span className="ml-1">+{sharedWithGroupNames.length - 1}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
