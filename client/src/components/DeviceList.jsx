import styles from './DeviceList.module.css';

/**
 * DeviceList
 *
 * Displays all online peers. Clicking a device selects it as the transfer target.
 * Shows a live progress bar when a transfer is active with that peer.
 *
 * @param {{ id, name }[]}  devices
 * @param {{ id, name }|null} selectedPeer
 * @param {(device: object) => void} onSelect
 * @param {Record<string, { status: string, progress: number }>} transfers
 */
export default function DeviceList({ devices, selectedPeer, onSelect, transfers }) {
  if (devices.length === 0) {
    return (
      <div className="empty-state">
        <p>No other devices found.</p>
        <p>Open IP Dropper on another device on the same network.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {devices.map((device) => {
        const transfer   = transfers[device.id];
        const isSelected = selectedPeer?.id === device.id;
        const isActive   = transfer && transfer.status !== 'idle';

        return (
          <li
            key={device.id}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
            onClick={() => onSelect(device)}
          >
            <span className={`status-dot status-dot--online`} />
            <span className={styles.name}>{device.name}</span>

            {isActive && (
              <div className={styles.transferInfo}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${transfer.progress}%` }}
                  />
                </div>
                <span className={styles.transferLabel}>
                  {transfer.status === 'sending'   && `Sending ${transfer.progress}%`}
                  {transfer.status === 'receiving' && `Receiving ${transfer.progress}%`}
                  {transfer.status === 'waiting'   && 'Incoming...'}
                  {transfer.status === 'done'       && 'Done'}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
