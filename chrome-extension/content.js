// Pajaritos Contesta - Manual Reply Content Script
// This script adds a button to each post for manual commenting

(function() {
  'use strict';

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Find comment button for a post
  function findCommentButton(postElement) {
    console.log('[Pajaritos] Looking for comment button in post...');
    console.log('[Pajaritos] Post element:', postElement);
    
    // First, try to find the button in the post element or its parent
    // Sometimes the post element is just the message container, and buttons are in a sibling/parent
    let searchRoot = postElement;
    
    // Try parent element if post element doesn't have buttons
    const parent = postElement.parentElement;
    if (parent) {
      // Check if parent has the buttons
      const parentHasButtons = parent.querySelector('div[data-ad-rendering-role="comment_button"]') ||
                               parent.querySelector('div[role="button"][aria-label="Dejar un comentario"]');
      if (parentHasButtons) {
        console.log('[Pajaritos] Buttons found in parent, using parent as search root');
        searchRoot = parent;
      }
    }
    
    // Try data-ad-rendering-role="comment_button" first (most reliable)
    const byDataRole = searchRoot.querySelector('div[data-ad-rendering-role="comment_button"]')?.closest('div[role="button"]');
    if (byDataRole) {
      console.log('[Pajaritos] Found comment button by data-ad-rendering-role="comment_button"');
      return byDataRole;
    }
    
    // Try aria-label="Dejar un comentario" (main post comment button)
    const byAriaLabel = searchRoot.querySelector('div[role="button"][aria-label="Dejar un comentario"]');
    if (byAriaLabel) {
      console.log('[Pajaritos] Found comment button by aria-label="Dejar un comentario"');
      return byAriaLabel;
    }
    
    // Try exact match (aria-label="Comentar") - use searchRoot
    const exactMatch = searchRoot.querySelector('div[role="button"][aria-label="Comentar"]') ||
                      searchRoot.querySelector('div[role="button"][aria-label="Comment"]');
    if (exactMatch) {
      console.log('[Pajaritos] Found comment button by exact aria-label match');
      return exactMatch;
    }
    
    // Try attribute-based selectors (search in both post and parent)
    const selectors = [
      'div[role="button"][aria-label*="Dejar un comentario"]',
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
        const button = searchRoot.querySelector(selector);
        if (button) {
          // Don't check offsetParent for disabled buttons - they might still be visible
          // Just check if it exists and has the right aria-label
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          if (ariaLabel.includes('comentar') || ariaLabel.includes('comment') || ariaLabel.includes('dejar un comentario')) {
            // Make sure it's not a reply button
            if (!ariaLabel.includes('responder') && !ariaLabel.includes('reply')) {
              console.log('[Pajaritos] Found comment button with selector:', selector);
              return button;
            }
          }
        }
      } catch (e) {
        console.warn('[Pajaritos] Invalid selector:', selector, e);
      }
    }

    // Fallback: look for buttons with text "Comment" or "Comentar"
    // Look in the action buttons area (usually near Like/Share buttons)
    const actionAreas = searchRoot.querySelectorAll('div[role="button"], span[role="button"], a');
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
    const allText = searchRoot.textContent || '';
    if (allText.includes('Comentar') || allText.includes('Comment')) {
      // Find the parent container that has these action buttons
      const actionContainer = searchRoot.querySelector('div[role="group"]') || 
                            searchRoot.querySelector('div[role="toolbar"]') ||
                            Array.from(searchRoot.querySelectorAll('div')).find(div => {
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
    console.log('[Pajaritos] Looking for main post comment input...');
    
    // First, try to find input in the main post's comment area
    // Look for the main post's comment section (not nested in comments)
    // The main post comment area should be directly in the post, not nested in comment replies
    const allDivs = postElement.querySelectorAll('div');
    let mainPostCommentArea = null;
    
    for (const div of allDivs) {
      const placeholder = div.getAttribute('placeholder')?.toLowerCase() || '';
      if (placeholder.includes('comentario público') || placeholder.includes('public comment')) {
        // Check if this is NOT nested in a comment reply
        const isInReply = div.closest('[data-testid*="comment"]')?.querySelector('[data-testid*="comment"]') !== null;
        if (!isInReply) {
          mainPostCommentArea = div;
          console.log('[Pajaritos] Found main post comment area by placeholder');
          break;
        }
      }
    }
    
    if (mainPostCommentArea) {
      // Look for input in this specific area
      const input = mainPostCommentArea.querySelector('div[contenteditable="true"][role="textbox"]') ||
                   mainPostCommentArea.querySelector('div[contenteditable="true"]') ||
                   mainPostCommentArea.querySelector('textarea');
      
      if (input && input.offsetParent !== null) {
        console.log('[Pajaritos] ✅ Found main post comment input in comment area');
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
          
          const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
          const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
          const ariaPlaceholder = input.getAttribute('aria-placeholder')?.toLowerCase() || '';
          
          console.log(`[Pajaritos] Checking input: placeholder="${placeholder}", aria-label="${ariaLabel}", aria-placeholder="${ariaPlaceholder}"`);
          
          // FIRST: Check if it's in the main post area (not nested in comments)
          // This is the most reliable way to identify main post inputs
          let isInMainPost = false;
          let depth = 0;
          if (postElement.contains(input)) {
            let current = input.parentElement;
            while (current && current !== postElement && depth < 10) {
              if (current.getAttribute('data-testid')?.includes('comment')) {
                depth++;
              }
              current = current.parentElement;
            }
            
            // If it's in the main post and not too deep, it's likely the main post input
            if (depth <= 1) {
              isInMainPost = true;
              console.log('[Pajaritos] Input is in main post area (depth: ' + depth + ')');
            }
          }
          
          // Prefer main post inputs: "comentario público" or "public comment"
          if (placeholder.includes('comentario público') || placeholder.includes('public comment') ||
              ariaLabel.includes('comentario público') || ariaLabel.includes('public comment') ||
              ariaPlaceholder.includes('comentario público') || ariaPlaceholder.includes('public comment')) {
            console.log('[Pajaritos] ✅ Found main post input by placeholder/aria-label (comentario público)');
            return input;
          }
          
          // If it's in the main post area, accept it even if it says "respuesta"
          // (In group posts, main post inputs sometimes use "respuesta" instead of "comentario público")
          if (isInMainPost) {
            console.log('[Pajaritos] ✅ Found input in main post area - accepting even if it says "respuesta"');
            return input;
          }
          
          // Check if it's in a comment reply container (nested comments)
          const commentContainer = input.closest('[data-testid*="comment"]');
          if (commentContainer) {
            // Check if this comment container is itself inside another comment
            const parentComment = commentContainer.parentElement?.closest('[data-testid*="comment"]');
            if (parentComment) {
              console.log('[Pajaritos] ⏭️ Skipping - input is nested in a comment reply');
              continue; // Skip if nested in a comment
            }
          }
          
          // Skip if it's clearly a reply input AND not in main post area
          // (Only skip if it's nested in comments)
          if (!isInMainPost && (placeholder.includes('respuesta') || placeholder.includes('reply') ||
              placeholder.includes('escribe una respuesta') ||
              ariaLabel.includes('respuesta') || ariaLabel.includes('reply') ||
              ariaPlaceholder.includes('respuesta') || ariaPlaceholder.includes('reply'))) {
            console.log('[Pajaritos] ⏭️ Skipping - this is a reply input (respuesta) and not in main post area');
            continue; // Skip reply inputs that are not in main post
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
    console.log('[Pajaritos] createReplyButton called for post element');
    
    // Check if button already exists
    if (postElement.querySelector('.pajaritos-reply-btn')) {
      console.log('[Pajaritos] Button already exists, skipping');
      return false;
    }

    // Find where to insert the button (near comment button or action buttons)
    const commentButton = findCommentButton(postElement);
    console.log('[Pajaritos] Comment button found:', commentButton ? 'YES' : 'NO');
    
    // If no comment button found, try to find the action buttons area
    let insertTarget = commentButton;
    if (!insertTarget) {
      console.log('[Pajaritos] No comment button, looking for action container...');
      // Look for the action buttons container (where Like/Comment/Share buttons are)
      // First, try to find container with data-ad-rendering-role="comment_button"
      // Search in both post element and its parent
      let searchRoot = postElement;
      const parent = postElement.parentElement;
      if (parent) {
        const parentHasButtons = parent.querySelector('div[data-ad-rendering-role="comment_button"]') ||
                                 parent.querySelector('div[role="button"][aria-label*="Comentar"]');
        if (parentHasButtons) {
          searchRoot = parent;
          console.log('[Pajaritos] Action buttons found in parent, using parent for search');
        }
      }
      
      const commentButtonElement = searchRoot.querySelector('div[data-ad-rendering-role="comment_button"]');
      let actionContainer = null;
      
      if (commentButtonElement) {
        // Find the parent container that holds all action buttons
        actionContainer = commentButtonElement.closest('div.x9f619.x1n2onr6.x1ja2u2z.x78zum5') ||
                         commentButtonElement.closest('div.xbmvrgn.x1diwwjn') ||
                         commentButtonElement.closest('div');
        console.log('[Pajaritos] Found action container via comment button element');
      }
      
      // If not found, try other selectors
      if (!actionContainer) {
        actionContainer = searchRoot.querySelector('div[role="group"]') || 
                         searchRoot.querySelector('div[role="toolbar"]') ||
                         // Look for container with "Me gusta" and "Comentar" text
                         Array.from(searchRoot.querySelectorAll('div')).find(div => {
                           const txt = div.textContent?.toLowerCase() || '';
                           return (txt.includes('me gusta') || txt.includes('like')) && 
                                  (txt.includes('comentar') || txt.includes('comment')) &&
                                  (txt.includes('compartir') || txt.includes('share'));
                         });
      }
      
      if (actionContainer) {
        insertTarget = actionContainer;
        console.log('[Pajaritos] ✅ Using action container as insert target');
      } else {
        // Last resort: find any container with "Comentar" text (search in post and parent)
        console.log('[Pajaritos] Action container not found, trying fallback...');
        let fallbackContainer = Array.from(postElement.querySelectorAll('div')).find(div => {
          const txt = div.textContent?.toLowerCase() || '';
          return txt.includes('comentar') && txt.includes('compartir');
        });
        
        if (!fallbackContainer && parent) {
          fallbackContainer = Array.from(parent.querySelectorAll('div')).find(div => {
            const txt = div.textContent?.toLowerCase() || '';
            return txt.includes('comentar') && txt.includes('compartir');
          });
        }
        
        if (fallbackContainer) {
          insertTarget = fallbackContainer;
          console.log('[Pajaritos] ✅ Using fallback container with Comentar/Compartir');
        } else {
          // Last last resort: try to find ANY container with action buttons or just append to post
          console.log('[Pajaritos] All fallbacks failed, trying to find any action-like container...');
          
          // Look for any div that contains "Me gusta" or "Like"
          const anyActionContainer = Array.from(postElement.querySelectorAll('div')).find(div => {
            const txt = div.textContent?.toLowerCase() || '';
            return txt.includes('me gusta') || txt.includes('like');
          });
          
          if (anyActionContainer) {
            insertTarget = anyActionContainer;
            console.log('[Pajaritos] ✅ Using container with "Me gusta" text');
          } else if (parent) {
            // Try parent's containers
            const parentActionContainer = Array.from(parent.querySelectorAll('div')).find(div => {
              const txt = div.textContent?.toLowerCase() || '';
              return (txt.includes('me gusta') || txt.includes('like')) && 
                     (txt.includes('comentar') || txt.includes('comment'));
            });
            if (parentActionContainer) {
              insertTarget = parentActionContainer;
              console.log('[Pajaritos] ✅ Using parent container with action buttons');
            } else {
              // Final fallback: append to post element itself
              insertTarget = postElement;
              console.log('[Pajaritos] ⚠️ Using post element itself as last resort');
            }
          } else {
            console.log('[Pajaritos] ❌ Comment button and action area not found for post');
            console.log('[Pajaritos] Post element:', postElement);
            console.log('[Pajaritos] Post text preview:', postElement.textContent?.substring(0, 300));
            return false;
          }
        }
      }
    } else {
      console.log('[Pajaritos] ✅ Using comment button as insert target');
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
      console.log('[Pajaritos] Inserting button next to comment button...');
      // Insert next to comment button
      const parent = commentButton.parentElement;
      if (parent) {
        parent.appendChild(replyBtn);
        console.log('[Pajaritos] ✅ Reply button added next to comment button');
        return true;
      } else {
        commentButton.insertAdjacentElement('afterend', replyBtn);
        console.log('[Pajaritos] ✅ Reply button added after comment button');
        return true;
      }
    } else {
      console.log('[Pajaritos] Inserting button in action container...');
      // Insert in action container
      try {
        insertTarget.appendChild(replyBtn);
        console.log('[Pajaritos] ✅ Reply button added to action container');
        return true;
      } catch (e) {
        console.error('[Pajaritos] ❌ Error inserting button:', e);
        return false;
      }
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
        console.log(`[Pajaritos] Found ${buttons.length} buttons in main post actions`);
        
        let clicked = false;
        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i];
          const text = btn.textContent?.toLowerCase().trim() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          
          console.log(`[Pajaritos] Button ${i}: text="${text}", aria-label="${ariaLabel}"`);
          
          // Look for main post comment button (not reply button)
          if ((text === 'comentar' || text === 'comment' ||
               ariaLabel.includes('comentar') || ariaLabel.includes('comment')) &&
              !text.includes('responder') && !text.includes('reply') &&
              !ariaLabel.includes('responder') && !ariaLabel.includes('reply')) {
            console.log('[Pajaritos] ✅ Clicking main post comment button (button ' + i + ')');
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await wait(300);
            btn.click();
            await wait(1500);
            clicked = true;
            break;
          }
        }
        
        if (!clicked) {
          console.log('[Pajaritos] Main comment button not found by text, trying second button in actions');
          // Fallback: click the second button (usually Comment is second after Like)
          if (buttons.length >= 2) {
            console.log('[Pajaritos] Clicking button 1 (usually Comment)');
            buttons[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            await wait(300);
            buttons[1].click();
            await wait(1500);
          }
        }
      } else {
        console.log('[Pajaritos] ❌ Main post actions not found');
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
    // FIRST: Check for post attributes - these are the strongest indicator
    // If we have post attributes, we can skip most other checks
    const hasPostAttributes = element.getAttribute('data-ad-preview') === 'message' ||
                             element.getAttribute('data-ad-comet-preview') === 'message' ||
                             element.getAttribute('data-pagelet')?.includes('FeedUnit');
    
    // Make sure it's NOT a reply input ("Escribe una respuesta") - this is the STRICTEST check
    const hasReplyInput = element.querySelector('div[contenteditable="true"][aria-label*="respuesta"]') !== null ||
                         element.querySelector('div[contenteditable="true"][aria-placeholder*="respuesta"]') !== null ||
                         element.querySelector('div[contenteditable="true"][aria-label*="reply"]') !== null;
    
    if (hasReplyInput) {
      console.log('[Pajaritos] ❌ Rejected: Has reply input ("Escribe una respuesta"), not main post');
      return false;
    }
    
    // If it has post attributes and no reply input, it's likely a main post
    // But check if it's nested in a comment structure first
    if (hasPostAttributes) {
      // Check if this is nested inside a comment container
      const commentContainer = element.closest('[data-testid*="comment"]');
      if (commentContainer) {
        const parentArticle = commentContainer.closest('div[role="article"]');
        if (parentArticle && parentArticle !== element) {
          console.log('[Pajaritos] ❌ Rejected: Has post attributes but nested in another article');
          return false;
        }
      }
      // Check for reply buttons more specifically (only actual buttons, not just text)
      const hasReplyButton = element.querySelector('div[role="button"][aria-label*="Responder"]') !== null ||
                            element.querySelector('div[role="button"][aria-label*="Reply"]') !== null ||
                            element.querySelector('span[role="button"][aria-label*="Responder"]') !== null ||
                            element.querySelector('span[role="button"][aria-label*="Reply"]') !== null;
      
      if (!hasReplyButton) {
        console.log('[Pajaritos] Found post attributes (data-ad-preview="message"), treating as main post');
        console.log('[Pajaritos] ✅ Accepting as main post based on post attributes');
        return true;
      } else {
        console.log('[Pajaritos] ❌ Rejected: Has post attributes but also has "Responder" button (likely a comment)');
        return false;
      }
    }
    
    // If no post attributes, do stricter checks
    // STRICT: Exclude anything that has "Responder" (Reply) buttons - those are comments
    // But only check for actual buttons, not just text (text might be from nested comments)
    const hasReplyButton = element.querySelector('div[role="button"][aria-label*="Responder"]') !== null ||
                          element.querySelector('div[role="button"][aria-label*="Reply"]') !== null ||
                          element.querySelector('span[role="button"][aria-label*="Responder"]') !== null ||
                          element.querySelector('span[role="button"][aria-label*="Reply"]') !== null;
    
    if (hasReplyButton) {
      console.log('[Pajaritos] ❌ Rejected: Has "Responder" button (this is a comment reply)');
      return false;
    }
    
    // FLEXIBLE: Look for "Comentar" (Comment) button in multiple ways
    // Check text content
    const hasCommentInText = element.textContent?.includes('Comentar') ||
                             element.textContent?.includes('Comment');
    
    // Check for comment button using various selectors (including aria-label)
    const commentButtonSelectors = [
      '[aria-label*="Comentar"]',
      '[aria-label*="Comment"]',
      '[aria-label*="comentar"]',
      '[aria-label*="comment"]',
      'div[role="button"][aria-label*="Comentar"]',
      'div[role="button"][aria-label*="Comment"]',
      'span[role="button"][aria-label*="Comentar"]',
      'span[role="button"][aria-label*="Comment"]'
    ];
    
    let hasCommentButton = hasCommentInText;
    if (!hasCommentButton) {
      for (const selector of commentButtonSelectors) {
        try {
          const btn = element.querySelector(selector);
          if (btn) {
            // Make sure it's not a reply button
            const btnLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            if (!btnLabel.includes('responder') && !btnLabel.includes('reply')) {
              hasCommentButton = true;
              console.log(`[Pajaritos] Found comment button with selector: ${selector}`);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    // Also check if there's a MAIN POST comment input field
    // Main posts have "Escribe un comentario público..." (Write a public comment...)
    const mainPostInputSelectors = [
      'div[contenteditable="true"][aria-label*="comentario público"]',
      'div[contenteditable="true"][aria-label*="comentario publico"]',
      'div[contenteditable="true"][aria-label*="public comment"]',
      'div[contenteditable="true"][aria-placeholder*="comentario público"]',
      'div[contenteditable="true"][aria-placeholder*="comentario publico"]',
      'div[contenteditable="true"][aria-placeholder*="public comment"]'
    ];
    
    let hasMainPostInput = false;
    for (const selector of mainPostInputSelectors) {
      try {
        if (element.querySelector(selector)) {
          hasMainPostInput = true;
          console.log(`[Pajaritos] Found main post input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If we have main post action buttons (Like/Comment/Share), it's likely a main post
    // Look more deeply in the DOM for these buttons
    let hasActionButtons = false;
    
    // Check for role="group" or role="toolbar" containers
    const actionContainer = element.querySelector('div[role="group"]') || 
                           element.querySelector('div[role="toolbar"]');
    
    if (actionContainer) {
      hasActionButtons = true;
      console.log('[Pajaritos] Found action buttons container (role="group" or "toolbar")');
    } else {
      // Look for buttons with Like/Comment/Share text anywhere in the element
      const allDivs = element.querySelectorAll('div, span, button');
      for (const div of allDivs) {
        const txt = div.textContent?.toLowerCase() || '';
        const ariaLabel = div.getAttribute('aria-label')?.toLowerCase() || '';
        const combined = txt + ' ' + ariaLabel;
        
        // Check if it has Like AND (Comment OR Share)
        const hasLike = combined.includes('me gusta') || combined.includes('like');
        const hasComment = combined.includes('comentar') || combined.includes('comment');
        const hasShare = combined.includes('compartir') || combined.includes('share');
        
        if (hasLike && (hasComment || hasShare)) {
          hasActionButtons = true;
          console.log('[Pajaritos] Found action buttons by text search');
          break;
        }
      }
    }
    
    // (Post attributes check was moved to the top of the function)
    
    // Accept if: has comment button OR has main post input OR has action buttons (and no reply input)
    if (!hasCommentButton && !hasMainPostInput && !hasActionButtons) {
      console.log('[Pajaritos] ❌ Rejected: No "Comentar" button, main post input, or action buttons found');
      console.log('[Pajaritos] Element text preview:', element.textContent?.substring(0, 200));
      return false;
    }
    
    // STRICT: Must NOT be nested inside a comment structure
    // Check if this element is inside a comment container that's itself inside another article
    const commentContainer = element.closest('[data-testid*="comment"]');
    if (commentContainer) {
      // Check if this comment container is nested inside another post/article
      const parentArticle = commentContainer.closest('div[role="article"]');
      if (parentArticle && parentArticle !== element) {
        console.log('[Pajaritos] ❌ Rejected: Nested inside another article (this is a comment)');
        return false;
      }
    }
    
    // FLEXIBLE: Look for main post action buttons (Like/Comment/Share) - at least 2 of 3
    const actionButtons = element.querySelector('div[role="group"]') || 
                         element.querySelector('div[role="toolbar"]') ||
                         Array.from(element.querySelectorAll('div')).find(div => {
                           const txt = div.textContent?.toLowerCase() || '';
                           return (txt.includes('me gusta') || txt.includes('like')) && 
                                  (txt.includes('comentar') || txt.includes('comment')) &&
                                  (txt.includes('compartir') || txt.includes('share'));
                         });
    
    // Also check for at least Like + Comment or Like + Share (more flexible)
    const hasLikeAndComment = element.textContent?.toLowerCase().includes('me gusta') && 
                              (element.textContent?.toLowerCase().includes('comentar') || 
                               element.textContent?.toLowerCase().includes('comment'));
    const hasLikeAndShare = element.textContent?.toLowerCase().includes('me gusta') && 
                           (element.textContent?.toLowerCase().includes('compartir') || 
                            element.textContent?.toLowerCase().includes('share'));
    
    if (!actionButtons && !hasLikeAndComment && !hasLikeAndShare) {
      console.log('[Pajaritos] ❌ Rejected: No main post action buttons (Like/Comment/Share)');
      return false;
    }
    
    // FLEXIBLE: Check for FeedUnit, article, or post-like structure
    const hasFeedUnit = element.getAttribute('data-pagelet')?.includes('FeedUnit');
    const isTopLevelArticle = element.getAttribute('role') === 'article' && 
                             !element.closest('div[role="article"]');
    const hasPostStructure = element.getAttribute('data-testid')?.includes('post') ||
                            element.getAttribute('data-ad-preview') === 'message' ||
                            element.getAttribute('data-ad-comet-preview') === 'message';
    
    if (!hasFeedUnit && !isTopLevelArticle && !hasPostStructure) {
      console.log('[Pajaritos] ❌ Rejected: Not a FeedUnit, top-level article, or post structure');
      return false;
    }
    
    console.log('[Pajaritos] ✅ This is a main post!');
    return true;
  }

  // Add buttons to all posts
  function addButtonsToPosts() {
    const postSelectors = [
      'div[data-ad-preview="message"]',  // Try this first - most reliable for group posts
      'div[data-ad-comet-preview="message"]',
      'div[data-pagelet*="FeedUnit"]',
      'div[role="article"]',
      'div[data-testid*="post"]'
    ];

    let posts = [];
    for (const selector of postSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        console.log(`[Pajaritos] Found ${found.length} elements with selector: ${selector}`);
        // Filter to only main posts, not comments
        const filtered = Array.from(found).filter(post => {
          const isMain = isMainPost(post);
          if (!isMain) {
            console.log('[Pajaritos] Skipping element (not a main post):', post);
          } else {
            console.log('[Pajaritos] ✅ Accepted as main post:', post);
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
        const btnText = btn.textContent?.toLowerCase() || '';
        const btnAriaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        
        // STRICT: Only process "Comentar" buttons, NOT "Responder" buttons
        if (btnText.includes('responder') || btnText.includes('reply') ||
            btnAriaLabel.includes('responder') || btnAriaLabel.includes('reply')) {
          console.log('[Pajaritos] Skipping "Responder" button');
          return; // Skip reply buttons
        }
        
        // Skip if this button is inside a comment structure
        const commentContainer = btn.closest('[data-testid*="comment"]');
        if (commentContainer) {
          // Check if this comment is nested inside another article
          const parentArticle = commentContainer.closest('div[role="article"]');
          if (parentArticle) {
            console.log('[Pajaritos] Skipping comment button inside nested comment');
            return; // Skip comment reply buttons
          }
        }
        
        // Find the post container (go up the DOM tree)
        let post = btn.closest('div[role="article"]') || 
                   btn.closest('div[data-pagelet*="FeedUnit"]') ||
                   btn.closest('div[data-testid*="post"]') ||
                   btn.closest('div[data-ad-preview="message"]') ||
                   btn.closest('div[data-ad-comet-preview="message"]');
        
        // Make sure it's a main post
        if (post && isMainPost(post) && !post.querySelector('.pajaritos-reply-btn')) {
          console.log('[Pajaritos] Found main post via comment button');
          posts.push(post);
        }
      });
    }

    console.log(`[Pajaritos] Processing ${posts.length} posts`);
    
    if (posts.length === 0) {
      console.log('[Pajaritos] ⚠️ No posts to process!');
      return;
    }
    
    let buttonsAdded = 0;
    posts.forEach((post, index) => {
      console.log(`[Pajaritos] Processing post ${index + 1}/${posts.length}`);
      if (!post.querySelector('.pajaritos-reply-btn')) {
        const success = createReplyButton(post);
        if (success) {
          buttonsAdded++;
          console.log(`[Pajaritos] ✅ Successfully added button to post ${index + 1}`);
        } else {
          console.log(`[Pajaritos] ❌ Failed to add button to post ${index + 1}`);
        }
      } else {
        console.log(`[Pajaritos] Post ${index + 1} already has a button`);
      }
    });
    
    if (buttonsAdded > 0) {
      console.log(`[Pajaritos] ✅ Added ${buttonsAdded} reply buttons`);
    } else {
      console.log(`[Pajaritos] ⚠️ No buttons were added (${posts.length} posts processed)`);
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
