import React from 'react';

interface EditableProps {
  html: string;
  onChange: (value: string) => void;
  onDirty: () => void;
  // FIX: Changed JSX.IntrinsicElements to React.JSX.IntrinsicElements to resolve namespace issue in modern React.
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  [x: string]: any;
}

const Editable: React.FC<EditableProps> = ({ html, onChange, onDirty, as: Tag = 'div', className, ...props }) => {
  const handleBlur = (e: React.FocusEvent<Element>) => {
    const newHtml = e.currentTarget.innerHTML;
    if (newHtml !== html) {
      onChange(newHtml);
    }
  };

  return (
    <Tag
      {...props}
      contentEditable
      suppressContentEditableWarning={true}
      key={html} 
      onInput={onDirty}
      onBlur={handleBlur}
      className={`transition-all ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Editable;