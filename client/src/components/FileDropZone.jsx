import { useState, useRef } from 'react';
import styles from './FileDropZone.module.css';

export default function FileDropZone({ disabled, onFileDrop }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) onFileDrop(file);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileDrop(file);
    e.target.value = ''; 
  };

  const zoneClass = [
    styles.zone,
    isDragging ? styles.zoneDragging : '',
    disabled   ? styles.zoneDisabled : '',
  ].join(' ');

  return (
    <div
      className={zoneClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <div className={styles.icon}>&#8679;</div>
      <p className={styles.label}>
        {disabled
          ? 'Select a device to send files'
          : 'Drop a file or click to browse'}
      </p>
    </div>
  );
}
