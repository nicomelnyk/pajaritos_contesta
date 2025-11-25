// Form script for posting comments

document.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById('comment-text');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const statusDiv = document.getElementById('status');

  // Get post data from storage
  const { postData } = await chrome.storage.local.get(['postData']);
  
  if (!postData) {
    statusDiv.textContent = '❌ Error: No se encontró información del post. Por favor, cierra esta pestaña y vuelve a intentar.';
    statusDiv.className = 'status-error';
    return;
  }

  // Focus textarea
  setTimeout(() => textarea.focus(), 100);

  // Cancel handler
  cancelBtn.addEventListener('click', () => {
    window.close();
  });

  // Submit handler
  submitBtn.addEventListener('click', async () => {
    const commentText = textarea.value.trim();
    
    if (!commentText) {
      statusDiv.textContent = 'Por favor, ingresa un comentario';
      statusDiv.className = 'status-error';
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';
    statusDiv.textContent = '';
    statusDiv.className = '';

    // Send message to background script to post the comment
    try {
      // Use the stored tab ID from when the form was opened
      const tabId = postData.tabId;
      
      if (!tabId) {
        // Fallback: try to find Facebook tabs
        const tabs = await chrome.tabs.query({ url: ['https://www.facebook.com/*', 'https://m.facebook.com/*'] });
        
        if (tabs.length === 0) {
          throw new Error('No se encontró ninguna pestaña de Facebook abierta. Por favor, abre Facebook y vuelve a intentar.');
        }

        // Use the first Facebook tab
        const facebookTab = tabs[0];
        postData.tabId = facebookTab.id;
      }

      // Send message to content script via background script
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'post_comment_request',
          tabId: postData.tabId,
          commentText: commentText,
          postData: postData
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response && response.success) {
        statusDiv.textContent = '✅ ¡Comentario publicado exitosamente!';
        statusDiv.className = 'status-success';
        
        // Notify extension popup
        chrome.runtime.sendMessage({
          type: 'comment_success',
          message: commentText
        });

        // Close window after 1.5 seconds
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        throw new Error(response?.error || 'Error al publicar el comentario');
      }
    } catch (error) {
      statusDiv.textContent = `❌ Error: ${error.message || 'No se pudo publicar el comentario'}`;
      statusDiv.className = 'status-error';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publicar Comentario';
    }
  });

  // Enter key to submit (Ctrl+Enter or Cmd+Enter)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitBtn.click();
    }
  });
});

