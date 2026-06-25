document.addEventListener('DOMContentLoaded', () => {
  const healthLink = document.querySelector('a[href="/health"]');

  if (healthLink) {
    healthLink.addEventListener('click', (event) => {
      event.preventDefault();
      fetch('/health')
        .then((response) => response.json())
        .then((data) => {
          alert(`Health status: ${data.status}`);
        })
        .catch(() => {
          alert('Health check failed.');
        });
    });
  }
});
