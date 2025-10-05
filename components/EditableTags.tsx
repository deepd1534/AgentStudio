import React, { useState } from 'react';
import { XMarkIcon } from './IconComponents';

interface EditableTagsProps {
  items: string[];
  onChange: (items: string[]) => void;
  onDirty: () => void;
}

const EditableTags: React.FC<EditableTagsProps> = ({ items, onChange, onDirty }) => {
  const [newItem, setNewItem] = useState('');

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    onDirty();
  };

  const handleAdd = () => {
    const trimmedItem = newItem.trim();
    if (trimmedItem && !items.includes(trimmedItem)) {
      const newItems = [...items, trimmedItem];
      onChange(newItems);
      onDirty();
      setNewItem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-full group animate-fade-in">
          <span>{item}</span>
          <button onClick={() => handleRemove(index)} className="text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="relative">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder="Add new..."
          className="w-32 bg-transparent border-b border-dashed border-gray-500 focus:border-solid focus:border-blue-400 text-white placeholder-gray-500 outline-none px-1 py-1"
        />
      </div>
    </div>
  );
};
export default EditableTags;
