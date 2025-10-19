import React from 'react';
import { SavedBlog, BlogStatus } from '../types';
import { EditIcon } from './IconComponents';

interface SavedBlogCardProps {
  blog: SavedBlog;
}

const statusStyles = {
  [BlogStatus.DRAFT]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  [BlogStatus.PUBLISHED]: 'bg-green-500/20 text-green-300 border-green-500/30',
  [BlogStatus.IN_REVIEW]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const SavedBlogCard: React.FC<SavedBlogCardProps> = ({ blog }) => {
  return (
    <div className="group relative rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 p-6 flex flex-col h-full transition-all duration-300 hover:border-blue-400/50 hover:shadow-blue-500/20">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-100 group-hover:text-blue-300 transition-colors pr-4">{blog.title}</h3>
          <span className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full border ${statusStyles[blog.status]}`}>
            {blog.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">Last edited: {blog.lastEdited}</p>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{blog.summary}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
        <button className="px-4 py-2 text-sm font-semibold bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">
          View
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">
          <EditIcon className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};

export default SavedBlogCard;
