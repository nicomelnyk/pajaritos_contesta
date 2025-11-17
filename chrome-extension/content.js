// Pajaritos Contesta - Manual Reply Content Script
// This script adds a button to each post for manual commenting

(function() {
  'use strict';

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Find comment button for a post
  function findCommentButton(postElement) {
    // Try attribute-based selectors first
    const selectors = [
      'div[role="button"][aria-label*="Comment"]',
      'div[role="button"][aria-label*="Comentar"]',
      'div[role="button"][aria-label*="comment"]',
      'div[role="button"][aria-label*="comentar"]',
      'a[href*="/comment"]',
      'a[href*="/comentar"]'
    ];

    for (const selector of selectors) {
      try {
        const button = postElement.querySelector(selector);
        if (button) return button;
      } catch (e) {
        console.warn('[Pajaritos] Invalid selector:', selector, e);
      }
    }

    // Fallback: look for buttons with text "Comment" or "Comentar"
    const buttons = postElement.querySelectorAll('div[role="button"], a, span[role="button"]');
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      if (text.includes('comment') || text.includes('comentar') || 
          ariaLabel.includes('comment') || ariaLabel.includes('comentar')) {
        return button;
      }
    }

    return null;
  }

  // Find comment input field
  function findCommentInput() {
    const selectors = [
      'div[contenteditable="true"][role="textbox"][aria-label*="comment"]',
      'div[contenteditable="true"][role="textbox"][aria-label*="comentar"]',
      'div[contenteditable="true"][data-testid*="comment"]',
      'textarea[placeholder*="comment"]',
      'textarea[placeholder*="comentar"]'
    ];

    for (const selector of selectors) {
      try {
        const input = document.querySelector(selector);
        if (input && input.offsetParent !== null) { // Check if visible
          return input;
        }
      } catch (e) {
        console.warn('[Pajaritos] Invalid selector:', selector, e);
      }
    }

    return null;
  }

  // Post a comment
  async function postComment(commentText) {
    const input = findCommentInput();
    if (!input) {
      console.log('[Pajaritos] Comment input not found');
      return { success: false, error: 'Comment input not found' };
    }

    try {
      // Focus and click the input
      input.focus();
      input.click();
      await wait(500);

      // Set the text content
      if (input.contentEditable === 'true') {
        input.textContent = commentText;
        input.innerText = commentText;
        
        // Trigger input events
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        
        // Also trigger keydown and keyup
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      } else {
        input.value = commentText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      await wait(800);

      // Find and click the submit button
      const submitSelectors = [
        'div[aria-label*="Post"][role="button"]',
        'div[aria-label*="Publicar"][role="button"]',
        'div[aria-label*="Comment"][role="button"]:not([aria-label*="Write"])',
        'button[type="submit"]'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        const buttons = document.querySelectorAll(selector);
        for (const btn of buttons) {
          // Check if button is visible and near the input
          if (btn.offsetParent !== null) {
            submitButton = btn;
            break;
          }
        }
        if (submitButton) break;
      }

      // Fallback: look for button near the input
      if (!submitButton) {
        const parent = input.closest('form') || input.closest('div[role="article"]') || input.parentElement;
        const buttons = parent?.querySelectorAll('button[type="submit"], div[role="button"]');
        if (buttons) {
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if ((text.includes('post') || text.includes('publicar') || text.includes('comment') || text.includes('comentar')) && btn.offsetParent !== null) {
              submitButton = btn;
              break;
            }
          }
        }
      }

      if (submitButton) {
        submitButton.click();
        console.log('[Pajaritos] Comment posted:', commentText);
        await wait(500);
        return { success: true };
      } else {
        console.log('[Pajaritos] Submit button not found');
        return { success: false, error: 'Submit button not found' };
      }
    } catch (error) {
      console.error('[Pajaritos] Error posting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Create reply button for a post
  function createReplyButton(postElement) {
    // Check if button already exists
    if (postElement.querySelector('.pajaritos-reply-btn')) {
      return;
    }

    // Find where to insert the button (near comment button)
    const commentButton = findCommentButton(postElement);
    if (!commentButton) return;

    // Create button
    const replyBtn = document.createElement('div');
    replyBtn.className = 'pajaritos-reply-btn';
    replyBtn.innerHTML = '🐦 Reply';
    replyBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      margin-left: 8px;
      background: #1877f2;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    `;

    replyBtn.addEventListener('mouseenter', () => {
      replyBtn.style.background = '#166fe5';
    });

    replyBtn.addEventListener('mouseleave', () => {
      replyBtn.style.background = '#1877f2';
    });

    // Add click handler
    replyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Show form
      showReplyForm(postElement, replyBtn);
    });

    // Insert button near comment button
    const parent = commentButton.parentElement;
    if (parent) {
      parent.appendChild(replyBtn);
    } else {
      commentButton.insertAdjacentElement('afterend', replyBtn);
    }
  }

  // Show reply form
  function showReplyForm(postElement, triggerButton) {
    // Remove existing form if any
    const existingForm = document.querySelector('.pajaritos-form-overlay');
    if (existingForm) {
      existingForm.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'pajaritos-form-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create form
    const form = document.createElement('div');
    form.className = 'pajaritos-form';
    form.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    form.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: #1877f2; font-size: 20px;">🐦 Pajaritos Contesta</h2>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Your Response:</label>
        <textarea id="pajaritos-comment-text" placeholder="Type your comment here..." style="
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 2px solid #e4e6eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
        "></textarea>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="pajaritos-cancel-btn" style="
          padding: 10px 20px;
          border: 1px solid #e4e6eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #333;
        ">Cancel</button>
        <button id="pajaritos-submit-btn" style="
          padding: 10px 20px;
          border: none;
          background: #1877f2;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Post Comment</button>
      </div>
      <div id="pajaritos-status" style="margin-top: 12px; font-size: 14px;"></div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const textarea = form.querySelector('#pajaritos-comment-text');
    const submitBtn = form.querySelector('#pajaritos-submit-btn');
    const cancelBtn = form.querySelector('#pajaritos-cancel-btn');
    const statusDiv = form.querySelector('#pajaritos-status');

    // Focus textarea
    setTimeout(() => textarea.focus(), 100);

    // Cancel handler
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Submit handler
    submitBtn.addEventListener('click', async () => {
      const commentText = textarea.value.trim();
      
      if (!commentText) {
        statusDiv.textContent = 'Please enter a comment';
        statusDiv.style.color = '#f02849';
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';
      submitBtn.style.opacity = '0.6';
      statusDiv.textContent = '';
      statusDiv.style.color = '';

      // Click comment button first
      const commentButton = findCommentButton(postElement);
      if (commentButton) {
        commentButton.click();
        await wait(1000);
      }

      // Post comment
      const result = await postComment(commentText);

      if (result.success) {
        statusDiv.textContent = '✅ Comment posted successfully!';
        statusDiv.style.color = '#42b72a';
        
        // Notify extension popup
        chrome.runtime.sendMessage({
          type: 'comment_success',
          message: commentText
        });

        // Close form after 1.5 seconds
        setTimeout(() => {
          overlay.remove();
        }, 1500);
      } else {
        statusDiv.textContent = `❌ Error: ${result.error || 'Failed to post comment'}`;
        statusDiv.style.color = '#f02849';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Comment';
        submitBtn.style.opacity = '1';
      }
    });

    // Enter key to submit
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        submitBtn.click();
      }
    });
  }

  // Add buttons to all posts
  function addButtonsToPosts() {
    const postSelectors = [
      'div[data-pagelet*="FeedUnit"]',
      'div[role="article"]',
      'div[data-testid*="post"]'
    ];

    let posts = [];
    for (const selector of postSelectors) {
      posts = document.querySelectorAll(selector);
      if (posts.length > 0) break;
    }

    posts.forEach(post => {
      if (!post.querySelector('.pajaritos-reply-btn')) {
        createReplyButton(post);
      }
    });
  }

  // Observer for new posts
  const observer = new MutationObserver(() => {
    addButtonsToPosts();
  });

  // Start observing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      addButtonsToPosts();
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    addButtonsToPosts();
  }

  // Periodic check
  setInterval(() => {
    addButtonsToPosts();
  }, 3000);

  console.log('[Pajaritos Contesta] Content script loaded - Manual mode');
})();
