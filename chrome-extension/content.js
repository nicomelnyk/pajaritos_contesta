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
      'span[role="button"][aria-label*="Comment"]',
      'span[role="button"][aria-label*="Comentar"]',
      'a[href*="/comment"]',
      'a[href*="/comentar"]'
    ];

    for (const selector of selectors) {
      try {
        const button = postElement.querySelector(selector);
        if (button && button.offsetParent !== null) return button;
      } catch (e) {
        console.warn('[Pajaritos] Invalid selector:', selector, e);
      }
    }

    // Fallback: look for buttons with text "Comment" or "Comentar"
    // Look in the action buttons area (usually near Like/Share buttons)
    const actionAreas = postElement.querySelectorAll('div[role="button"], span[role="button"], a');
    for (const button of actionAreas) {
      if (button.offsetParent === null) continue; // Skip hidden buttons
      
      const text = button.textContent?.toLowerCase().trim() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const title = button.getAttribute('title')?.toLowerCase() || '';
      
      // Check if it's a comment button
      if (text === 'comentar' || text === 'comment' ||
          ariaLabel.includes('comment') || ariaLabel.includes('comentar') ||
          title.includes('comment') || title.includes('comentar')) {
        return button;
      }
    }

    // Last resort: look for the "Comentar" text in the post's action area
    // Facebook often has the comment button near "Me gusta" and "Compartir"
    const allText = postElement.textContent || '';
    if (allText.includes('Comentar') || allText.includes('Comment')) {
      // Find the parent container that has these action buttons
      const actionContainer = postElement.querySelector('div[role="group"]') || 
                            postElement.querySelector('div[role="toolbar"]') ||
                            Array.from(postElement.querySelectorAll('div')).find(div => {
                              const txt = div.textContent?.toLowerCase() || '';
                              return (txt.includes('me gusta') || txt.includes('like')) && 
                                     (txt.includes('comentar') || txt.includes('comment'));
                            });
      
      if (actionContainer) {
        const commentBtn = actionContainer.querySelector('div[role="button"], span[role="button"]');
        if (commentBtn) return commentBtn;
      }
    }

    return null;
  }

  // Find comment input field - specifically for MAIN POST, not comment replies
  function findCommentInput(postElement) {
    // First, try to find input in the main post's comment area
    // Look for the main post's comment section (not nested in comments)
    const mainPostCommentArea = postElement.querySelector('div[data-testid*="comment"]') ||
                                Array.from(postElement.querySelectorAll('div')).find(div => {
                                  const placeholder = div.getAttribute('placeholder')?.toLowerCase() || '';
                                  return placeholder.includes('comentario público') || 
                                         placeholder.includes('public comment');
                                });
    
    if (mainPostCommentArea) {
      // Look for input in this specific area
      const input = mainPostCommentArea.querySelector('div[contenteditable="true"][role="textbox"]') ||
                   mainPostCommentArea.querySelector('div[contenteditable="true"]') ||
                   mainPostCommentArea.querySelector('textarea');
      
      if (input && input.offsetParent !== null) {
        console.log('[Pajaritos] Found main post comment input');
        return input;
      }
    }
    
    // Fallback: look for inputs but exclude ones that are clearly reply inputs
    const selectors = [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'div[role="textbox"][contenteditable]',
      'textarea'
    ];

    for (const selector of selectors) {
      try {
        const inputs = document.querySelectorAll(selector);
        for (const input of inputs) {
          if (input.offsetParent === null) continue; // Skip hidden
          
          // Skip if it's clearly a reply input (has "respuesta" or "reply" in placeholder)
          const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
          if (placeholder.includes('respuesta') || placeholder.includes('reply')) {
            continue; // Skip reply inputs
          }
          
          // Check if it's in a comment reply container
          const isInReply = input.closest('[data-testid*="comment"]')?.querySelector('[data-testid*="comment"]') !== null;
          if (isInReply) {
            continue; // Skip if nested in a comment
          }
          
          // Prefer inputs with "comentario público" or "public comment"
          if (placeholder.includes('comentario público') || placeholder.includes('public comment')) {
            console.log('[Pajaritos] Found main post input by placeholder');
            return input;
          }
          
          // Check if it's near the main post (not deep in comments)
          const distanceFromPost = postElement.contains(input) ? 0 : 999;
          if (distanceFromPost === 0) {
            const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
            const dataTestId = input.getAttribute('data-testid')?.toLowerCase() || '';
            
            if (ariaLabel.includes('comment') || ariaLabel.includes('comentar') ||
                dataTestId.includes('comment') || dataTestId.includes('comentar') ||
                selector === 'div[contenteditable="true"][role="textbox"]') {
              console.log('[Pajaritos] Found input in main post area');
              return input;
            }
          }
        }
      } catch (e) {
        console.warn('[Pajaritos] Invalid selector:', selector, e);
      }
    }

    return null;
  }

  // Post a comment on the main post
  async function postComment(commentText, postElement) {
    const input = findCommentInput(postElement);
    if (!input) {
      console.log('[Pajaritos] Main post comment input not found');
      return { success: false, error: 'Main post comment input not found' };
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
      // First, try to find button near the input (most reliable)
      let submitButton = null;
      
      // Look in the same container as the input
      const inputContainer = input.closest('div[role="textbox"]')?.parentElement ||
                            input.closest('form') ||
                            input.closest('div[data-testid*="comment"]') ||
                            input.parentElement?.parentElement;
      
      if (inputContainer) {
        // Look for submit button in the container
        const buttons = inputContainer.querySelectorAll('div[role="button"], span[role="button"], button[type="submit"], button');
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue; // Skip hidden
          
          const text = btn.textContent?.toLowerCase().trim() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const title = btn.getAttribute('title')?.toLowerCase() || '';
          
          // Check if it's a submit button
          if (text === 'publicar' || text === 'post' || 
              ariaLabel.includes('publicar') || ariaLabel.includes('post') ||
              title.includes('publicar') || title.includes('post') ||
              btn.type === 'submit') {
            submitButton = btn;
            console.log('[Pajaritos] Found submit button near input:', text || ariaLabel);
            break;
          }
        }
      }
      
      // If not found, try global selectors
      if (!submitButton) {
        const submitSelectors = [
          'div[aria-label*="Post"][role="button"]',
          'div[aria-label*="Publicar"][role="button"]',
          'div[aria-label*="Comment"][role="button"]:not([aria-label*="Write"])',
          'button[type="submit"]'
        ];

        for (const selector of submitSelectors) {
          try {
            const buttons = document.querySelectorAll(selector);
            for (const btn of buttons) {
              // Check if button is visible and near the input
              if (btn.offsetParent !== null) {
                // Check if it's near our input
                const btnRect = btn.getBoundingClientRect();
                const inputRect = input.getBoundingClientRect();
                const distance = Math.abs(btnRect.top - inputRect.bottom);
                
                if (distance < 100) { // Within 100px of input
                  submitButton = btn;
                  console.log('[Pajaritos] Found submit button with selector:', selector);
                  break;
                }
              }
            }
            if (submitButton) break;
          } catch (e) {
            console.warn('[Pajaritos] Invalid selector:', selector);
          }
        }
      }
      
      // Last resort: look for any button with submit-like text near input
      if (!submitButton) {
        const allButtons = document.querySelectorAll('div[role="button"], button');
        for (const btn of allButtons) {
          if (btn.offsetParent === null) continue;
          
          const btnRect = btn.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          const distance = Math.abs(btnRect.top - inputRect.bottom);
          
          if (distance < 50) { // Very close to input
            const text = btn.textContent?.toLowerCase() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            if (text.includes('publicar') || text.includes('post') || 
                ariaLabel.includes('publicar') || ariaLabel.includes('post')) {
              submitButton = btn;
              console.log('[Pajaritos] Found submit button by proximity:', text || ariaLabel);
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
      return false;
    }

    // Find where to insert the button (near comment button or action buttons)
    const commentButton = findCommentButton(postElement);
    
    // If no comment button found, try to find the action buttons area
    let insertTarget = commentButton;
    if (!insertTarget) {
      // Look for the action buttons container (where Like/Comment/Share buttons are)
      const actionContainer = postElement.querySelector('div[role="group"]') || 
                            postElement.querySelector('div[role="toolbar"]') ||
                            Array.from(postElement.querySelectorAll('div')).find(div => {
                              const txt = div.textContent?.toLowerCase() || '';
                              return (txt.includes('me gusta') || txt.includes('like')) && 
                                     (txt.includes('compartir') || txt.includes('share'));
                            });
      
      if (actionContainer) {
        insertTarget = actionContainer;
        console.log('[Pajaritos] Using action container as insert target');
      } else {
        console.log('[Pajaritos] Comment button and action area not found for post');
        return false;
      }
    }

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

    // Insert button near comment button or action area
    if (insertTarget === commentButton) {
      // Insert next to comment button
      const parent = commentButton.parentElement;
      if (parent) {
        parent.appendChild(replyBtn);
        console.log('[Pajaritos] Reply button added next to comment button');
        return true;
      } else {
        commentButton.insertAdjacentElement('afterend', replyBtn);
        console.log('[Pajaritos] Reply button added after comment button');
        return true;
      }
    } else {
      // Insert in action container
      insertTarget.appendChild(replyBtn);
      console.log('[Pajaritos] Reply button added to action container');
      return true;
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

      // Click the main post's comment button (not comment replies)
      // Find the main post's action area (where Like/Comment/Share buttons are)
      const mainPostActions = postElement.querySelector('div[role="group"]') || 
                             postElement.querySelector('div[role="toolbar"]') ||
                             Array.from(postElement.querySelectorAll('div')).find(div => {
                               const txt = div.textContent?.toLowerCase() || '';
                               return (txt.includes('me gusta') || txt.includes('like')) && 
                                      (txt.includes('compartir') || txt.includes('share'));
                             });
      
      if (mainPostActions) {
        // Find the "Comentar" button in the main actions (not "Responder")
        const buttons = mainPostActions.querySelectorAll('div[role="button"], span[role="button"], a');
        let clicked = false;
        
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase().trim() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          
          // Look for main post comment button (not reply button)
          if ((text === 'comentar' || text === 'comment' ||
               ariaLabel.includes('comentar') || ariaLabel.includes('comment')) &&
              !text.includes('responder') && !text.includes('reply') &&
              !ariaLabel.includes('responder') && !ariaLabel.includes('reply')) {
            console.log('[Pajaritos] Clicking main post comment button');
            btn.click();
            await wait(1500);
            clicked = true;
            break;
          }
        }
        
        if (!clicked) {
          console.log('[Pajaritos] Main comment button not found, trying second button in actions');
          // Fallback: click the second button (usually Comment is second after Like)
          if (buttons.length >= 2) {
            buttons[1].click();
            await wait(1500);
          }
        }
      } else {
        console.log('[Pajaritos] Main post actions not found');
      }

      // Post comment on the main post
      const result = await postComment(commentText, postElement);

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

  // Check if an element is a main post (not a comment)
  function isMainPost(element) {
    // Skip if this element is clearly inside a comment reply
    const commentContainer = element.closest('[data-testid*="comment"]');
    if (commentContainer) {
      // If we're inside a comment container, check if it's nested in another article
      const parentArticle = commentContainer.closest('div[role="article"]');
      if (parentArticle && parentArticle !== element) {
        // This is a comment nested inside another post - skip it
        return false;
      }
    }
    
    // Main posts usually have:
    // 1. Action buttons area (Like/Comment/Share)
    // 2. Or data-pagelet with FeedUnit
    // 3. Or text content with "Me gusta" or "Like"
    const hasActionButtons = element.querySelector('div[role="group"]') !== null ||
                            element.querySelector('div[role="toolbar"]') !== null;
    const hasFeedUnit = element.getAttribute('data-pagelet')?.includes('FeedUnit');
    const hasPostText = element.textContent?.includes('Me gusta') ||
                       element.textContent?.includes('Like') ||
                       element.textContent?.includes('Compartir') ||
                       element.textContent?.includes('Share');
    
    // If it has any of these, it's likely a main post
    return hasActionButtons || hasFeedUnit || hasPostText;
  }

  // Add buttons to all posts
  function addButtonsToPosts() {
    const postSelectors = [
      'div[data-pagelet*="FeedUnit"]',
      'div[role="article"]',
      'div[data-testid*="post"]',
      'div[data-ad-preview="message"]',
      'div[data-ad-comet-preview="message"]'
    ];

    let posts = [];
    for (const selector of postSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        // Filter to only main posts, not comments
        const filtered = Array.from(found).filter(post => {
          const isMain = isMainPost(post);
          if (!isMain) {
            console.log('[Pajaritos] Skipping element (not a main post):', post);
          }
          return isMain;
        });
        if (filtered.length > 0) {
          posts = filtered;
          console.log(`[Pajaritos] Found ${posts.length} main posts using selector: ${selector} (out of ${found.length} total)`);
          break;
        } else {
          console.log(`[Pajaritos] Found ${found.length} elements with selector ${selector}, but none are main posts`);
        }
      }
    }

    if (posts.length === 0) {
      // Try a more general approach - look for posts by finding main comment buttons
      // Only get buttons that are in the main post action area, not comment replies
      const allCommentButtons = document.querySelectorAll('div[role="button"][aria-label*="Comment"], div[role="button"][aria-label*="Comentar"]');
      console.log(`[Pajaritos] Found ${allCommentButtons.length} comment buttons`);
      
      allCommentButtons.forEach(btn => {
        // Skip if this is a reply button (inside a comment)
        if (btn.closest('[data-testid*="comment"]') && 
            btn.closest('[data-testid*="comment"]') !== btn.closest('div[role="article"]')) {
          return; // Skip comment reply buttons
        }
        
        // Find the post container (go up the DOM tree)
        let post = btn.closest('div[role="article"]') || 
                   btn.closest('div[data-pagelet]') ||
                   btn.closest('div[data-testid*="post"]') ||
                   btn.closest('div').parentElement?.parentElement;
        
        // Make sure it's a main post
        if (post && isMainPost(post) && !post.querySelector('.pajaritos-reply-btn')) {
          posts.push(post);
        }
      });
    }

    console.log(`[Pajaritos] Processing ${posts.length} posts`);
    
    let buttonsAdded = 0;
    posts.forEach(post => {
      if (!post.querySelector('.pajaritos-reply-btn')) {
        const success = createReplyButton(post);
        if (success) buttonsAdded++;
      }
    });
    
    if (buttonsAdded > 0) {
      console.log(`[Pajaritos] Added ${buttonsAdded} reply buttons`);
    }
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

  // Initial check after a delay
  setTimeout(() => {
    console.log('[Pajaritos Contesta] Running initial post scan...');
    addButtonsToPosts();
  }, 2000);

  console.log('[Pajaritos Contesta] Content script loaded - Manual mode');
  console.log('[Pajaritos] Current URL:', window.location.href);
  console.log('[Pajaritos] Ready to add reply buttons to posts');
})();
