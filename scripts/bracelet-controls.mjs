import { BraceletClient } from './bracelet-client.mjs';

function errorMessage(error) {
  if (error.name === 'NotFoundError') return 'No bracelet selected. Make sure it is powered on and try again.';
  if (error.name === 'NetworkError' || error.code === 'DISCONNECTED') {
    return 'Connection lost. Bring the bracelet closer and reconnect.';
  }
  return error.message;
}

export function createBraceletControls({ update, updateTimeline, selectDemoOwner }) {
  let bracelet;
  let connected = null;
  let busy = false;
  let closed = false;

  function publish(message = '') {
    if (!closed) update({ braceletInfo: connected, braceletBusy: busy, braceletMessage: message });
  }

  function openClient() {
    const next = new BraceletClient({
      onDisconnect() {
        if (bracelet !== next) return;
        connected = null;
        publish('Bracelet disconnected.');
      },
    });
    bracelet = next;
    return next;
  }

  function dropConnection() {
    const old = bracelet;
    bracelet = null;
    connected = null;
    old?.disconnect();
  }

  async function run(message, action) {
    if (busy || closed) return;
    busy = true;
    publish(message);
    let result;
    try {
      result = await action();
    } catch (error) {
      result = errorMessage(error);
    } finally {
      busy = false;
      publish(result);
    }
  }

  async function save(client, ownerId) {
    publish('Reading and saving encounters…');
    await client.setTime();
    const result = await client.sync(async (records, info) => {
      if (info.userId !== ownerId || info.deviceId !== connected?.deviceId) {
        throw new Error('The bracelet no longer matches the selected demo account.');
      }
      const response = await fetch('/api/encounters/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, deviceId: info.deviceId, records }),
      });
      const receipt = await response.json();
      if (!response.ok) throw new Error(receipt.error || 'Unable to save encounters.');
      if (!closed) updateTimeline(receipt.timeline);
      return receipt.acceptedEventIds;
    });

    const count = result.acknowledged.length;
    return count > 0
      ? `Synced ${count} ${count === 1 ? 'encounter' : 'encounters'}. Disconnect before tapping.`
      : result.info.pendingCount > 0
        ? 'No confirmed encounters to sync. Retry the pending tap with the same bracelet.'
        : 'No encounters to sync. Disconnect before tapping.';
  }

  return {
    choose(ownerId, switching = false) {
      return run('Choose your bracelet in Chrome…', async () => {
        dropConnection();
        const client = openClient();
        // Start the chooser inside the click handler, before any other await.
        const info = await client.connect();
        if (closed) return;
        if (info.userId !== ownerId && !(switching && selectDemoOwner(info.userId))) {
          dropConnection();
          return `This bracelet belongs to ${info.userId}. Select that demo account to sync it.`;
        }
        connected = info;
        if (!switching) return save(client, ownerId);
        return 'Bracelet connected. Choose Sync now to read encounters.';
      });
    },
    sync(ownerId) {
      if (connected?.userId !== ownerId) return;
      return run('Reading and saving encounters…', () => save(bracelet, ownerId));
    },
    disconnect() {
      if (busy) return;
      dropConnection();
      publish();
    },
    close() {
      closed = true;
      dropConnection();
    },
  };
}

window.createClickBraceletControls = createBraceletControls;
