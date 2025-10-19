import React from 'react';
import { SavedBlog, BlogStatus } from '../types';
import SavedBlogCard from '../components/SavedBlogCard';
import { ArrowLeftIcon } from '../components/IconComponents';

const mockSavedBlogs: SavedBlog[] = [
  {
    id: '1',
    title: 'The Future of AI in Web Development',
    lastEdited: '2 days ago',
    summary: 'An in-depth look at how artificial intelligence is reshaping the landscape of web development, from automated coding to intelligent user interfaces. We explore the tools and techniques that are leading the charge.',
    status: BlogStatus.PUBLISHED,
  },
  {
    id: '2',
    title: 'Getting Started with Quantum Computing',
    lastEdited: '5 days ago',
    summary: 'Quantum computing is no longer science fiction. This guide provides a beginner-friendly introduction to the core concepts, potential applications, and how to start experimenting with quantum simulators today.',
    status: BlogStatus.IN_REVIEW,
  },
  {
    id: '3',
    title: 'A Guide to Modern CSS Techniques',
    lastEdited: '1 week ago',
    summary: 'Dive into the latest and greatest features of CSS. This article covers Flexbox, Grid, custom properties, and new selectors that can simplify your stylesheets and unlock powerful new layout possibilities.',
    status: BlogStatus.DRAFT,
  },
    {
    id: '4',
    title: 'Why Rust is the Future of Systems Programming',
    lastEdited: '2 weeks ago',
    summary: 'Exploring the reasons behind Rust\'s growing popularity. We discuss its unique ownership model, performance benefits, and how it guarantees memory safety, making it a strong contender for the future.',
    status: BlogStatus.PUBLISHED,
  },
  {
    id: '5',
    title: 'Mastering Asynchronous JavaScript',
    lastEdited: '1 month ago',
    summary: 'From callbacks to Promises and async/await, this comprehensive guide will help you master asynchronous programming in JavaScript, a crucial skill for building responsive and efficient applications.',
    status: BlogStatus.DRAFT,
  },
];

interface SavedBlogsProps {
  onBack: () => void;
}

const SavedBlogs: React.FC<SavedBlogsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="flex items-center mb-12">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Blog Agent
        </button>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Saved Blogs
      </h1>
      <p className="text-gray-400 text-center mb-12">
        Manage your drafts, review submissions, and access your published articles.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockSavedBlogs.map(blog => (
          <SavedBlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </div>
  );
};

export default SavedBlogs;
