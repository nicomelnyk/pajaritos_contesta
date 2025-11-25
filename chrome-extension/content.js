// Pajaritos de Guardia - Manual Reply Content Script
// This script adds a button to each post for manual commenting

(function() {
  'use strict';


  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Find comment button for a post
  function findCommentButton(postElement) {
    // Looking for comment button in post
    
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
        // Buttons found in parent, using parent as search root
        searchRoot = parent;
      }
    }
    
    // Try data-ad-rendering-role="comment_button" first (most reliable)
    const byDataRole = searchRoot.querySelector('div[data-ad-rendering-role="comment_button"]')?.closest('div[role="button"]');
    if (byDataRole) {
      return byDataRole;
    }
    
    // Try aria-label="Dejar un comentario" (main post comment button)
    const byAriaLabel = searchRoot.querySelector('div[role="button"][aria-label="Dejar un comentario"]');
    if (byAriaLabel) {
      return byAriaLabel;
    }
    
    // Try exact match (aria-label="Comentar") - use searchRoot
    const exactMatch = searchRoot.querySelector('div[role="button"][aria-label="Comentar"]') ||
                      searchRoot.querySelector('div[role="button"][aria-label="Comment"]');
    if (exactMatch) {
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
    // Looking for main post comment input
    
    // First, try to find input in the main post's comment area
    // Look for the main post's comment section (not nested in comments)
    // The main post comment area should be directly in the post, not nested in comment replies
    const allDivs = postElement.querySelectorAll('div');
    
    // Also search in parent elements (the input might be a sibling to postElement)
    let searchRoot = postElement;
    const parent = postElement.parentElement;
    if (parent) {
      // Check if parent has comment inputs
      const parentHasInputs = parent.querySelector('div[contenteditable="true"][role="textbox"]');
      if (parentHasInputs) {
        searchRoot = parent;
        console.log('[Pajaritos] Searching for input in parent element');
      }
    }
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
    // Search in both postElement and its parent/siblings
    const selectors = [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'div[role="textbox"][contenteditable]',
      'textarea'
    ];

    for (const selector of selectors) {
      try {
        // First try in postElement
        let inputs = Array.from(postElement.querySelectorAll(selector));
        
        // If not found, try in parent and siblings
        if (inputs.length === 0 && parent) {
          inputs = Array.from(parent.querySelectorAll(selector));
          console.log(`[Pajaritos] Searching in parent, found ${inputs.length} inputs`);
        }
        
        // If still not found, search the whole document but filter by proximity to postElement
        if (inputs.length === 0) {
          const allInputs = document.querySelectorAll(selector);
          console.log(`[Pajaritos] Searching document-wide, found ${allInputs.length} total inputs`);
          
          // Filter inputs that are near the postElement (within reasonable DOM distance)
          inputs = Array.from(allInputs).filter(input => {
            if (input.offsetParent === null) return false; // Skip hidden
            
            // Check if input is in the same general area as the post
            const postRect = postElement.getBoundingClientRect();
            const inputRect = input.getBoundingClientRect();
            
            // Input should be below the post (comments appear below posts)
            const isBelowPost = inputRect.top > postRect.top;
            
            // Input should be reasonably close horizontally
            const horizontalDistance = Math.abs(inputRect.left - postRect.left);
            const isNearHorizontally = horizontalDistance < 500; // Within 500px
            
            return isBelowPost && isNearHorizontally;
          });
          
          console.log(`[Pajaritos] Filtered to ${inputs.length} inputs near the post`);
        }
        for (const input of inputs) {
          if (input.offsetParent === null) continue; // Skip hidden
          
          const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
          const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
          const ariaPlaceholder = input.getAttribute('aria-placeholder')?.toLowerCase() || '';
          
          // FIRST: Check if it's in the main post area (not nested in comments)
          // This is the most reliable way to identify main post inputs
          let isInMainPost = false;
          let depth = 0;
          
          // Check if input is within postElement or its parent
          const isInPost = postElement.contains(input) || (parent && parent.contains(input));
          
          if (isInPost) {
            let current = input.parentElement;
            let searchRoot = postElement.contains(input) ? postElement : parent;
            while (current && current !== searchRoot && depth < 10) {
              if (current.getAttribute('data-testid')?.includes('comment')) {
                depth++;
              }
              current = current.parentElement;
            }
            
            // If it's in the main post and not too deep, it's likely the main post input
            if (depth <= 1) {
              isInMainPost = true;
            }
          } else {
            // Input is not in postElement, but might be a sibling (common in Facebook)
            // Check if it's near the post and not nested in comments
            const inputContainer = input.closest('[data-testid*="comment"]');
            if (!inputContainer || inputContainer === postElement.closest('[data-testid*="comment"]')) {
              // Not in a nested comment, might be the main post input
              isInMainPost = true;
              console.log('[Pajaritos] Input appears to be a sibling of the post, treating as main post input');
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
              continue; // Skip if nested in a comment
            }
          }
          
          // Skip if it's clearly a reply input AND not in main post area
          // (Only skip if it's nested in comments)
          if (!isInMainPost && (placeholder.includes('respuesta') || placeholder.includes('reply') ||
              placeholder.includes('escribe una respuesta') ||
              ariaLabel.includes('respuesta') || ariaLabel.includes('reply') ||
              ariaPlaceholder.includes('respuesta') || ariaPlaceholder.includes('reply'))) {
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
    // Wait for the input to appear (it might take a moment after clicking the comment button)
    let input = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    console.log('[Pajaritos] Waiting for comment input to appear...');
    while (!input && attempts < maxAttempts) {
      input = findCommentInput(postElement);
      if (!input) {
        console.log(`[Pajaritos] Input not found yet, attempt ${attempts + 1}/${maxAttempts}`);
        await wait(300);
        attempts++;
      } else {
        console.log('[Pajaritos] ✅ Input found!');
        break;
      }
    }
    
    if (!input) {
      console.log('[Pajaritos] ❌ Main post comment input not found after waiting');
      console.log('[Pajaritos] Post element:', postElement);
      console.log('[Pajaritos] Available inputs:', document.querySelectorAll('div[contenteditable="true"][role="textbox"]').length);
      return { success: false, error: 'Main post comment input not found' };
    }

    try {
      // Focus and click the input
      input.focus();
      input.click();
      await wait(500);

      // Clear any existing content first
      if (input.contentEditable === 'true') {
        input.textContent = '';
        input.innerText = '';
      } else {
        input.value = '';
      }
      await wait(200);

      // Set the text content - Facebook's contenteditable needs special handling
      if (input.contentEditable === 'true') {
        // Method 1: Set innerText (most reliable for contenteditable)
        input.innerText = commentText;
        input.textContent = commentText;
        
        // Method 2: Create a text node and insert it
        const range = document.createRange();
        range.selectNodeContents(input);
        range.deleteContents();
        const textNode = document.createTextNode(commentText);
        range.insertNode(textNode);
        range.collapse(false);
        
        // Set cursor position
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger multiple events that Facebook listens to
        const events = [
          new Event('input', { bubbles: true, cancelable: true }),
          new Event('beforeinput', { bubbles: true, cancelable: true }),
          new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: commentText }),
          new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a', code: 'KeyA' }),
          new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'a', code: 'KeyA' })
        ];
        
        for (const event of events) {
          input.dispatchEvent(event);
        }
        
        // Also trigger composition events (Facebook might use these)
        input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        input.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: commentText }));
        input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: commentText }));
        
        console.log('[Pajaritos] Text set in contenteditable, current value:', input.textContent || input.innerText);
      } else {
        input.value = commentText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Wait for Facebook to process the text
      await wait(1000);
      
      // Verify text was set
      const currentText = input.textContent?.trim() || input.innerText?.trim() || input.value?.trim() || '';
      if (currentText !== commentText.trim()) {
        console.log('[Pajaritos] ⚠️ Text mismatch! Expected:', commentText, 'Got:', currentText);
        // Try one more time with a different method
        if (input.contentEditable === 'true') {
          input.focus();
          input.textContent = commentText;
          input.innerText = commentText;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await wait(500);
        }
      } else {
        console.log('[Pajaritos] ✅ Text successfully set in input');
      }

      await wait(500); // Wait a bit longer for submit button to appear

      // Find and click the submit button
      let submitButton = null;
      
      // Strategy 1: Look in the input's container and nearby elements
      const inputContainer = input.closest('form') ||
                            input.closest('div[data-testid*="comment"]') ||
                            input.closest('div[role="textbox"]')?.parentElement?.parentElement ||
                            input.parentElement?.parentElement?.parentElement;
      
      if (inputContainer) {
        const buttons = inputContainer.querySelectorAll('div[role="button"], span[role="button"], button');
        console.log(`[Pajaritos] Found ${buttons.length} buttons in input container`);
        
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue;
          
          const text = btn.textContent?.toLowerCase().trim() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const title = btn.getAttribute('title')?.toLowerCase() || '';
          
          console.log(`[Pajaritos] Checking button: text="${text}", aria-label="${ariaLabel}"`);
          
          // Check if it's a submit button
          if (text === 'publicar' || text === 'post' || text === 'comentar' || text === 'comment' ||
              ariaLabel.includes('publicar') || ariaLabel.includes('post') ||
              ariaLabel.includes('comentar') && !ariaLabel.includes('escribir') ||
              title.includes('publicar') || title.includes('post') ||
              btn.type === 'submit') {
            submitButton = btn;
            console.log('[Pajaritos] ✅ Found submit button in container:', text || ariaLabel);
            break;
          }
        }
      }
      
      // Strategy 2: Search document-wide for buttons near the input
      if (!submitButton) {
        const inputRect = input.getBoundingClientRect();
        const allButtons = document.querySelectorAll('div[role="button"], span[role="button"], button');
        console.log(`[Pajaritos] Searching ${allButtons.length} buttons document-wide`);
        
        for (const btn of allButtons) {
          if (btn.offsetParent === null) continue;
          
          const btnRect = btn.getBoundingClientRect();
          const verticalDistance = Math.abs(btnRect.top - inputRect.bottom);
          const horizontalDistance = Math.abs(btnRect.left - inputRect.left);
          
          // Button should be below input and reasonably close horizontally
          if (btnRect.top > inputRect.bottom && verticalDistance < 150 && horizontalDistance < 300) {
            const text = btn.textContent?.toLowerCase().trim() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            
            // Check if it looks like a submit button
            if (text === 'publicar' || text === 'post' || 
                ariaLabel.includes('publicar') || ariaLabel.includes('post') ||
                (ariaLabel.includes('comentar') && !ariaLabel.includes('escribir'))) {
              submitButton = btn;
              console.log('[Pajaritos] ✅ Found submit button by proximity:', text || ariaLabel);
              break;
            }
          }
        }
      }
      
      // Strategy 3: Try pressing Enter (Facebook often submits on Enter)
      if (!submitButton) {
        console.log('[Pajaritos] Submit button not found, trying Enter key...');
        input.focus();
        await wait(200);
        
        // Simulate Enter key press
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(enterEvent);
        
        await wait(500);
        
        // Check if comment was posted (input should be cleared or comment should appear)
        const inputAfterEnter = input.textContent?.trim() || input.value?.trim() || '';
        if (inputAfterEnter === '' || inputAfterEnter !== commentText) {
          console.log('[Pajaritos] ✅ Comment posted via Enter key');
          return { success: true };
        }
      }

      if (submitButton) {
        submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(200);
        submitButton.click();
        console.log('[Pajaritos] ✅ Comment posted via submit button');
        await wait(500);
        return { success: true };
      } else {
        console.log('[Pajaritos] ❌ Submit button not found and Enter key did not work');
        console.log('[Pajaritos] Input container:', inputContainer);
        console.log('[Pajaritos] Input text after typing:', input.textContent || input.value);
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
        let searchRoot = postElement;
        const parent = postElement.parentElement;
        if (parent) {
          const parentHasButtons = parent.querySelector('div[data-ad-rendering-role="comment_button"]') ||
                                   parent.querySelector('div[role="button"][aria-label*="Comentar"]');
          if (parentHasButtons) {
            searchRoot = parent;
          }
        }
        
        const commentButtonElement = searchRoot.querySelector('div[data-ad-rendering-role="comment_button"]');
        let actionContainer = null;
        
        if (commentButtonElement) {
          actionContainer = commentButtonElement.closest('div.x9f619.x1n2onr6.x1ja2u2z.x78zum5') ||
                           commentButtonElement.closest('div.xbmvrgn.x1diwwjn') ||
                           commentButtonElement.closest('div');
        }
        
        if (!actionContainer) {
          actionContainer = searchRoot.querySelector('div[role="group"]') || 
                           searchRoot.querySelector('div[role="toolbar"]') ||
                           Array.from(searchRoot.querySelectorAll('div')).find(div => {
                             const txt = div.textContent?.toLowerCase() || '';
                             return (txt.includes('me gusta') || txt.includes('like')) && 
                                    (txt.includes('comentar') || txt.includes('comment')) &&
                                    (txt.includes('compartir') || txt.includes('share'));
                           });
        }
        
        if (actionContainer) {
          insertTarget = actionContainer;
        } else {
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
          } else {
            const anyActionContainer = Array.from(postElement.querySelectorAll('div')).find(div => {
              const txt = div.textContent?.toLowerCase() || '';
              return txt.includes('me gusta') || txt.includes('like');
            });
            
            if (anyActionContainer) {
              insertTarget = anyActionContainer;
            } else if (parent) {
              const parentActionContainer = Array.from(parent.querySelectorAll('div')).find(div => {
                const txt = div.textContent?.toLowerCase() || '';
                return (txt.includes('me gusta') || txt.includes('like')) && 
                       (txt.includes('comentar') || txt.includes('comment'));
              });
              if (parentActionContainer) {
                insertTarget = parentActionContainer;
              } else {
                insertTarget = postElement;
              }
            } else {
              return false;
            }
          }
        }
      }

    // Create button
    const replyBtn = document.createElement('div');
    replyBtn.className = 'pajaritos-reply-btn';
    replyBtn.innerHTML = '🐦';
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
      
      // Show form modal
      showReplyForm(postElement, replyBtn);
    });

    // Insert button near comment button or action area
    if (insertTarget === commentButton) {
      // Insert next to comment button
      const parent = commentButton.parentElement;
      if (parent) {
        parent.appendChild(replyBtn);
        return true;
      } else {
        commentButton.insertAdjacentElement('afterend', replyBtn);
        return true;
      }
    } else {
      // Insert in action container
      try {
        insertTarget.appendChild(replyBtn);
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  // Show reply form modal with pre-defined options
  function showReplyForm(postElement, triggerButton) {
    // Remove existing form if any
    const existingForm = document.querySelector('.pajaritos-form-overlay');
    if (existingForm) {
      existingForm.remove();
    }

    // Get reply options from config (loaded via script tag)
    const replyOptions = typeof REPLY_OPTIONS !== 'undefined' ? REPLY_OPTIONS : {};

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
      overflow-y: auto;
      padding: 20px;
    `;

    // Create form
    const form = document.createElement('div');
    form.className = 'pajaritos-form';
    form.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      position: relative;
    `;

    // Build option select dropdown
    let optionsHtml = '<option value="">Selecciona una opción...</option>';
    for (const [key, option] of Object.entries(replyOptions)) {
      optionsHtml += `<option value="${key}">${option.name}</option>`;
    }

    form.innerHTML = `
      <button id="pajaritos-close-x-btn" style="
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border: none;
        background: #f0f2f5;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        color: #65676b;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        padding: 0;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#e4e6eb'" onmouseout="this.style.backgroundColor='#f0f2f5'" title="Cerrar">×</button>
      
      <h2 style="margin: 0 0 20px 0; color: #1877f2; font-size: 20px;">🐦 Pajaritos de Guardia</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Seleccionar opción:</label>
        <select id="pajaritos-option-select" style="
          width: 100%;
          padding: 10px;
          border: 2px solid #e4e6eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        ">
          ${optionsHtml}
        </select>
      </div>

      <div id="pajaritos-subtype-container" style="margin-bottom: 20px; display: none;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Seleccionar edad:</label>
        <select id="pajaritos-subtype-select" style="
          width: 100%;
          padding: 10px;
          border: 2px solid #e4e6eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        ">
          <option value="">Seleccione una edad...</option>
        </select>
      </div>

      <div id="pajaritos-replies-container" style="margin-bottom: 20px;">
        <!-- Dynamic reply inputs will be inserted here -->
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
        ">Cancelar</button>
        <button id="pajaritos-submit-btn" style="
          padding: 10px 20px;
          border: none;
          background: #1877f2;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: none;
        ">Publicar Comentarios</button>
      </div>
      <div id="pajaritos-status" style="margin-top: 12px; font-size: 14px;"></div>
      <div id="pajaritos-progress" style="margin-top: 12px; font-size: 13px; color: #1877f2; font-weight: 500; min-height: 20px;">
        <!-- Progress will be shown here -->
      </div>
      <div id="pajaritos-progress-detail" style="margin-top: 4px; font-size: 11px; color: #65676b; min-height: 16px;">
        <!-- Detailed progress steps -->
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const optionSelect = form.querySelector('#pajaritos-option-select');
    const subtypeContainer = form.querySelector('#pajaritos-subtype-container');
    const subtypeSelect = form.querySelector('#pajaritos-subtype-select');
    const repliesContainer = form.querySelector('#pajaritos-replies-container');
    const submitBtn = form.querySelector('#pajaritos-submit-btn');
    const cancelBtn = form.querySelector('#pajaritos-cancel-btn');
    const closeXBtn = form.querySelector('#pajaritos-close-x-btn');
    const statusDiv = form.querySelector('#pajaritos-status');
    const progressDiv = form.querySelector('#pajaritos-progress');
    const progressDetailDiv = form.querySelector('#pajaritos-progress-detail');

    // Helper function to get the current storage key (optionKey or optionKey_subtypeKey)
    function getStorageKey() {
      const optionKey = optionSelect.value;
      if (!optionKey) return null;
      
      const option = replyOptions[optionKey];
      if (!option) return null;
      
      // Check if option has subtypes
      if (option.subtypes) {
        const subtypeKey = subtypeSelect.value;
        if (!subtypeKey) return null;
        return `${optionKey}_${subtypeKey}`;
      }
      
      // No subtypes, use option key directly
      return optionKey;
    }

    // Helper function to get the current replies based on selected option and subtype
    function getCurrentReplies() {
      const optionKey = optionSelect.value;
      if (!optionKey) return null;
      
      const option = replyOptions[optionKey];
      if (!option) return null;
      
      // Check if option has subtypes
      if (option.subtypes) {
        const subtypeKey = subtypeSelect.value;
        if (!subtypeKey) return null;
        const subtype = option.subtypes[subtypeKey];
        return subtype ? subtype.replies : null;
      }
      
      // No subtypes, return option replies directly
      return option.replies || null;
    }

    // Form starts empty - user must select an option
    // (Removed auto-loading of last selected option)

      // Function to save form data
    async function saveFormData() {
      const storageKey = getStorageKey();
      if (!storageKey) return;
      
      const replyInputs = repliesContainer.querySelectorAll('.pajaritos-reply-input');
      const replyCheckboxes = repliesContainer.querySelectorAll('.pajaritos-reply-checkbox');
      const imagePreviews = repliesContainer.querySelectorAll('.pajaritos-image-preview');
      
      const formData = {
        texts: {}, // Legacy: by index (for backward compatibility)
        checkboxes: {}, // Legacy: by index
        images: {}, // Legacy: by index
        imagesRemoved: {}, // Legacy: by index
        textsById: {}, // New: by comment ID
        checkboxesById: {}, // New: by comment ID
        imagesById: {}, // New: by comment ID
        imagesRemovedById: {}, // New: by comment ID
        additionalComments: [] // Store additional custom comments
      };
      
      const currentReplies = getCurrentReplies();
      const baseCommentCount = currentReplies ? currentReplies.length : 0;
      const additionalCommentsArray = [];
      
      replyInputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        const isCustom = input.dataset.custom === 'true';
        
        // If it's a custom comment (beyond base comments), save to additionalComments
        if (isCustom && index >= baseCommentCount) {
          const checkbox = repliesContainer.querySelector(`.pajaritos-reply-checkbox[data-index="${index}"]`);
          const preview = repliesContainer.querySelector(`.pajaritos-image-preview[data-index="${index}"]`);
          const imageRemoved = input.dataset.imageRemoved === 'true';
          
          // Get or generate unique ID for this custom comment
          let commentId = input.dataset.commentId;
          if (!commentId) {
            // Generate new ID if missing (for backward compatibility)
            commentId = generateCustomCommentId();
            input.dataset.commentId = commentId;
          }
          
          // Also save by ID in the new system (for consistency)
          const currentText = input.value;
          formData.textsById[commentId] = currentText;
          if (checkbox) {
            formData.checkboxesById[commentId] = checkbox.checked;
          }
          if (preview && preview.dataset.customImage && !imageRemoved) {
            formData.imagesById[commentId] = preview.dataset.customImage;
          }
          if (imageRemoved) {
            formData.imagesRemovedById[commentId] = true;
          }
          
          const additionalIndex = index - baseCommentCount;
          
          // Ensure array is large enough
          while (additionalCommentsArray.length <= additionalIndex) {
            additionalCommentsArray.push(null);
          }
          
          additionalCommentsArray[additionalIndex] = {
            id: commentId, // Store unique ID for custom comments
            text: currentText,
            checked: checkbox ? checkbox.checked : true,
            image: (preview && preview.dataset.customImage && !imageRemoved) ? preview.dataset.customImage : null,
            imageRemoved: imageRemoved
          };
        } else {
          // Regular comment - save by ID if available, otherwise by index
          const commentId = input.dataset.commentId;
          const currentText = input.value;
          
          // Get the original text from config to check if it was edited
          const currentReplies = getCurrentReplies();
          const reply = currentReplies && currentReplies[index];
          const originalText = reply ? reply.text : '';
          const wasEdited = currentText !== originalText;
          
          // Save by ID (new system)
          if (commentId) {
            // Only save if text was edited (different from config)
            if (wasEdited) {
              formData.textsById[commentId] = currentText;
            }
            // Also save by index for backward compatibility
            formData.texts[index] = currentText;
          } else {
            // Fallback to index-based saving (old system)
            formData.texts[index] = currentText;
          }
          
          // Track if image was removed
          if (input.dataset.imageRemoved === 'true') {
            if (commentId) {
              formData.imagesRemovedById[commentId] = true;
            }
            formData.imagesRemoved[index] = true;
          }
        }
      });
      
      // Filter out null entries and assign to formData
      formData.additionalComments = additionalCommentsArray.filter(c => c !== null);
      
      replyCheckboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const isCustom = checkbox.dataset.custom === 'true';
        const commentId = checkbox.dataset.commentId;
        
        // Only save checkbox state for non-custom comments here (custom ones saved above)
        if (!isCustom || index < baseCommentCount) {
          // Save by ID (new system)
          if (commentId) {
            formData.checkboxesById[commentId] = checkbox.checked;
          }
          // Also save by index for backward compatibility
          formData.checkboxes[index] = checkbox.checked;
        }
      });

      // Save custom images (base64) for regular comments only
      imagePreviews.forEach(preview => {
        const index = parseInt(preview.dataset.index);
        const isCustom = preview.dataset.custom === 'true';
        
        // Only save for regular comments (custom ones saved above)
        if (!isCustom || index < baseCommentCount) {
          const customImage = preview.dataset.customImage;
          if (customImage && customImage !== '') {
            const input = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${index}"]`);
            const commentId = input ? input.dataset.commentId : null;
            // Save by ID (new system)
            if (commentId) {
              formData.imagesById[commentId] = customImage; // base64 data
            }
            // Also save by index for backward compatibility
            formData.images[index] = customImage; // base64 data
          }
        }
      });
      
      // Save to chrome.storage.local with the storage key (optionKey or optionKey_subtypeKey)
      await chrome.storage.local.set({
        [`pajaritos_form_${storageKey}`]: formData
      });
      
      // Also save last selected option and subtype
      await chrome.storage.local.set({
        pajaritos_last_option: optionSelect.value,
        pajaritos_last_subtype: subtypeSelect.value || null
      });
      
      console.log('[Pajaritos] 💾 Form data saved for:', storageKey);
    }

    // Function to load form data
    async function loadFormData(optionKey) {
      const storageKey = `pajaritos_form_${optionKey}`;
      const result = await chrome.storage.local.get([storageKey]);
      return result[storageKey] || null;
    }

    // Handle option selection
    optionSelect.addEventListener('change', async (e) => {
      const selectedKey = e.target.value;
      if (!selectedKey || !replyOptions[selectedKey]) {
        subtypeContainer.style.display = 'none';
        subtypeSelect.innerHTML = '<option value="">Seleccione una edad...</option>';
        repliesContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        return;
      }

      const selectedOption = replyOptions[selectedKey];
      
      // Check if option has subtypes
      if (selectedOption.subtypes) {
        // Show subtype selector and populate it
        subtypeContainer.style.display = 'block';
        let subtypesHtml = '<option value="">Seleccione una edad...</option>';
        for (const [subtypeKey, subtype] of Object.entries(selectedOption.subtypes)) {
          subtypesHtml += `<option value="${subtypeKey}">${subtype.name}</option>`;
        }
        subtypeSelect.innerHTML = subtypesHtml;
        subtypeSelect.value = '';
        
        // Clear replies container until subtype is selected
        repliesContainer.innerHTML = '';
        submitBtn.style.display = 'none';
      } else {
        // No subtypes, hide subtype selector and load replies directly
        subtypeContainer.style.display = 'none';
        subtypeSelect.innerHTML = '<option value="">Seleccione una edad...</option>';
        
        // Load saved data for this option
        const savedData = await loadFormData(selectedKey);
        console.log('[Pajaritos] 📂 Loaded saved data:', savedData);
        
        // Load replies
        loadReplies(selectedOption.replies || [], savedData, selectedKey);
      }
    });

    // Handle subtype selection
    subtypeSelect.addEventListener('change', async (e) => {
      const subtypeKey = e.target.value;
      const optionKey = optionSelect.value;
      
      if (!subtypeKey || !optionKey || !replyOptions[optionKey] || !replyOptions[optionKey].subtypes) {
        repliesContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        return;
      }

      const subtype = replyOptions[optionKey].subtypes[subtypeKey];
      if (!subtype) {
        repliesContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        return;
      }

      // Load saved data for this option_subtype combination
      const storageKey = `${optionKey}_${subtypeKey}`;
      const savedData = await loadFormData(storageKey);
      console.log('[Pajaritos] 📂 Loaded saved data for subtype:', storageKey, savedData);
      
      // Load replies
      loadReplies(subtype.replies || [], savedData, storageKey);
    });

    // Function to load replies into the form
    function loadReplies(replies, savedData, storageKey) {
      let repliesHtml = '';

      replies.forEach((reply, index) => {
        // Get comment ID (new system) or use index as fallback (old system compatibility)
        const commentId = reply.id || `index_${index}`;
        
        // Try to get saved data by ID first, then by index (for backward compatibility)
        const savedTextById = savedData?.textsById?.[commentId];
        const savedTextByIndex = savedData?.texts?.[index.toString()] || savedData?.texts?.[index];
        const savedText = savedTextById || savedTextByIndex;
        
        // Determine if comment was edited: if saved text exists and differs from config text
        const wasEdited = savedText && savedText !== reply.text;
        
        // Use saved text if it was edited, otherwise use config text (allows auto-updates)
        const displayText = wasEdited ? savedText : reply.text;
        
        // Checkbox state: try by ID first, then by index
        const savedCheckedById = savedData?.checkboxesById?.[commentId];
        const savedCheckedByIndex = savedData?.checkboxes?.[index.toString()] !== undefined 
                           ? savedData.checkboxes[index.toString()] 
                           : (savedData?.checkboxes?.[index] !== undefined ? savedData.checkboxes[index] : true);
        const savedChecked = savedCheckedById !== undefined ? savedCheckedById : savedCheckedByIndex;
        
        // Check if image was removed: try by ID first, then by index
        const imageRemovedById = savedData?.imagesRemovedById?.[commentId] === true;
        const imageRemovedByIndex = savedData?.imagesRemoved?.[index.toString()] === true || 
                               savedData?.imagesRemoved?.[index] === true;
        const imageWasRemoved = imageRemovedById || imageRemovedByIndex;
        
        // Use custom image: try by ID first, then by index
        const savedCustomImageById = savedData?.imagesById?.[commentId] || null;
        const savedCustomImageByIndex = savedData?.images?.[index.toString()] || savedData?.images?.[index] || null;
        const savedCustomImage = savedCustomImageById || savedCustomImageByIndex;
        
        const defaultImageUrl = reply.image ? chrome.runtime.getURL(`images/${reply.image}`) : null;
        const displayImageUrl = imageWasRemoved ? null : (savedCustomImage || defaultImageUrl);
        const hasImage = displayImageUrl !== null && !imageWasRemoved;
        const isCustomImage = savedCustomImage !== null;
        
        repliesHtml += `
          <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e4e6eb; border-radius: 8px; background: #f8f9fa;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <label style="display: flex; align-items: center; cursor: pointer; flex: 1;">
                <input type="checkbox" class="pajaritos-reply-checkbox" data-index="${index}" data-comment-id="${commentId}" ${savedChecked ? 'checked' : ''} style="
                  width: 18px;
                  height: 18px;
                  margin-right: 8px;
                  cursor: pointer;
                ">
                <span style="font-weight: 500; color: #333;">Comentario ${index + 1}:</span>
              </label>
              ${hasImage ? `
                <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                  <img class="pajaritos-image-preview" data-index="${index}" data-comment-id="${commentId}" data-custom-image="${isCustomImage ? savedCustomImage : ''}" data-image-url="${displayImageUrl}" src="${displayImageUrl}" style="max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: cover; cursor: pointer;" onerror="this.style.display='none'" title="Click para descargar">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${index}" style="display: none;">
                    <button type="button" class="pajaritos-download-image-btn" data-index="${index}" data-image-url="${displayImageUrl}" style="
                      padding: 4px 8px;
                      font-size: 11px;
                      background: #42b72a;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    ">⬇️ Descargar imagen</button>
                    <button type="button" class="pajaritos-change-image-btn" data-index="${index}" style="
                      padding: 4px 8px;
                      font-size: 11px;
                      background: #1877f2;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    ">Cambiar imagen</button>
                    <button type="button" class="pajaritos-remove-image-btn" data-index="${index}" style="
                      padding: 4px 8px;
                      font-size: 11px;
                      background: #f02849;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    ">Remover imagen</button>
                  </div>
                </div>
              ` : `
                <div style="margin-left: auto;">
                  <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${index}" style="display: none;">
                  <button type="button" class="pajaritos-add-image-btn" data-index="${index}" style="
                    padding: 6px 12px;
                    font-size: 12px;
                    background: #42b72a;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  ">➕ Agregar imagen</button>
                </div>
              `}
              <button type="button" class="pajaritos-delete-comment-btn" data-index="${index}" data-comment-id="${commentId}" style="
                margin-left: 8px;
                padding: 4px 8px;
                font-size: 11px;
                background: #f02849;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">🗑️ Eliminar comentario</button>
            </div>
            <textarea class="pajaritos-reply-input" data-index="${index}" data-comment-id="${commentId}" data-image="${reply.image || ''}" ${imageWasRemoved ? 'data-image-removed="true"' : ''} placeholder="Escribe tu comentario aquí..." style="
              width: 100%;
              min-height: 80px;
              padding: 10px;
              border: 2px solid #e4e6eb;
              border-radius: 6px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              box-sizing: border-box;
            ">${displayText}</textarea>
            ${hasImage ? `<div style="margin-top: 8px; font-size: 12px; color: #65676b;">📷 ${isCustomImage ? 'Imagen personalizada' : `Imagen asociada: ${reply.image}`}</div>` : ''}
          </div>
        `;
      });

      // Load additional custom comments (Comentario 4, 5, etc.)
      const additionalComments = savedData?.additionalComments || [];
      additionalComments.forEach((additionalComment, idx) => {
        const actualIndex = replies.length + idx;
        // Use saved ID or generate new one (for backward compatibility)
        const customId = additionalComment.id || generateCustomCommentId();
        const savedText = additionalComment.text || '';
        const savedChecked = additionalComment.checked !== undefined ? additionalComment.checked : true;
        const savedCustomImage = additionalComment.image || null;
        const imageWasRemoved = additionalComment.imageRemoved === true;
        const hasImage = savedCustomImage && !imageWasRemoved;
        
        repliesHtml += `
          <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e4e6eb; border-radius: 8px; background: #f8f9fa; border-left: 3px solid #42b72a;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <label style="display: flex; align-items: center; cursor: pointer; flex: 1;">
                <input type="checkbox" class="pajaritos-reply-checkbox" data-index="${actualIndex}" data-custom="true" data-comment-id="${customId}" ${savedChecked ? 'checked' : ''} style="
                  width: 18px;
                  height: 18px;
                  margin-right: 8px;
                  cursor: pointer;
                ">
                <span style="font-weight: 500; color: #333;">Comentario ${actualIndex + 1}:</span>
              </label>
              ${hasImage ? `
                <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                  <img class="pajaritos-image-preview" data-index="${actualIndex}" data-comment-id="${customId}" data-custom-image="${savedCustomImage}" data-image-url="${savedCustomImage}" src="${savedCustomImage}" style="max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: cover; cursor: pointer;" onerror="this.style.display='none'" title="Click para descargar">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${actualIndex}" style="display: none;">
                    <button type="button" class="pajaritos-download-image-btn" data-index="${actualIndex}" data-image-url="${savedCustomImage}" style="
                      padding: 4px 8px;
                      font-size: 11px;
                      background: #42b72a;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    ">⬇️ Descargar imagen</button>
                    <button type="button" class="pajaritos-change-image-btn" data-index="${actualIndex}" style="
                      padding: 4px 8px;
                      font-size: 11px;
                      background: #1877f2;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    ">Cambiar imagen</button>
                    <button type="button" class="pajaritos-remove-image-btn" data-index="${actualIndex}" style="
                      padding: 4px 8px;
                      font-size: 11px;
                      background: #f02849;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    ">Remover imagen</button>
                  </div>
                </div>
              ` : `
                <div style="margin-left: auto;">
                  <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${actualIndex}" style="display: none;">
                  <button type="button" class="pajaritos-add-image-btn" data-index="${actualIndex}" style="
                    padding: 6px 12px;
                    font-size: 12px;
                    background: #42b72a;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  ">➕ Agregar imagen</button>
                </div>
              `}
              <button type="button" class="pajaritos-delete-comment-btn" data-index="${actualIndex}" style="
                margin-left: 8px;
                padding: 4px 8px;
                font-size: 11px;
                background: #f02849;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">🗑️ Eliminar comentario</button>
            </div>
            <textarea class="pajaritos-reply-input" data-index="${actualIndex}" data-custom="true" data-comment-id="${customId}" data-image="" ${imageWasRemoved ? 'data-image-removed="true"' : ''} placeholder="Escribe tu comentario aquí..." style="
              width: 100%;
              min-height: 80px;
              padding: 10px;
              border: 2px solid #e4e6eb;
              border-radius: 6px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              box-sizing: border-box;
            ">${savedText}</textarea>
            ${hasImage ? `<div style="margin-top: 8px; font-size: 12px; color: #65676b;">📷 Imagen personalizada</div>` : ''}
          </div>
        `;
      });

      // Add "Add new comment" button
      repliesHtml += `
        <div style="margin-top: 20px; text-align: center;">
          <button type="button" id="pajaritos-add-new-comment-btn" style="
            padding: 10px 20px;
            font-size: 14px;
            background: #42b72a;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">➕ Agregar nuevo comentario</button>
        </div>
      `;

      repliesContainer.innerHTML = repliesHtml;
      submitBtn.style.display = 'block';

      // Add event listeners to save changes automatically
      const replyInputs = repliesContainer.querySelectorAll('.pajaritos-reply-input');
      const replyCheckboxes = repliesContainer.querySelectorAll('.pajaritos-reply-checkbox');
      const imageInputs = repliesContainer.querySelectorAll('.pajaritos-image-input');
      const changeImageBtns = repliesContainer.querySelectorAll('.pajaritos-change-image-btn');
      const removeImageBtns = repliesContainer.querySelectorAll('.pajaritos-remove-image-btn');
      const addImageBtns = repliesContainer.querySelectorAll('.pajaritos-add-image-btn');

      // Function to convert image file to base64
      function imageToBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Function to update image preview
      function updateImagePreview(index, base64Data) {
        // Validate index
        if (index === undefined || index === null || index === '') {
          console.error('[Pajaritos] updateImagePreview: Invalid index:', index);
          return;
        }
        
        // Clear the image-removed flag when adding a new image
        const input = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${index}"]`);
        if (input) {
          delete input.dataset.imageRemoved;
        }
        
        const preview = repliesContainer.querySelector(`.pajaritos-image-preview[data-index="${index}"]`);
        if (preview) {
          preview.src = base64Data;
          preview.dataset.customImage = base64Data;
          preview.dataset.imageUrl = base64Data;
          // Update download button if exists
          const downloadBtn = repliesContainer.querySelector(`.pajaritos-download-image-btn[data-index="${index}"]`);
          if (downloadBtn) {
            downloadBtn.dataset.imageUrl = base64Data;
          }
          // Show change/remove buttons if not already visible
          const container = preview.closest('div[style*="display: flex"]');
          if (container && !container.querySelector('.pajaritos-change-image-btn')) {
            // Buttons should already be there, but ensure they're visible
            container.querySelectorAll('button').forEach(btn => {
              btn.style.display = 'block';
            });
          }
        } else {
          // Need to create the image preview section
          const replyDiv = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${index}"]`)?.closest('div[style*="margin-bottom: 20px"]');
          if (replyDiv) {
            const headerDiv = replyDiv.querySelector('div[style*="display: flex"]');
            if (headerDiv) {
              // Remove add image button if exists
              const addBtn = headerDiv.querySelector('.pajaritos-add-image-btn');
              if (addBtn) {
                addBtn.remove();
              }
              
              // Add image preview with buttons
              const imageContainer = document.createElement('div');
              imageContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-left: auto;';
              const input = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${index}"]`);
              if (!input) {
                console.error('[Pajaritos] updateImagePreview: Input not found for index:', index);
                return;
              }
              const commentId = input ? input.dataset.commentId : null;
              imageContainer.innerHTML = `
                <img class="pajaritos-image-preview" data-index="${index}" data-comment-id="${commentId || ''}" data-custom-image="${base64Data}" data-image-url="${base64Data}" src="${base64Data}" style="max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: cover; cursor: pointer;" title="Click para descargar">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${index}" style="display: none;">
                  <button type="button" class="pajaritos-download-image-btn" data-index="${index}" data-image-url="${base64Data}" style="
                    padding: 4px 8px;
                    font-size: 11px;
                    background: #42b72a;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  ">⬇️ Descargar imagen</button>
                  <button type="button" class="pajaritos-change-image-btn" data-index="${index}" style="
                    padding: 4px 8px;
                    font-size: 11px;
                    background: #1877f2;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  ">Cambiar imagen</button>
                  <button type="button" class="pajaritos-remove-image-btn" data-index="${index}" style="
                    padding: 4px 8px;
                    font-size: 11px;
                    background: #f02849;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  ">Remover imagen</button>
                </div>
              `;
              headerDiv.appendChild(imageContainer);
              
              // Update info text
              const infoDiv = replyDiv.querySelector('div[style*="margin-top: 8px"]');
              if (infoDiv) {
                infoDiv.textContent = '📷 Imagen personalizada';
              } else {
                const newInfoDiv = document.createElement('div');
                newInfoDiv.style.cssText = 'margin-top: 8px; font-size: 12px; color: #65676b;';
                newInfoDiv.textContent = '📷 Imagen personalizada';
                replyDiv.querySelector('textarea').after(newInfoDiv);
              }
              
              // Re-attach event listeners for new buttons
              setupImageButtons();
            }
          }
        }
      }

      // Function to remove image preview
      function removeImagePreview(index) {
        const preview = repliesContainer.querySelector(`.pajaritos-image-preview[data-index="${index}"]`);
        if (preview) {
          const container = preview.closest('div[style*="display: flex"]');
          if (container) {
            container.remove();
          }
          
          // Add "Add image" button back
          const replyDiv = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${index}"]`)?.closest('div[style*="margin-bottom: 20px"]');
          if (replyDiv) {
            const headerDiv = replyDiv.querySelector('div[style*="display: flex"]');
            if (headerDiv) {
              const addContainer = document.createElement('div');
              addContainer.style.cssText = 'margin-left: auto;';
              addContainer.innerHTML = `
                <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${index}" style="display: none;">
                <button type="button" class="pajaritos-add-image-btn" data-index="${index}" style="
                  padding: 6px 12px;
                  font-size: 12px;
                  background: #42b72a;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                ">➕ Agregar imagen</button>
              `;
              headerDiv.appendChild(addContainer);
              
              // Remove info text
              const infoDiv = replyDiv.querySelector('div[style*="margin-top: 8px"]');
              if (infoDiv && infoDiv.textContent.includes('Imagen')) {
                infoDiv.remove();
              }
              
              // Mark image as removed in the input dataset
              const input = replyDiv.querySelector(`.pajaritos-reply-input[data-index="${index}"]`);
              if (input) {
                input.dataset.imageRemoved = 'true';
              }
              
              // Re-attach event listeners
              setupImageButtons();
            }
          }
        }
      }

      // Function to setup image button event listeners
      function setupImageButtons() {
        // Remove old listeners by cloning and re-adding
        const newImageInputs = repliesContainer.querySelectorAll('.pajaritos-image-input');
        const newChangeBtns = repliesContainer.querySelectorAll('.pajaritos-change-image-btn');
        const newRemoveBtns = repliesContainer.querySelectorAll('.pajaritos-remove-image-btn');
        const newAddBtns = repliesContainer.querySelectorAll('.pajaritos-add-image-btn');

        // Change image button
        newChangeBtns.forEach(btn => {
          btn.onclick = () => {
            const index = btn.dataset.index;
            const input = repliesContainer.querySelector(`.pajaritos-image-input[data-index="${index}"]`);
            if (input) {
              input.click();
            }
          };
        });

        // Remove image button
        newRemoveBtns.forEach(btn => {
          btn.onclick = () => {
            const index = btn.dataset.index;
            removeImagePreview(index);
            saveFormData();
          };
        });

        // Add image button
        newAddBtns.forEach(btn => {
          btn.onclick = () => {
            const index = btn.dataset.index;
            const input = repliesContainer.querySelector(`.pajaritos-image-input[data-index="${index}"]`);
            if (input) {
              input.click();
            }
          };
        });

        // File input change
        newImageInputs.forEach(input => {
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              try {
                const base64 = await imageToBase64(file);
                const index = input.dataset.index;
                if (!index || index === 'undefined' || index === 'null') {
                  console.error('[Pajaritos] Invalid index from input:', input, 'dataset:', input.dataset);
                  alert('Error: No se pudo identificar el comentario. Por favor, recarga el formulario.');
                  return;
                }
                updateImagePreview(index, base64);
                saveFormData();
              } catch (error) {
                console.error('[Pajaritos] Error converting image:', error);
                alert('Error al cargar la imagen. Por favor, intenta con otra imagen.');
              }
            }
            // Reset input so same file can be selected again
            input.value = '';
          };
        });
        
        // Setup download image buttons
        const downloadBtns = repliesContainer.querySelectorAll('.pajaritos-download-image-btn');
        downloadBtns.forEach(btn => {
          btn.onclick = () => {
            const imageUrl = btn.dataset.imageUrl;
            const input = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${btn.dataset.index}"]`);
            const commentId = input ? input.dataset.commentId : null;
            if (imageUrl) {
              downloadImage(imageUrl, commentId);
            }
          };
        });
        
        // Setup click on image preview to download
        const imagePreviews = repliesContainer.querySelectorAll('.pajaritos-image-preview');
        imagePreviews.forEach(preview => {
          preview.onclick = () => {
            const imageUrl = preview.dataset.imageUrl || preview.src;
            const commentId = preview.dataset.commentId;
            if (imageUrl && !imageUrl.includes('data:image/svg')) {
              downloadImage(imageUrl, commentId);
            }
          };
        });
      }

      // Function to generate unique ID for custom comments
      function generateCustomCommentId() {
        const storageKey = getStorageKey() || 'unknown';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `custom_${storageKey}_${timestamp}_${random}`;
      }

      // Function to add a new empty comment
      function addNewComment() {
        const currentReplies = getCurrentReplies();
        const baseCommentCount = currentReplies ? currentReplies.length : 0;
        // Count existing custom comments in the DOM
        const existingCustomInputs = repliesContainer.querySelectorAll('.pajaritos-reply-input[data-custom="true"]');
        const newIndex = baseCommentCount + existingCustomInputs.length;
        const customId = generateCustomCommentId();
        
        const newCommentHtml = `
          <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e4e6eb; border-radius: 8px; background: #f8f9fa; border-left: 3px solid #42b72a;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <label style="display: flex; align-items: center; cursor: pointer; flex: 1;">
                <input type="checkbox" class="pajaritos-reply-checkbox" data-index="${newIndex}" data-custom="true" data-comment-id="${customId}" checked style="
                  width: 18px;
                  height: 18px;
                  margin-right: 8px;
                  cursor: pointer;
                ">
                <span style="font-weight: 500; color: #333;">Comentario ${newIndex + 1}:</span>
              </label>
              <div style="margin-left: auto;">
                <input type="file" accept="image/*" class="pajaritos-image-input" data-index="${newIndex}" style="display: none;">
                <button type="button" class="pajaritos-add-image-btn" data-index="${newIndex}" style="
                  padding: 6px 12px;
                  font-size: 12px;
                  background: #42b72a;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                ">➕ Agregar imagen</button>
              </div>
              <button type="button" class="pajaritos-delete-comment-btn" data-index="${newIndex}" style="
                margin-left: 8px;
                padding: 4px 8px;
                font-size: 11px;
                background: #f02849;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">🗑️ Eliminar comentario</button>
            </div>
            <textarea class="pajaritos-reply-input" data-index="${newIndex}" data-custom="true" data-comment-id="${customId}" data-image="" placeholder="Escribe tu comentario aquí..." style="
              width: 100%;
              min-height: 80px;
              padding: 10px;
              border: 2px solid #e4e6eb;
              border-radius: 6px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              box-sizing: border-box;
            "></textarea>
          </div>
        `;
        
        // Insert before the "Add new comment" button
        const addBtn = repliesContainer.querySelector('#pajaritos-add-new-comment-btn');
        if (addBtn) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newCommentHtml;
          addBtn.parentElement.insertBefore(tempDiv.firstElementChild, addBtn);
        } else {
          repliesContainer.insertAdjacentHTML('beforeend', newCommentHtml);
        }
        
        // Setup event listeners for the new comment
        setupImageButtons();
        setupNewCommentListeners();
        saveFormData();
      }

      // Function to delete a comment (original or custom)
      function deleteComment(index) {
        const commentDiv = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${index}"]`)?.closest('div[style*="margin-bottom: 20px"]');
        if (commentDiv) {
          if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            commentDiv.remove();
            saveFormData();
          }
        }
      }

      // Function to download image
      async function downloadImage(imageUrl, commentId) {
        try {
          let blob;
          
          // If it's a base64 image (custom image)
          if (imageUrl.startsWith('data:image')) {
            const response = await fetch(imageUrl);
            blob = await response.blob();
          } else {
            // If it's a URL (extension image or external)
            const response = await fetch(imageUrl);
            blob = await response.blob();
          }
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          // Generate filename from comment ID or use timestamp
          const filename = commentId ? `imagen_${commentId}_${Date.now()}.png` : `imagen_${Date.now()}.png`;
          a.download = filename;
          
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('[Pajaritos] Error downloading image:', error);
          alert('Error al descargar la imagen. Por favor, intenta nuevamente.');
        }
      }

      // Function to setup listeners for new comment and delete buttons
      function setupNewCommentListeners() {
        const addNewBtn = repliesContainer.querySelector('#pajaritos-add-new-comment-btn');
        const deleteBtns = repliesContainer.querySelectorAll('.pajaritos-delete-comment-btn');
        
        if (addNewBtn) {
          addNewBtn.onclick = () => {
            addNewComment();
          };
        }
        
        deleteBtns.forEach(btn => {
          btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            deleteComment(index);
          };
        });
        
        // Setup download image buttons
        const downloadBtns = repliesContainer.querySelectorAll('.pajaritos-download-image-btn');
        downloadBtns.forEach(btn => {
          btn.onclick = () => {
            const imageUrl = btn.dataset.imageUrl;
            const input = repliesContainer.querySelector(`.pajaritos-reply-input[data-index="${btn.dataset.index}"]`);
            const commentId = input ? input.dataset.commentId : null;
            if (imageUrl) {
              downloadImage(imageUrl, commentId);
            }
          };
        });
        
        // Setup click on image preview to download
        const imagePreviews = repliesContainer.querySelectorAll('.pajaritos-image-preview');
        imagePreviews.forEach(preview => {
          preview.onclick = () => {
            const imageUrl = preview.dataset.imageUrl || preview.src;
            const commentId = preview.dataset.commentId;
            if (imageUrl && !imageUrl.includes('data:image/svg')) {
              downloadImage(imageUrl, commentId);
            }
          };
        });
      }

      // Setup image buttons
      setupImageButtons();
      setupNewCommentListeners();

      // Save on text input (with debounce)
      let saveTimeout;
      replyInputs.forEach(input => {
        input.addEventListener('input', () => {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            saveFormData();
          }, 500); // Save 500ms after user stops typing
        });
      });

      // Save on checkbox change
      replyCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          saveFormData();
        });
      });
    }

    // Cancel handler - save before closing
    cancelBtn.addEventListener('click', async () => {
      await saveFormData();
      overlay.remove();
    });

    // Close X button handler - same behavior as Cancel
    closeXBtn.addEventListener('click', async () => {
      await saveFormData();
      overlay.remove();
    });

    // Modal only closes with Cancel button - click outside does nothing
    // (Removed overlay click handler to prevent accidental form closure)

    // Submit handler - send all comments sequentially
    submitBtn.addEventListener('click', async () => {
      const selectedKey = optionSelect.value;
      if (!selectedKey || !replyOptions[selectedKey]) {
        statusDiv.textContent = 'Por favor, selecciona una opción';
        statusDiv.style.color = '#f02849';
        return;
      }

      // Collect all reply inputs and checkboxes
      const replyInputs = form.querySelectorAll('.pajaritos-reply-input');
      const replyCheckboxes = form.querySelectorAll('.pajaritos-reply-checkbox');
      
      // Create a map of index to checkbox state
      const checkboxStates = {};
      replyCheckboxes.forEach(checkbox => {
        checkboxStates[checkbox.dataset.index] = checkbox.checked;
      });
      
      // Collect replies, but only include those with checked checkboxes
      const replies = Array.from(replyInputs)
        .map(input => {
          const index = input.dataset.index;
          
          // Check for custom image first (base64)
          const imagePreview = repliesContainer.querySelector(`.pajaritos-image-preview[data-index="${index}"]`);
          const addImageBtn = repliesContainer.querySelector(`.pajaritos-add-image-btn[data-index="${index}"]`);
          
          let image = null;
          let isBase64 = false;
          
          // Check if image was explicitly removed
          const imageRemoved = input.dataset.imageRemoved === 'true';
          
          // If "Add image" button exists or image was marked as removed, don't include any image
          if (addImageBtn || imageRemoved) {
            // Image was removed, don't include any image
            image = null;
            isBase64 = false;
          } else if (imagePreview) {
            // Image preview exists
            const customImage = imagePreview.dataset.customImage;
            if (customImage && customImage.trim() !== '') {
              // Custom image (base64)
              image = customImage;
              isBase64 = true;
            } else {
              // Default image from extension (still showing preview)
              const imageValue = input.dataset.image;
              image = (imageValue && imageValue.trim() !== '') ? imageValue : null;
            }
          } else {
            // No image preview and no add button - check if there was a default image
            // But if there's no preview, it might have been removed, so check the reply config
            const imageValue = input.dataset.image;
            // Only use default image if it exists in the original config
            // If user removed it, there should be an add button, so this case shouldn't happen
            // But to be safe, we'll check if there's a default image
            image = (imageValue && imageValue.trim() !== '') ? imageValue : null;
          }
          
          return {
            index: parseInt(index),
            text: input.value.trim(),
            image: image,
            isBase64: isBase64,
            enabled: checkboxStates[index] !== false // Default to true if not found
          };
        })
        .filter(reply => reply.enabled); // Only keep enabled replies

      // Validate that at least one reply is enabled and has text
      const hasText = replies.some(r => r.text);
      if (replies.length === 0) {
        statusDiv.textContent = 'Por favor, selecciona al menos un comentario para publicar';
        statusDiv.style.color = '#f02849';
        return;
      }
      if (!hasText) {
        statusDiv.textContent = 'Por favor, ingresa texto en al menos un comentario';
        statusDiv.style.color = '#f02849';
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publicando...';
      submitBtn.style.opacity = '0.6';
      statusDiv.textContent = '';
      statusDiv.style.color = '';
      progressDiv.textContent = '';

      // Click the main post's comment button first (only once, before the loop)
      const mainPostActions = postElement.querySelector('div[role="group"]') || 
                             postElement.querySelector('div[role="toolbar"]') ||
                             Array.from(postElement.querySelectorAll('div')).find(div => {
                               const txt = div.textContent?.toLowerCase() || '';
                               return (txt.includes('me gusta') || txt.includes('like')) && 
                                      (txt.includes('compartir') || txt.includes('share'));
                             });
      
      let commentButtonClicked = false;
      if (mainPostActions) {
        const buttons = mainPostActions.querySelectorAll('div[role="button"], span[role="button"], a');
        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i];
          const text = btn.textContent?.toLowerCase().trim() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          
          if ((text === 'comentar' || text === 'comment' ||
               ariaLabel.includes('comentar') || ariaLabel.includes('comment')) &&
              !text.includes('responder') && !text.includes('reply') &&
              !ariaLabel.includes('responder') && !ariaLabel.includes('reply')) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await wait(300);
            btn.click();
            await wait(2000);
            commentButtonClicked = true;
            break;
          }
        }
        
        if (!commentButtonClicked && buttons.length >= 2) {
          buttons[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
          await wait(300);
          buttons[1].click();
          await wait(2000);
          commentButtonClicked = true;
        }
      }

      // Send all replies sequentially
      let successCount = 0;
      let errorCount = 0;

      // Calculate total enabled replies for progress display
      const totalEnabled = replies.length;
      let currentIndex = 0;

      for (let i = 0; i < replies.length; i++) {
        const reply = replies[i];
        if (!reply.text) continue; // Skip empty replies

        currentIndex++;
        // Update progress
        progressDiv.textContent = `📝 Comentario ${currentIndex} de ${totalEnabled}`;
        progressDetailDiv.textContent = 'Preparando...';

        // Post comment with or without image
        // Note: postCommentWithImage will handle opening the input if needed
        // For subsequent comments, we need to click the comment button again
        if (i > 0 || !commentButtonClicked) {
          progressDetailDiv.textContent = 'Abriendo caja de comentarios...';
          // Click comment button again for subsequent comments
          if (mainPostActions) {
            const buttons = mainPostActions.querySelectorAll('div[role="button"], span[role="button"], a');
            for (const btn of buttons) {
              const text = btn.textContent?.toLowerCase().trim() || '';
              const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
              
              if ((text === 'comentar' || text === 'comment' ||
                   ariaLabel.includes('comentar') || ariaLabel.includes('comment')) &&
                  !text.includes('responder') && !text.includes('reply') &&
                  !ariaLabel.includes('responder') && !ariaLabel.includes('reply')) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await wait(300);
                btn.click();
                await wait(2000);
                break;
              }
            }
          }
        }

        // Create progress callback
        const updateProgress = (step) => {
          progressDetailDiv.textContent = step;
        };

        // Only pass image if it's a valid non-empty string
        // Pass both image path/data and whether it's base64
        const imageToUpload = (reply.image && reply.image.trim() !== '' && reply.image !== 'null' && reply.image !== 'undefined') 
                              ? reply.image 
                              : null;
        const isBase64Image = reply.isBase64 || false;
        
        const result = await postCommentWithImage(reply.text, imageToUpload, postElement, updateProgress, isBase64Image);

        if (result.success) {
          successCount++;
          progressDetailDiv.textContent = `✅ Comentario ${i + 1} publicado exitosamente`;
          // Notify extension popup
          chrome.runtime.sendMessage({
            type: 'comment_success',
            message: reply.text
          });
          
          // Wait a bit before posting next comment
          if (i < replies.length - 1) {
            await wait(1000);
          }
        } else {
          errorCount++;
          progressDetailDiv.textContent = `❌ Error al publicar comentario ${i + 1}`;
          console.error(`[Pajaritos] Error posting reply ${i + 1}:`, result.error);
        }
      }

      // Show final status
      if (successCount > 0 && errorCount === 0) {
        statusDiv.textContent = `✅ ¡${successCount} comentario(s) publicado(s) exitosamente!`;
        statusDiv.style.color = '#42b72a';
        progressDiv.textContent = '';
        
        setTimeout(() => {
          overlay.remove();
        }, 2000);
      } else if (successCount > 0) {
        statusDiv.textContent = `⚠️ ${successCount} publicado(s), ${errorCount} error(es)`;
        statusDiv.style.color = '#f02849';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar Comentarios';
        submitBtn.style.opacity = '1';
      } else {
        statusDiv.textContent = `❌ Error: No se pudo publicar ningún comentario`;
        statusDiv.style.color = '#f02849';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar Comentarios';
        submitBtn.style.opacity = '1';
      }
    });
  }

  // Post comment with optional image
  async function postCommentWithImage(commentText, imagePath, postElement, progressCallback, isBase64 = false) {
    // Wait for the input to appear (it might take a moment after clicking the comment button)
    let input = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    if (progressCallback) progressCallback('Buscando campo de comentario...');
    console.log('[Pajaritos] Waiting for comment input to appear...');
    while (!input && attempts < maxAttempts) {
      input = findCommentInput(postElement);
      if (!input) {
        console.log(`[Pajaritos] Input not found yet, attempt ${attempts + 1}/${maxAttempts}`);
        await wait(300);
        attempts++;
      } else {
        console.log('[Pajaritos] ✅ Input found!');
        break;
      }
    }
    
    if (!input) {
      console.log('[Pajaritos] ❌ Main post comment input not found after waiting');
      if (progressCallback) progressCallback('❌ Error: No se encontró el campo de comentario');
      return { success: false, error: 'Main post comment input not found' };
    }

    try {
      // Focus the input to open the comment box
      // Only click if we need to upload an image (to ensure buttons are visible)
      if (progressCallback) progressCallback('Abriendo campo de comentario...');
      input.focus();
      
      // Only click if we need to upload an image (clicking might trigger image selector)
      if (imagePath) {
        input.click();
        await wait(500);
      } else {
        // For text-only comments, just focus (don't click to avoid opening image selector)
        await wait(300);
      }

      // If there's an image, upload it first
      // Double-check that imagePath is not null, undefined, or empty string
      if (imagePath && imagePath.trim() !== '' && imagePath !== 'null' && imagePath !== 'undefined') {
        if (progressCallback) progressCallback(`📷 Subiendo imagen${isBase64 ? ' (personalizada)' : ''}...`);
        console.log('[Pajaritos] 📷 Uploading image:', isBase64 ? 'base64 image' : imagePath);
        const imageUploaded = await uploadImageToComment(input, imagePath, progressCallback, isBase64);
        if (!imageUploaded) {
          console.log('[Pajaritos] ⚠️ Image upload failed, continuing with text only');
          if (progressCallback) progressCallback('⚠️ Error al subir imagen, continuando solo con texto...');
        } else {
          console.log('[Pajaritos] ✅ Image uploaded successfully');
          if (progressCallback) progressCallback('✅ Imagen subida, procesando...');
          await wait(2000); // Wait for image to process
        }
      } else {
        console.log('[Pajaritos] No image to upload, skipping image upload step');
      }

      // Clear any existing content
      if (progressCallback) progressCallback('Escribiendo texto del comentario...');
      if (input.contentEditable === 'true') {
        input.textContent = '';
        input.innerText = '';
      } else {
        input.value = '';
      }
      await wait(200);

      // Set the text content
      if (input.contentEditable === 'true') {
        input.innerText = commentText;
        input.textContent = commentText;
        
        const range = document.createRange();
        range.selectNodeContents(input);
        range.deleteContents();
        const textNode = document.createTextNode(commentText);
        range.insertNode(textNode);
        range.collapse(false);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        const events = [
          new Event('input', { bubbles: true, cancelable: true }),
          new Event('beforeinput', { bubbles: true, cancelable: true }),
          new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: commentText })
        ];
        
        for (const event of events) {
          input.dispatchEvent(event);
        }
      } else {
        input.value = commentText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      await wait(1000);
      
      // Find and click the submit button
      if (progressCallback) progressCallback('Publicando comentario...');
      let submitButton = null;
      const inputContainer = input.closest('form') ||
                            input.closest('div[data-testid*="comment"]') ||
                            input.closest('div[role="textbox"]')?.parentElement?.parentElement ||
                            input.parentElement?.parentElement?.parentElement;
      
      if (inputContainer) {
        const buttons = inputContainer.querySelectorAll('div[role="button"], span[role="button"], button');
        
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue;
          
          const text = btn.textContent?.toLowerCase().trim() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          
          // Explicitly exclude image/photo/video buttons
          if (ariaLabel.includes('adjunta') || ariaLabel.includes('attach') || 
              ariaLabel.includes('photo') || ariaLabel.includes('video') ||
              ariaLabel.includes('imagen') || ariaLabel.includes('gif') ||
              ariaLabel.includes('sticker') || ariaLabel.includes('emoji')) {
            continue; // Skip image/media buttons
          }
          
          if (text === 'publicar' || text === 'post' || text === 'comentar' || text === 'comment' ||
              ariaLabel.includes('publicar') || ariaLabel.includes('post') ||
              (ariaLabel.includes('comentar') && !ariaLabel.includes('escribir') && 
               !ariaLabel.includes('adjunta') && !ariaLabel.includes('attach'))) {
            submitButton = btn;
            break;
          }
        }
      }
      
      if (!submitButton) {
        const inputRect = input.getBoundingClientRect();
        const allButtons = document.querySelectorAll('div[role="button"], span[role="button"], button');
        
        for (const btn of allButtons) {
          if (btn.offsetParent === null) continue;
          
          const btnRect = btn.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(btnRect.left - inputRect.right, 2) +
            Math.pow(btnRect.top - inputRect.top, 2)
          );
          
          if (distance < 200) {
            const text = btn.textContent?.toLowerCase().trim() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            
            // Explicitly exclude image/photo/video buttons
            if (ariaLabel.includes('adjunta') || ariaLabel.includes('attach') || 
                ariaLabel.includes('photo') || ariaLabel.includes('video') ||
                ariaLabel.includes('imagen') || ariaLabel.includes('gif') ||
                ariaLabel.includes('sticker') || ariaLabel.includes('emoji')) {
              continue; // Skip image/media buttons
            }
            
            if (text === 'publicar' || text === 'post' || text === 'comentar' || text === 'comment' ||
                ariaLabel.includes('publicar') || ariaLabel.includes('post') ||
                (ariaLabel.includes('comentar') && !ariaLabel.includes('escribir') && 
                 !ariaLabel.includes('adjunta') && !ariaLabel.includes('attach'))) {
              submitButton = btn;
              break;
            }
          }
        }
      }

      if (submitButton) {
        submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(300);
        submitButton.click();
        console.log('[Pajaritos] ✅ Comment posted via submit button');
        await wait(2000);
        return { success: true };
      } else {
        // Fallback: try pressing Enter
        console.log('[Pajaritos] ⚠️ Submit button not found, trying Enter key');
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(enterEvent);
        await wait(2000);
        return { success: true };
      }
    } catch (error) {
      console.error('[Pajaritos] Error posting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload image to comment
  async function uploadImageToComment(input, imagePath, progressCallback, isBase64 = false) {
    try {
      // Validate imagePath first
      if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === 'undefined') {
        console.log('[Pajaritos] ❌ Invalid image path:', imagePath);
        if (progressCallback) progressCallback('❌ Error: Ruta de imagen inválida');
        return false;
      }

      if (progressCallback) progressCallback('Buscando botón para subir imagen...');
      // Find the photo upload button near the input
      const inputContainer = input.closest('form') ||
                            input.closest('div[data-testid*="comment"]') ||
                            input.parentElement?.parentElement?.parentElement;
      
      if (!inputContainer) {
        console.log('[Pajaritos] ❌ Could not find input container');
        if (progressCallback) progressCallback('❌ Error: No se encontró el contenedor');
        return false;
      }

      // Find the "adjunta una foto o un video" button
      // Wait a bit for buttons to appear after focusing
      await wait(500);
      const photoButtons = inputContainer.querySelectorAll('div[role="button"], span[role="button"], button');
      let photoButton = null;
      
      for (const btn of photoButtons) {
        if (btn.offsetParent === null) continue; // Skip hidden buttons
        
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        // Be more specific - only match the exact photo upload button
        if ((ariaLabel.includes('adjunta una foto') || ariaLabel.includes('adjunta una foto o un video')) && 
            !ariaLabel.includes('gif') && !ariaLabel.includes('sticker') && !ariaLabel.includes('emoji')) {
          photoButton = btn;
          console.log('[Pajaritos] 📷 Found photo button:', ariaLabel);
          break;
        }
      }

      if (!photoButton) {
        console.log('[Pajaritos] ❌ Photo button not found');
        if (progressCallback) progressCallback('❌ Error: No se encontró el botón de imagen');
        return false;
      }

      // Click the photo button
      if (progressCallback) progressCallback('Abriendo selector de archivos...');
      photoButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await wait(200);
      photoButton.click();
      await wait(1000);

      // Find the file input (it should appear after clicking)
      if (progressCallback) progressCallback('Buscando campo de archivo...');
      let fileInput = null;
      let attempts = 0;
      while (!fileInput && attempts < 10) {
        // Look for file input in the document
        fileInput = inputContainer.querySelector('input[type="file"]') ||
                   document.querySelector('input[type="file"][accept*="image"]') ||
                   document.querySelector('input[type="file"][accept*="video"]');
        
        if (!fileInput) {
          await wait(300);
          attempts++;
        }
      }

      if (!fileInput) {
        console.log('[Pajaritos] ❌ File input not found');
        if (progressCallback) progressCallback('❌ Error: No se encontró el campo de archivo');
        return false;
      }

      // Convert image to File object
      let file;
      if (isBase64) {
        // Convert base64 to File object
        if (progressCallback) progressCallback('Procesando imagen personalizada...');
        const base64Data = imagePath;
        const response = await fetch(base64Data);
        const blob = await response.blob();
        // Extract filename from base64 or use default
        const filename = `custom_image_${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
        file = new File([blob], filename, { type: blob.type });
      } else {
        // Load image from extension
        if (progressCallback) progressCallback('Cargando imagen desde la extensión...');
        const imageUrl = chrome.runtime.getURL(`images/${imagePath}`);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        file = new File([blob], imagePath, { type: blob.type });
      }

      // Create a DataTransfer object to simulate file drop
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      // Assign files to input
      if (progressCallback) progressCallback('Asignando imagen al campo...');
      fileInput.files = dataTransfer.files;

      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      fileInput.dispatchEvent(changeEvent);

      // Also trigger input event
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      fileInput.dispatchEvent(inputEvent);

      if (progressCallback) progressCallback('Esperando que Facebook procese la imagen...');
      console.log('[Pajaritos] ✅ File assigned to input');
      return true;
    } catch (error) {
      console.error('[Pajaritos] Error uploading image:', error);
      return false;
    }
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
      return false;
    }
    
    // If it has post attributes and no reply input, it's likely a main post
    if (hasPostAttributes) {
      const commentContainer = element.closest('[data-testid*="comment"]');
      if (commentContainer) {
        const parentArticle = commentContainer.closest('div[role="article"]');
        if (parentArticle && parentArticle !== element) {
          return false;
        }
      }
      const hasReplyButton = element.querySelector('div[role="button"][aria-label*="Responder"]') !== null ||
                            element.querySelector('div[role="button"][aria-label*="Reply"]') !== null ||
                            element.querySelector('span[role="button"][aria-label*="Responder"]') !== null ||
                            element.querySelector('span[role="button"][aria-label*="Reply"]') !== null;
      
      if (!hasReplyButton) {
        return true;
      } else {
        return false;
      }
    }
    
    // If no post attributes, do stricter checks
    const hasReplyButton = element.querySelector('div[role="button"][aria-label*="Responder"]') !== null ||
                          element.querySelector('div[role="button"][aria-label*="Reply"]') !== null ||
                          element.querySelector('span[role="button"][aria-label*="Responder"]') !== null ||
                          element.querySelector('span[role="button"][aria-label*="Reply"]') !== null;
    
    if (hasReplyButton) {
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
          break;
        }
      }
    }
    
    // (Post attributes check was moved to the top of the function)
    
    // Accept if: has comment button OR has main post input OR has action buttons (and no reply input)
    if (!hasCommentButton && !hasMainPostInput && !hasActionButtons) {
      return false;
    }
    
    // STRICT: Must NOT be nested inside a comment structure
    const commentContainer = element.closest('[data-testid*="comment"]');
    if (commentContainer) {
      const parentArticle = commentContainer.closest('div[role="article"]');
      if (parentArticle && parentArticle !== element) {
        return false;
      }
    }
    
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
        // Filter to only main posts, not comments
        const filtered = Array.from(found).filter(post => isMainPost(post));
        if (filtered.length > 0) {
          posts = filtered;
          break;
        }
      }
    }

    if (posts.length === 0) {
      // Try a more general approach - look for posts by finding main comment buttons
      const allCommentButtons = document.querySelectorAll('div[role="button"][aria-label*="Comment"], div[role="button"][aria-label*="Comentar"]');
      
      allCommentButtons.forEach(btn => {
        const btnText = btn.textContent?.toLowerCase() || '';
        const btnAriaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        
        // STRICT: Only process "Comentar" buttons, NOT "Responder" buttons
        if (btnText.includes('responder') || btnText.includes('reply') ||
            btnAriaLabel.includes('responder') || btnAriaLabel.includes('reply')) {
          return; // Skip reply buttons
        }
        
        // Skip if this button is inside a comment structure
        const commentContainer = btn.closest('[data-testid*="comment"]');
        if (commentContainer) {
          const parentArticle = commentContainer.closest('div[role="article"]');
          if (parentArticle) {
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
          posts.push(post);
        }
      });
    }
    
    if (posts.length === 0) {
      return;
    }
    
    posts.forEach((post) => {
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

  // Initial check after a delay
  setTimeout(() => {
    console.log('[Pajaritos de Guardia] Running initial post scan...');
    addButtonsToPosts();
  }, 2000);

  console.log('[Pajaritos de Guardia] Content script loaded - Manual mode');
  console.log('[Pajaritos] Current URL:', window.location.href);
  console.log('[Pajaritos] Ready to add reply buttons to posts');
})();
