
import React, { useRef, useEffect } from 'react';
import { Topic, Group } from '../types';
import TopicView from './TopicView';
import { XIcon } from './icons';

interface TopicSwiperViewProps {
  topics: Topic[];
  initialTopicIndex: number;
  onClose: () => void;
  onMarkComplete: (topicId: string) => void;
  groups: Group[];
}

const TopicSwiperView: React.FC<TopicSwiperViewProps> = ({
  topics,
  initialTopicIndex,
  onClose,
  onMarkComplete,
  groups,
}) => {
  const swiperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect ensures that when the swiper mounts, it immediately
    // scrolls to the topic the user clicked on in the dashboard.
    if (swiperRef.current) {
      const initialTopicElement = swiperRef.current.children[initialTopicIndex] as HTMLElement;
      if (initialTopicElement) {
        // We use 'instant' behavior to avoid a visible scroll animation on load.
        initialTopicElement.scrollIntoView({ behavior: 'instant' });
      }
    }
  }, [initialTopicIndex, topics]); // also depend on topics in case the list changes

  return (
    <div className="fixed inset-0 bg-base-100 z-20 animate-fade-in">
      <button
        onClick={onClose}
        aria-label="Close topics view"
        className="fixed top-4 right-4 z-40 bg-white/70 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white hover:text-primary transition-all shadow-lg"
      >
        <XIcon className="h-6 w-6" />
      </button>

      <div
        ref={swiperRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
      >
        {topics.map(topic => (
          <div
            key={topic.id}
            className="h-screen w-screen snap-start flex items-center justify-center p-4"
          >
            <div className="h-full w-full max-w-5xl mx-auto">
              <TopicView
                topic={topic}
                onMarkComplete={onMarkComplete}
                groups={groups}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicSwiperView;
