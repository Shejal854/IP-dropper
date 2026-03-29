import { formatBytes, formatTime } from '../utils/format';
import styles from './TransferHistory.module.css';

export default function TransferHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="empty-state">
        <p>No transfers yet.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {history.map((entry, index) => (
        <li key={index} className={styles.item}>
          <span className={`${styles.badge} ${styles[entry.direction]}`}>
            {entry.direction === 'sent' ? 'Sent' : 'Received'}
          </span>
          <span className={styles.fileName} title={entry.fileName}>
            {entry.fileName}
          </span>
          <span className={styles.meta}>
            {formatBytes(entry.fileSize)} &middot; {entry.peerName} &middot; {formatTime(entry.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
