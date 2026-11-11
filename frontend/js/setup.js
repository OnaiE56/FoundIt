const statusElement = document.querySelector('#api-status');

try {
  const response = await fetch('/api/v1/health', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Health endpoint returned an error.');

  statusElement.textContent = 'Ready';
  statusElement.dataset.state = 'ready';
} catch {
  statusElement.textContent = 'Unavailable';
  statusElement.dataset.state = 'error';
}
