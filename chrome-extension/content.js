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
          
          // Skip if it's clearly a reply input (has "respuesta" or "reply" in placeholder/aria-label)
          
          if (placeholder.includes('respuesta') || placeholder.includes('reply') ||
              placeholder.includes('escribe una respuesta') ||
              ariaLabel.includes('respuesta') || ariaLabel.includes('reply') ||
              ariaPlaceholder.includes('respuesta') || ariaPlaceholder.includes('reply')) {
            console.log('[Pajaritos] ⏭️ Skipping - this is a reply input (respuesta)');
            continue; // Skip reply inputs
          }
          
          // Prefer main post inputs: "comentario público" or "public comment"
          if (placeholder.includes('comentario público') || placeholder.includes('public comment') ||
              ariaLabel.includes('comentario público') || ariaLabel.includes('public comment') ||
              ariaPlaceholder.includes('comentario público') || ariaPlaceholder.includes('public comment')) {
            console.log('[Pajaritos] ✅ Found main post input by placeholder/aria-label (comentario público)');
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
          
          // Prefer inputs with "comentario público" or "public comment"
          if (placeholder.includes('comentario público') || placeholder.includes('public comment')) {
            console.log('[Pajaritos] ✅ Found main post input by placeholder (comentario público)');
            return input;
          }
          
          // Check if it's in the main post (not deep in comments)
          if (postElement.contains(input)) {
            // Make sure it's not too deep (not in a nested comment structure)
            let depth = 0;
            let current = input.parentElement;
            while (current && current !== postElement && depth < 10) {
              if (current.getAttribute('data-testid')?.includes('comment')) {
                depth++;
              }
              current = current.parentElement;
            }
            
            if (depth <= 1) { // Only 1 level deep max (main post -> comment area)
              console.log('[Pajaritos] ✅ Found input in main post area (depth: ' + depth + ')');
              return input;
            } else {
              console.log('[Pajaritos] ⏭️ Skipping - input too deep in comment structure (depth: ' + depth + ')');
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
    // STRICT: Exclude anything that has "Responder" (Reply) buttons - those are comments
    const hasReplyButton = element.textContent?.includes('Responder') ||
                          element.textContent?.includes('Reply') ||
                          element.querySelector('[aria-label*="Responder"]') !== null ||
                          element.querySelector('[aria-label*="Reply"]') !== null ||
                          element.querySelector('[aria-label*="responder"]') !== null ||
                          element.querySelector('[aria-label*="reply"]') !== null;
    
    if (hasReplyButton) {
      console.log('[Pajaritos] ❌ Rejected: Has "Responder" button (this is a comment reply)');
      return false;
    }
    
    // Make sure it's NOT a reply input ("Escribe una respuesta") - this is the STRICTEST check
    const hasReplyInput = element.querySelector('div[contenteditable="true"][aria-label*="respuesta"]') !== null ||
                         element.querySelector('div[contenteditable="true"][aria-placeholder*="respuesta"]') !== null ||
                         element.querySelector('div[contenteditable="true"][aria-label*="reply"]') !== null ||
                         element.textContent?.includes('Escribe una respuesta');
    
    if (hasReplyInput) {
      console.log('[Pajaritos] ❌ Rejected: Has reply input ("Escribe una respuesta"), not main post');
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
    
    // Also check if this element has post-like attributes (data-ad-preview="message" is a strong indicator)
    const hasPostAttributes = element.getAttribute('data-ad-preview') === 'message' ||
                             element.getAttribute('data-ad-comet-preview') === 'message' ||
                             element.getAttribute('data-pagelet')?.includes('FeedUnit');
    
    // For group posts, if it has post attributes and no reply input, it's likely a main post
    // even if we can't find action buttons (they might be lazy-loaded or structured differently)
    if (hasPostAttributes && !hasReplyInput) {
      console.log('[Pajaritos] Found post attributes (data-ad-preview="message"), treating as main post');
      // Still check if it's nested in a comment - if so, reject it
      const commentContainer = element.closest('[data-testid*="comment"]');
      if (commentContainer) {
        const parentArticle = commentContainer.closest('div[role="article"]');
        if (parentArticle && parentArticle !== element) {
          console.log('[Pajaritos] ❌ Rejected: Has post attributes but nested in another article');
          return false;
        }
      }
      // If it has post attributes and no reply input, accept it
      if (!hasCommentButton && !hasMainPostInput && !hasActionButtons) {
        console.log('[Pajaritos] ✅ Accepting as main post based on post attributes');
        return true; // Accept based on post attributes alone
      }
    }
    
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
                   btn.closest('div[data-testid*="post"]');
        
        // Make sure it's a main post
        if (post && isMainPost(post) && !post.querySelector('.pajaritos-reply-btn')) {
          console.log('[Pajaritos] Found main post via comment button');
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
