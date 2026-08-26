document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Find the target text block via the data-target attribute
      const targetId = button.getAttribute('data-target');
      const textContent = document.getElementById(targetId).innerText;

      try {
        // Copy to clipboard
        await navigator.clipboard.writeText(textContent);

        // Visual feedback for success
        const btnText = button.querySelector('.btn-text');
        const originalText = btnText.textContent;
        
        button.classList.add('success');
        btnText.textContent = 'Copied!';

        // Revert back after 2 seconds
        setTimeout(() => {
          button.classList.remove('success');
          btnText.textContent = originalText;
        }, 2000);
        
      } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard.');
      }
    });
  });
});
