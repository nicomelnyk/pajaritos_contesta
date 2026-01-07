// Popup script for showing success notifications

document.addEventListener('DOMContentLoaded', () => {
  // Set icon path using chrome.runtime.getURL
  const iconElement = document.getElementById('popup-icon');
  if (iconElement) {
    try {
      const iconUrl = chrome.runtime.getURL('icon48.png');
      iconElement.src = iconUrl;
      iconElement.onerror = function() {
        // Fallback to emoji if image fails to load
        this.style.display = 'none';
        const emoji = document.createTextNode('🐦');
        this.parentNode.insertBefore(emoji, this);
      };
    } catch (error) {
      console.error('Error loading icon:', error);
    }
  }

  const statusList = document.getElementById('statusList');
  const clearBtn = document.getElementById('clearBtn');

  // Load status history
  function loadStatusHistory() {
    chrome.storage.local.get(['commentHistory'], (result) => {
      const history = result.commentHistory || [];
      
      if (history.length === 0) {
        statusList.innerHTML = `
          <div style="color: #65676b; font-size: 13px; text-align: center; padding: 20px 0;">
            Aún no se publicaron comentarios.<br>
            ¡Hacé clic en "🐦" en cualquier post de Facebook para comenzar!<br>
            El botón se ve cuando seleccionan "Comentar" en una publicación
          </div>
        `;
        clearBtn.style.display = 'none';
        return;
      }

      clearBtn.style.display = 'block';
      
      // Show last 5 items
      const recentHistory = history.slice(-5).reverse();
      
      statusList.innerHTML = recentHistory.map(item => {
        const time = new Date(item.timestamp);
        const timeStr = time.toLocaleTimeString();
        const dateStr = time.toLocaleDateString();
        
        return `
          <div class="status-item">
            <div class="${item.success ? 'status-success' : 'status-error'}">
              ${item.success ? '✅' : '❌'} ${item.message || 'Comentario publicado'}
            </div>
            <div class="status-time">${dateStr} a las ${timeStr}</div>
          </div>
        `;
      }).join('');
    });
  }

  // Clear history
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ commentHistory: [] }, () => {
      loadStatusHistory();
    });
  });

  // Listen for new comments
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'comment_success') {
      // Add to history
      chrome.storage.local.get(['commentHistory'], (result) => {
        const history = result.commentHistory || [];
        history.push({
          success: true,
          message: message.message,
          timestamp: Date.now()
        });
        
        // Keep only last 1000 items
        if (history.length > 1000) {
          history.shift();
        }
        
        chrome.storage.local.set({ commentHistory: history }, () => {
          loadStatusHistory();
        });
      });
    }
  });

  // Load on open
  loadStatusHistory();
  
  // Refresh every 2 seconds to catch new messages
  setInterval(loadStatusHistory, 2000);
});
