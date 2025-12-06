// Voluntarios de Guardia - Manual Reply Content Script
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
    
    // EXPANDED SEARCH: Also check grandparents and siblings
    // Facebook often has buttons in containers outside the article element
    if (!searchRoot.querySelector('div[data-ad-rendering-role="comment_button"]') && 
        !searchRoot.querySelector('div[role="button"][aria-label*="Comentar"]')) {
      // Try going up more levels
      let currentElement = postElement;
      let levels = 0;
      while (currentElement && levels < 5) {
        const grandparent = currentElement.parentElement;
        if (!grandparent) break;
        
        // Check if grandparent has action buttons (Like/Comment/Share area)
        const hasActionButtons = grandparent.querySelector('div[role="group"]') ||
                                grandparent.querySelector('div[role="toolbar"]') ||
                                grandparent.textContent?.toLowerCase().includes('comentar') ||
                                grandparent.textContent?.toLowerCase().includes('me gusta');
        
        if (hasActionButtons) {
          searchRoot = grandparent;
          console.log(`[Pajaritos] 🔍 Expanded search to grandparent level ${levels + 1} (found action buttons area)`);
          break;
        }
        
        currentElement = grandparent;
        levels++;
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
    // First, check if the comment input is already visible
    let input = findCommentInput(postElement);
    
    // If input is not visible, we need to click the "Comentar" button first
    if (!input || input.offsetParent === null) {
      console.log('[Pajaritos] ⚠️ Comment input not visible, clicking "Comentar" button...');
      
      // Find the "Comentar" button for this post
      const commentButton = findCommentButton(postElement);
      
      if (commentButton) {
        console.log('[Pajaritos] ✅ Found "Comentar" button, clicking it...');
        commentButton.click();
        await wait(1000); // Wait for the input to appear after clicking
      } else {
        console.log('[Pajaritos] ⚠️ "Comentar" button not found, trying to find input anyway...');
      }
    }
    
    // Wait for the input to appear (it might take a moment after clicking the comment button)
    let attempts = 0;
    const maxAttempts = 15; // Increased attempts since we might have just clicked the button
    
    console.log('[Pajaritos] Waiting for comment input to appear...');
    while (!input && attempts < maxAttempts) {
      input = findCommentInput(postElement);
      if (!input || input.offsetParent === null) {
        console.log(`[Pajaritos] Input not found yet, attempt ${attempts + 1}/${maxAttempts}`);
        await wait(300);
        attempts++;
      } else {
        console.log('[Pajaritos] ✅ Input found and visible!');
        break;
      }
    }
    
    if (!input || input.offsetParent === null) {
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

  // Add button near comment input (new approach when post can't be found)
  function addButtonNearCommentInput(commentInput) {
    console.log('[Pajaritos] 🔘 addButtonNearCommentInput called for input:', commentInput);
    
    // Check if button already exists DIRECTLY near this specific input
    // Check in the input's immediate container and siblings
    const inputContainer = commentInput.parentElement;
    const existingBtn = inputContainer?.querySelector('.pajaritos-reply-btn') ||
                       commentInput.nextElementSibling?.classList?.contains('pajaritos-reply-btn') ? commentInput.nextElementSibling : null ||
                       commentInput.previousElementSibling?.classList?.contains('pajaritos-reply-btn') ? commentInput.previousElementSibling : null;
    
    if (existingBtn) {
      console.log('[Pajaritos] ⚠️ Button already exists directly near this input, skipping');
      return false;
    }
    
    // Find a good place to insert the button - prioritize being RIGHT NEXT TO the input
    let insertTarget = null;
    let insertMethod = null; // 'after', 'before', or 'append'
    
    // Strategy 1: Insert directly after the input element (best option)
    if (commentInput.parentElement) {
      insertTarget = commentInput.parentElement;
      insertMethod = 'after';
      console.log('[Pajaritos] ✅ Will insert button directly after input element');
    }
    
    // Strategy 2: If parent doesn't work, try inserting in the input's container (with other buttons/icons)
    if (!insertTarget) {
      const inputContainer = commentInput.parentElement;
      if (inputContainer) {
        // Check if container has other buttons (like emoji, photo, etc.) - this is the toolbar
        const hasOtherButtons = inputContainer.querySelectorAll('button, [role="button"]').length > 0;
        if (hasOtherButtons) {
          insertTarget = inputContainer;
          insertMethod = 'append';
          console.log('[Pajaritos] ✅ Found input container with other buttons (toolbar)');
        } else {
          // Try parent's parent
          const grandParent = inputContainer.parentElement;
          if (grandParent) {
            const hasButtons = grandParent.querySelectorAll('button, [role="button"]').length > 0;
            if (hasButtons) {
              insertTarget = grandParent;
              insertMethod = 'append';
              console.log('[Pajaritos] ✅ Found grandparent container with buttons');
            }
          }
        }
      }
    }
    
    // Strategy 3: Find sibling elements that might be a toolbar
    if (!insertTarget) {
      const inputParent = commentInput.parentElement;
      if (inputParent) {
        const siblings = Array.from(inputParent.children);
        const toolbarSibling = siblings.find(sibling => {
          const hasButtons = sibling.querySelectorAll('button, [role="button"]').length > 0;
          return hasButtons && sibling !== commentInput;
        });
        if (toolbarSibling) {
          insertTarget = toolbarSibling;
          insertMethod = 'append';
          console.log('[Pajaritos] ✅ Found toolbar sibling');
        }
      }
    }
    
    // Strategy 4: Insert directly after the input element (PREFERRED - right next to input)
    if (!insertTarget || insertMethod !== 'after') {
      // Try to insert right after the input element itself
      const inputParent = commentInput.parentElement;
      if (inputParent) {
        // Check if we can insert as a sibling right after the input
        insertTarget = inputParent;
        insertMethod = 'after';
        console.log('[Pajaritos] ✅ Will insert button directly after input element (preferred method)');
      }
    }
    
    // Final fallback: Use input parent
    if (!insertTarget) {
      insertTarget = commentInput.parentElement;
      insertMethod = 'append';
      console.log('[Pajaritos] ✅ Using input parent as final fallback');
    }
    
    if (!insertTarget) {
      console.error('[Pajaritos] ❌ No insert target found for comment input');
      return false;
    }
    
    // Find the post element for the form (try to find it from the input)
    // We'll search for it when the button is clicked, but for now try to find it
    let postElementForForm = null;
    
    // Try to find the post by going up the DOM tree
    let element = commentInput;
    let levels = 0;
    while (element && levels < 20) {
      const article = element.closest('div[role="article"]');
      if (article) {
        postElementForForm = article;
        console.log('[Pajaritos] ✅ Found post element for form via DOM traversal');
        break;
      }
      element = element.parentElement;
      levels++;
    }
    
    // If still not found, use the modal or a container
    if (!postElementForForm) {
      postElementForForm = commentInput.closest('[role="dialog"]') || 
                          commentInput.closest('div[data-testid*="modal"]') ||
                          commentInput.closest('div[aria-modal="true"]') ||
                          insertTarget;
      console.log('[Pajaritos] ⚠️ Using modal/container as post element for form');
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
      z-index: 10000;
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
      
      // Find the post element when clicked (in case DOM changed)
      let postElement = postElementForForm;
      if (!postElement || !postElement.closest('[role="dialog"]')) {
        // Try to find it again
        let element = commentInput;
        let levels = 0;
        while (element && levels < 20) {
          const article = element.closest('div[role="article"]');
          if (article) {
            postElement = article;
            break;
          }
          element = element.parentElement;
          levels++;
        }
        
        if (!postElement) {
          postElement = commentInput.closest('[role="dialog"]') || insertTarget;
        }
      }
      
      console.log('[Pajaritos] 🔘 Button clicked, showing form with post element:', postElement);
      // Show form modal
      showReplyForm(postElement, replyBtn);
    });
    
    // Insert button
    try {
      // Try to insert after the input or in the container
      if (insertTarget === commentInput.parentElement) {
        // Insert as sibling after input
        commentInput.insertAdjacentElement('afterend', replyBtn);
        console.log('[Pajaritos] ✅ Button inserted after comment input');
      } else {
        // Insert in container
        insertTarget.appendChild(replyBtn);
        console.log('[Pajaritos] ✅ Button inserted in container');
      }
      
      // Verify button is in DOM
      setTimeout(() => {
        const btnInDom = document.querySelector('.pajaritos-reply-btn');
        if (btnInDom) {
          console.log('[Pajaritos] ✅ Button verified in DOM');
        } else {
          console.error('[Pajaritos] ❌ Button NOT found in DOM after insertion!');
        }
      }, 100);
      
      return true;
    } catch (e) {
      console.error('[Pajaritos] ❌ Error inserting button near input:', e);
      return false;
    }
  }

  // Fallback: Add button to main post structure (when comment section approach fails)
  function addButtonToMainPostStructure(postElement) {
    console.log('[Pajaritos] 🔘 addButtonToMainPostStructure called for post:', postElement);
    console.log('[Pajaritos] 🔍 Post element details:', {
      tagName: postElement.tagName,
      className: postElement.className?.substring(0, 50),
      id: postElement.id,
      hasChildren: postElement.children.length,
      textPreview: postElement.textContent?.substring(0, 50)
    });
    
    // Check if button already exists
    if (postElement.querySelector('.pajaritos-reply-btn')) {
      console.log('[Pajaritos] ⚠️ Button already exists in post structure, skipping');
      return false;
    }
    
    // Strategy 1: Try to find the post header area (where author name, timestamp, etc. are)
    const headerSelectors = [
      'div[role="article"] > div:first-child', // First child of article
      'div[data-pagelet*="FeedUnit"] > div:first-child',
      'h3', // Author name is usually in h3
      'div[dir="auto"]', // Text containers
      'span[dir="auto"]'
    ];
    
    let insertTarget = null;
    
    // Try to find header area
    for (const selector of headerSelectors) {
      const element = postElement.querySelector(selector);
      if (element) {
        // Check if it's near the top of the post (likely header)
        const rect = element.getBoundingClientRect();
        const postRect = postElement.getBoundingClientRect();
        const isNearTop = rect.top - postRect.top < 200; // Within 200px of top
        
        if (isNearTop) {
          // Try to find a container that has the header and some space for our button
          let container = element.parentElement;
          if (container && container !== postElement) {
            insertTarget = container;
            console.log('[Pajaritos] ✅ Found header container for button insertion');
            break;
          }
        }
      }
    }
    
    // Strategy 2: Find the post content area (where the post text is)
    if (!insertTarget) {
      const contentSelectors = [
        'div[data-ad-preview="message"]',
        'div[data-ad-comet-preview="message"]',
        'div[dir="auto"]:not([role="button"])', // Text content, not buttons
        'span[dir="auto"]:not([role="button"])'
      ];
      
      for (const selector of contentSelectors) {
        const element = postElement.querySelector(selector);
        if (element) {
          // Find a parent container that can hold our button
          let container = element.parentElement;
          let levels = 0;
          while (container && container !== postElement && levels < 5) {
            // Check if container has enough space and is visible
            const rect = container.getBoundingClientRect();
            if (rect.width > 100 && rect.height > 20) {
              insertTarget = container;
              console.log('[Pajaritos] ✅ Found content container for button insertion');
              break;
            }
            container = container.parentElement;
            levels++;
          }
          if (insertTarget) break;
        }
      }
    }
    
    // Strategy 3: Find any visible container near the top of the post
    if (!insertTarget) {
      const allDivs = Array.from(postElement.querySelectorAll('div'));
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        const postRect = postElement.getBoundingClientRect();
        const isNearTop = rect.top - postRect.top < 300; // Within 300px of top
        const isVisible = rect.width > 50 && rect.height > 20;
        const hasContent = div.textContent && div.textContent.trim().length > 0;
        
        if (isNearTop && isVisible && hasContent) {
          // Check if it's not a button or input
          const isInteractive = div.querySelector('button, [role="button"], input, textarea') !== null;
          if (!isInteractive) {
            insertTarget = div;
            console.log('[Pajaritos] ✅ Found fallback container near top of post');
            break;
          }
        }
      }
    }
    
    // Strategy 4: Last resort - insert at the beginning of the post element itself
    if (!insertTarget) {
      insertTarget = postElement;
      console.log('[Pajaritos] ⚠️ Using post element itself as last resort');
    }
    
    // Create and insert the button
    const replyBtn = document.createElement('div');
    replyBtn.className = 'pajaritos-reply-btn';
    replyBtn.innerHTML = '🐦';
    replyBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1877f2 0%, #42b72a 100%);
      color: white;
      font-size: 18px;
      cursor: pointer;
      margin: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 10000;
      position: relative;
    `;
    
    replyBtn.title = 'Voluntarios de Guardia - Responder';
    
    replyBtn.addEventListener('mouseenter', () => {
      replyBtn.style.transform = 'scale(1.1)';
      replyBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    });
    
    replyBtn.addEventListener('mouseleave', () => {
      replyBtn.style.transform = 'scale(1)';
      replyBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    });
    
    replyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      showReplyForm(postElement, replyBtn);
    });
    
    // Insert the button
    try {
      console.log('[Pajaritos] 🔍 Insert target:', {
        tagName: insertTarget.tagName,
        className: insertTarget.className?.substring(0, 50),
        hasChildren: insertTarget.children.length,
        firstChild: insertTarget.firstChild?.tagName
      });
      
      // Try to insert at the beginning of the target
      if (insertTarget.firstChild) {
        insertTarget.insertBefore(replyBtn, insertTarget.firstChild);
        console.log('[Pajaritos] ✅ Button inserted before first child');
      } else {
        insertTarget.appendChild(replyBtn);
        console.log('[Pajaritos] ✅ Button appended as first child');
      }
      
      // If inserted into postElement directly, add some positioning
      if (insertTarget === postElement) {
        replyBtn.style.position = 'absolute';
        replyBtn.style.top = '10px';
        replyBtn.style.right = '10px';
        replyBtn.style.zIndex = '999999';
        // Make sure post has relative positioning
        const postStyle = window.getComputedStyle(postElement);
        if (postStyle.position === 'static') {
          postElement.style.position = 'relative';
          console.log('[Pajaritos] ✅ Set post element to position: relative');
        }
      }
      
      // Verify button is in DOM
      setTimeout(() => {
        const btnInDom = document.querySelector('.pajaritos-reply-btn');
        if (btnInDom && postElement.contains(btnInDom)) {
          console.log('[Pajaritos] ✅ Button verified in DOM and inside post element');
          const rect = btnInDom.getBoundingClientRect();
          console.log('[Pajaritos] 📍 Button position:', { top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        } else {
          console.error('[Pajaritos] ❌ Button NOT found in DOM or not inside post element!');
        }
      }, 100);
      
      console.log('[Pajaritos] ✅ Button added to main post structure successfully');
      return true;
    } catch (error) {
      console.error('[Pajaritos] ❌ Error inserting button into post structure:', error);
      console.error('[Pajaritos] ❌ Error stack:', error.stack);
      return false;
    }
  }

  // Create reply button for a post
  function createReplyButton(postElement) {
    console.log('[Pajaritos] 🔘 createReplyButton called for post:', postElement);
    
    // STRONGER CHECK: Check if button already exists anywhere near this post
    // Check within post element
    if (postElement.querySelector('.pajaritos-reply-btn')) {
      console.log('[Pajaritos] ⚠️ Button already exists in post element, skipping');
      return false;
    }
    
    // Check in parent elements (buttons might be in parent containers)
    let parent = postElement.parentElement;
    let levels = 0;
    while (parent && levels < 3) {
      const btnInParent = parent.querySelector('.pajaritos-reply-btn');
      if (btnInParent) {
        // Check if this button is related to our post
        const postRect = postElement.getBoundingClientRect();
        const btnRect = btnInParent.getBoundingClientRect();
        const distance = Math.abs(btnRect.top - postRect.bottom);
        // If button is within 200px of the post, consider it a duplicate
        if (distance < 200) {
          console.log('[Pajaritos] ⚠️ Button already exists in parent container (distance:', Math.round(distance), 'px), skipping');
          return false;
        }
      }
      parent = parent.parentElement;
      levels++;
    }
    
    // Check if post has been marked as processed
    if (postElement.dataset.pajaritosProcessed === 'true') {
      console.log('[Pajaritos] ⚠️ Post already processed, skipping');
      return false;
    }
    
    // Mark post as processed
    postElement.dataset.pajaritosProcessed = 'true';

    // Find where to insert the button (near comment button or action buttons)
    const commentButton = findCommentButton(postElement);
    console.log('[Pajaritos] 🔍 Comment button found:', commentButton ? 'YES' : 'NO');
    
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
              console.log('[Pajaritos] ❌ No insert target found, cannot create button');
              return false;
            }
          }
        }
      }

    console.log('[Pajaritos] 📍 Insert target:', insertTarget ? 'FOUND' : 'NOT FOUND');
    if (insertTarget) {
      const targetRect = insertTarget.getBoundingClientRect();
      console.log('[Pajaritos] 📍 Insert target details:', {
        tagName: insertTarget.tagName,
        className: insertTarget.className?.substring(0, 80),
        position: `(${Math.round(targetRect.left)}, ${Math.round(targetRect.top)})`,
        size: `${Math.round(targetRect.width)}x${Math.round(targetRect.height)}`,
        hasChildren: insertTarget.children.length
      });
    } else {
      console.error('[Pajaritos] ❌ No insert target found - cannot create button!');
      return false;
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
        console.log('[Pajaritos] ✅ Button inserted next to comment button (via parent)');
        // Verify insertion immediately
        if (parent.contains(replyBtn)) {
          return true;
        } else {
          console.error('[Pajaritos] ❌ Button not found in parent after insertion!');
          return false;
        }
      } else {
        commentButton.insertAdjacentElement('afterend', replyBtn);
        console.log('[Pajaritos] ✅ Button inserted after comment button');
        // Verify insertion
        if (commentButton.nextElementSibling === replyBtn || commentButton.parentElement?.contains(replyBtn)) {
          return true;
        } else {
          console.error('[Pajaritos] ❌ Button not found after comment button!');
          return false;
        }
      }
    } else if (insertTarget) {
      // Insert in action container
      try {
        insertTarget.appendChild(replyBtn);
        console.log('[Pajaritos] ✅ Button inserted in action container');
        // Verify button is actually in DOM immediately
        if (insertTarget.contains(replyBtn)) {
          console.log('[Pajaritos] ✅ Button verified in insertTarget immediately');
          return true;
        } else {
          console.error('[Pajaritos] ❌ Button NOT found in insertTarget after insertion!');
          // Try to find it elsewhere in document
          const btnInDom = document.querySelector('.pajaritos-reply-btn');
          if (btnInDom && btnInDom === replyBtn) {
            console.log('[Pajaritos] ⚠️ Button found in DOM but not in expected container');
            return true;
          } else {
            console.error('[Pajaritos] ❌ Button completely missing from DOM!');
            return false;
          }
        }
      } catch (e) {
        console.error('[Pajaritos] ❌ Error inserting button:', e);
        return false;
      }
    } else {
      console.error('[Pajaritos] ❌ No insert target available');
      return false;
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

    // Build option select dropdown - includes ALL registered config options
    let optionsHtml = '<option value="">Selecciona una opción...</option>';
    
    // Verify REPLY_OPTIONS is available
    if (typeof REPLY_OPTIONS === 'undefined') {
      console.error('[Pajaritos] ❌ REPLY_OPTIONS is undefined! Config files may not have loaded.');
    }
    
    // Get all options and sort them alphabetically by name for better UX
    const allOptions = Object.entries(replyOptions);
    console.log('[Pajaritos] 🔍 Raw options before sorting:', allOptions.length, 'options');
    console.log('[Pajaritos] 🔍 Option keys:', Object.keys(replyOptions).join(', '));
    
    // Sort alphabetically by name (case-insensitive)
    const sortedOptions = allOptions.sort((a, b) => {
      const nameA = (a[1]?.name || '').trim().toLowerCase();
      const nameB = (b[1]?.name || '').trim().toLowerCase();
      if (!nameA || !nameB) {
        console.warn('[Pajaritos] ⚠️ Missing name in option:', a[0], 'or', b[0]);
      }
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base', numeric: true });
    });
    
    // Include all registered options in the select
    for (const [key, option] of sortedOptions) {
      if (!option || !option.name) {
        console.warn('[Pajaritos] ⚠️ Skipping invalid option:', key);
        continue;
      }
      optionsHtml += `<option value="${key}">${option.name}</option>`;
    }
    
    // Log all available options for debugging (sorted list)
    const sortedNames = sortedOptions.map(([key, opt]) => `${key}: "${opt?.name || 'NO NAME'}"`).join(', ');
    console.log('[Pajaritos] 📋 Total options loaded:', Object.keys(replyOptions).length);
    console.log('[Pajaritos] 📋 Sorted options (first 10):', sortedNames.substring(0, 200));
    console.log('[Pajaritos] 📋 Has gorrion?', 'gorrion' in replyOptions, replyOptions.gorrion ? `name: "${replyOptions.gorrion.name}"` : 'NOT FOUND');

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
      
      <h2 style="margin: 0 0 20px 0; color: #1877f2; font-size: 20px;">🐦 Voluntarios de Guardia</h2>
      
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
    
    // Verify and ensure options are sorted correctly after DOM creation
    // This is a safety check in case the HTML wasn't properly sorted
    if (optionSelect) {
      const options = Array.from(optionSelect.options);
      const sortedOptions = options.slice(1).sort((a, b) => {
        const nameA = (a.textContent || '').trim().toLowerCase();
        const nameB = (b.textContent || '').trim().toLowerCase();
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base', numeric: true });
      });
      
      // Only reorder if needed
      let needsReorder = false;
      for (let i = 1; i < options.length; i++) {
        if (options[i].textContent !== sortedOptions[i - 1].textContent) {
          needsReorder = true;
          break;
        }
      }
      
      if (needsReorder) {
        console.log('[Pajaritos] 🔄 Reordering select options...');
        const firstOption = options[0]; // Keep the "Selecciona una opción..." option
        optionSelect.innerHTML = '';
        optionSelect.appendChild(firstOption);
        sortedOptions.forEach(opt => optionSelect.appendChild(opt));
      }
      
      // Verify gorrion is present
      const gorrionOption = Array.from(optionSelect.options).find(opt => opt.value === 'gorrion');
      if (!gorrionOption) {
        console.error('[Pajaritos] ❌ Gorrion option is MISSING from select!');
        console.log('[Pajaritos] Available values:', Array.from(optionSelect.options).map(o => o.value).join(', '));
      } else {
        console.log('[Pajaritos] ✅ Gorrion option found:', gorrionOption.textContent);
      }
    }
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
      if (!optionSelect) return null;
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
          if (!imageUrl) {
            console.warn('[Pajaritos] ⚠️ No image URL provided for download');
            return;
          }
          
          let blob;
          
          // If it's a base64 image (custom image)
          if (imageUrl.startsWith('data:image')) {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to fetch base64 image');
            blob = await response.blob();
          } else if (imageUrl.startsWith('chrome-extension://')) {
            // Extension URL - try to fetch it
            try {
              const response = await fetch(imageUrl);
              if (!response.ok) throw new Error('Failed to fetch extension image');
              blob = await response.blob();
            } catch (fetchError) {
              // If fetch fails, try using the URL directly (browser will handle it)
              console.warn('[Pajaritos] ⚠️ Could not fetch extension image, using direct URL');
              const a = document.createElement('a');
              a.href = imageUrl;
              a.download = commentId ? `imagen_${commentId}_${Date.now()}.png` : `imagen_${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              return; // Exit early since we used direct download
            }
          } else {
            // External URL or relative path
            try {
              // Try to convert relative path to extension URL
              const extensionUrl = imageUrl.startsWith('/') || !imageUrl.includes('://') 
                ? chrome.runtime.getURL(imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl)
                : imageUrl;
              const response = await fetch(extensionUrl);
              if (!response.ok) throw new Error('Failed to fetch image');
              blob = await response.blob();
            } catch (fetchError) {
              console.warn('[Pajaritos] ⚠️ Could not fetch image:', fetchError.message);
              // For external URLs, try direct download
              const a = document.createElement('a');
              a.href = imageUrl;
              a.download = commentId ? `imagen_${commentId}_${Date.now()}.png` : `imagen_${Date.now()}.png`;
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              return; // Exit early
            }
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
          // Don't show alert for fetch errors (they're expected for some images)
          if (!error.message?.includes('Failed to fetch')) {
            alert('Error al descargar la imagen. Por favor, intenta nuevamente.');
          }
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
      // NEVER click the input - it triggers file dialog
      if (progressCallback) progressCallback('Abriendo campo de comentario...');
      input.focus();
      await wait(500); // Wait for comment box to open
      
      // Don't click the input - just focus it to avoid triggering file dialog

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

      // First, try to find an existing hidden file input (Facebook sometimes has them pre-created)
      // This avoids opening the file dialog unnecessarily
      if (progressCallback) progressCallback('Buscando campo de archivo...');
      let fileInput = inputContainer.querySelector('input[type="file"]') ||
                     document.querySelector('input[type="file"][accept*="image"]') ||
                     document.querySelector('input[type="file"][accept*="video"]');
      
      // If no file input exists, we need to click the photo button (this will open file dialog)
      // This is unavoidable when Facebook doesn't have a pre-existing file input
      if (!fileInput) {
        console.log('[Pajaritos] ⚠️ No file input found, need to click photo button (this will open file dialog)');
        
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

        // Click the photo button - this WILL open the file dialog
        if (progressCallback) progressCallback('Abriendo selector de archivos...');
        photoButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(200);
        photoButton.click();
        await wait(1000);

        // Now look for the file input that appeared after clicking
        let attempts = 0;
        while (!fileInput && attempts < 10) {
          fileInput = inputContainer.querySelector('input[type="file"]') ||
                     document.querySelector('input[type="file"][accept*="image"]') ||
                     document.querySelector('input[type="file"][accept*="video"]');
          
          if (!fileInput) {
            await wait(300);
            attempts++;
          }
        }
      } else {
        console.log('[Pajaritos] ✅ Found existing file input, skipping photo button click (no dialog will open)');
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
      // Don't log fetch errors as critical (they might be expected in some cases)
      if (error.message?.includes('Failed to fetch')) {
        console.warn('[Pajaritos] ⚠️ Fetch error (this may be expected for some image sources)');
      }
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
    
    // STRICT: Check if it's inside a comment structure - reject it
    const inCommentStructure = element.closest('[data-testid*="comment"]') !== null;
    if (inCommentStructure) {
      // But allow if it has main post input (the main post itself might be in a comment structure on permalink pages)
      const hasMainInput = element.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null;
      if (!hasMainInput) {
        return false; // It's a comment, not the main post
      }
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
    // IMPORTANT: "Responder como..." can be main post input OR comment reply input
    // We need to check if it's NOT nested in a comment reply structure
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
    
    // Also check for "Responder como..." but only if it's NOT in a comment reply structure
    if (!hasMainPostInput) {
      const responderInputs = element.querySelectorAll('div[contenteditable="true"][aria-label*="Responder como"], div[contenteditable="true"][aria-placeholder*="Responder como"]');
      for (const input of responderInputs) {
        // Check if it's in a comment reply structure
        const isInReply = input.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== input &&
                         input.closest('div[data-testid*="comment_replies"]') !== null;
        // Check if it's nested inside another article (likely a comment)
        const parentArticle = input.closest('div[role="article"]');
        const isNestedInComment = parentArticle && 
                                 Array.from(element.querySelectorAll('div[role="article"]')).some(article => 
                                   article !== parentArticle && article.contains(parentArticle)
                                 );
        
        // If it's NOT in a reply structure and NOT nested in a comment, it's the main post input
        if (!isInReply && !isNestedInComment) {
          hasMainPostInput = true;
          break;
        }
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

  // Helper function to extract post metadata for logging
  function getPostMetadata(postElement) {
    const metadata = {
      textPreview: '',
      author: '',
      isVisible: false,
      inModal: false,
      hasMainInput: false,
      hasVideo: false,
      boundingRect: null
    };
    
    try {
      // Get text preview (first 150 characters)
      const allText = postElement.textContent || '';
      metadata.textPreview = allText.substring(0, 150).replace(/\s+/g, ' ').trim();
      
      // Try to find author name
      const authorSelectors = [
        'a[role="link"][href*="/user/"]',
        'a[role="link"][href*="/profile.php"]',
        'span[dir="auto"] a[role="link"]',
        'h3 a[role="link"]',
        '[data-testid*="post_author"]',
        'strong a[role="link"]'
      ];
      
      for (const selector of authorSelectors) {
        const authorElement = postElement.querySelector(selector);
        if (authorElement) {
          metadata.author = authorElement.textContent?.trim() || '';
          if (metadata.author) break;
        }
      }
      
      // Check visibility
      const rect = postElement.getBoundingClientRect();
      metadata.boundingRect = {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
      metadata.isVisible = rect.width > 0 && rect.height > 0 && 
                          window.getComputedStyle(postElement).display !== 'none' &&
                          window.getComputedStyle(postElement).visibility !== 'hidden';
      
      // Check if in modal
      metadata.inModal = postElement.closest('[role="dialog"]') !== null ||
                        postElement.closest('[aria-modal="true"]') !== null ||
                        postElement.closest('[data-testid*="modal"]') !== null;
      
      // Check for main input
      metadata.hasMainInput = postElement.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                             postElement.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') !== null;
      
      // Check for video
      metadata.hasVideo = postElement.querySelector('video') !== null;
    } catch (error) {
      console.error('[Pajaritos] Error extracting post metadata:', error);
    }
    
    return metadata;
  }
  
  // Helper function to log post metadata
  function logPostMetadata(postElement, label = 'Post') {
    const meta = getPostMetadata(postElement);
    console.log(`[Pajaritos] 📋 ${label} metadata:`, {
      author: meta.author || '(no author found)',
      textPreview: meta.textPreview || '(no text)',
      isVisible: meta.isVisible,
      inModal: meta.inModal,
      hasMainInput: meta.hasMainInput,
      hasVideo: meta.hasVideo,
      position: `(${meta.boundingRect?.left}, ${meta.boundingRect?.top})`,
      size: `${meta.boundingRect?.width}x${meta.boundingRect?.height}`
    });
  }

  // Track retry attempts for permalink pages
  let permalinkRetryCount = 0;
  const MAX_PERMALINK_RETRIES = 3;
  let permalinkRetryTimer = null;
  let isAddingButtons = false; // Guard to prevent concurrent execution

  // Add buttons to all posts
  function addButtonsToPosts() {
    // Prevent concurrent execution
    if (isAddingButtons) {
      console.log('[Pajaritos] ⏸️ addButtonsToPosts already running, skipping...');
      return;
    }
    
    isAddingButtons = true;
    try {
    // Check if we're on a permalink page (single post view)
    const isPermalinkPage = window.location.href.includes('/permalink/') || 
                           window.location.href.includes('/posts/');
    
    let posts = [];
    let mainCommentInput = null; // Declare at function scope so it's accessible throughout
    
    // FIRST: Check if there's a modal/dialog open - if so, ONLY search within it
    const openModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])') ||
                     document.querySelector('[data-testid*="modal"]:not([aria-hidden="true"])') ||
                     document.querySelector('[aria-modal="true"]:not([aria-hidden="true"])') ||
                     document.querySelector('div[aria-label*="Publicación"]:not([aria-hidden="true"])');
    
    let searchScope = document;
    if (openModal) {
      console.log('[Pajaritos] 🎯 MODAL DETECTED - Only searching within modal, ignoring background posts');
      const modalRect = openModal.getBoundingClientRect();
      console.log('[Pajaritos] 📋 Modal details:', {
        tagName: openModal.tagName,
        ariaLabel: openModal.getAttribute('aria-label')?.substring(0, 50),
        position: `(${Math.round(modalRect.left)}, ${Math.round(modalRect.top)})`,
        size: `${Math.round(modalRect.width)}x${Math.round(modalRect.height)}`
      });
      searchScope = openModal;
    } else {
      console.log('[Pajaritos] ℹ️ No modal detected, searching entire page');
    }
    
    // On permalink pages OR when a modal is detected, use a more targeted approach
    // (Modals often contain single posts, similar to permalink pages)
    if (isPermalinkPage || openModal) {
      console.log('[Pajaritos] 🔍 Permalink page - using targeted detection...');
      
      // First, try to find the main post by looking for the main comment input
      // BUT: Only search within the modal if one exists
      // Try multiple selectors - Facebook uses different labels in modals vs feed
      
      // DEBUG: Log ALL contenteditable divs in the modal to understand the structure
      // Also check the entire document if modal search finds nothing
      if (openModal) {
        console.log('[Pajaritos] 🔍 DEBUG: Searching for ALL contenteditable divs in modal...');
        let allContentEditables = searchScope.querySelectorAll('div[contenteditable="true"]');
        console.log('[Pajaritos] 🔍 DEBUG: Found', allContentEditables.length, 'contenteditable div(s) in modal');
        
        // If nothing found in modal, also check entire document (maybe modal detection is wrong)
        if (allContentEditables.length === 0) {
          console.log('[Pajaritos] ⚠️ DEBUG: No contenteditable divs in modal, checking entire document...');
          allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
          console.log('[Pajaritos] 🔍 DEBUG: Found', allContentEditables.length, 'contenteditable div(s) in entire document');
          
          // If we find them in document but not in modal, maybe we need to expand searchScope
          if (allContentEditables.length > 0) {
            console.log('[Pajaritos] ⚠️ DEBUG: Contenteditable divs found in document but not in modal - expanding search scope');
            // Try to find which modal/dialog contains these inputs
            for (const input of allContentEditables) {
              const inputModal = input.closest('[role="dialog"]') ||
                               input.closest('[data-testid*="modal"]') ||
                               input.closest('[aria-modal="true"]');
              if (inputModal && inputModal !== openModal) {
                console.log('[Pajaritos] 🔍 DEBUG: Found different modal containing input, updating searchScope');
                searchScope = inputModal;
                break;
              }
            }
          }
        }
        
        allContentEditables.forEach((input, idx) => {
          const ariaLabel = input.getAttribute('aria-label') || '';
          const ariaPlaceholder = input.getAttribute('aria-placeholder') || '';
          const placeholder = input.getAttribute('placeholder') || '';
          const dataTestId = input.getAttribute('data-testid') || '';
          const role = input.getAttribute('role') || '';
          const className = input.className?.substring(0, 100) || '';
          
          // Check if it's in a reply structure
          const inReply = input.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== null;
          const inCommentReplies = input.closest('div[data-testid*="comment_replies"]') !== null;
          
          // Get parent info
          const parent = input.parentElement;
          const parentTag = parent?.tagName || '';
          const parentRole = parent?.getAttribute('role') || '';
          const parentClass = parent?.className?.substring(0, 50) || '';
          
          // Get position info
          const rect = input.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          
          console.log(`[Pajaritos] 🔍 DEBUG: Input ${idx + 1}:`, {
            ariaLabel: ariaLabel.substring(0, 50) || '(empty)',
            ariaPlaceholder: ariaPlaceholder.substring(0, 50) || '(empty)',
            placeholder: placeholder.substring(0, 50) || '(empty)',
            dataTestId: dataTestId || '(empty)',
            role: role || '(empty)',
            className: className || '(empty)',
            inReply: inReply,
            inCommentReplies: inCommentReplies,
            isVisible: isVisible,
            position: `(${Math.round(rect.left)}, ${Math.round(rect.top)})`,
            parent: `${parentTag}.${parentRole}`,
            parentClass: parentClass || '(empty)'
          });
        });
      }
      
      // Try to find comment input - first in searchScope, then in entire document if needed
      mainCommentInput = searchScope.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') ||
                         searchScope.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') ||
                         searchScope.querySelector('div[contenteditable="true"][aria-label*="public comment"]') ||
                         searchScope.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') ||
                         searchScope.querySelector('div[contenteditable="true"][aria-label*="Write a response"]') ||
                         searchScope.querySelector('div[contenteditable="true"][aria-label*="Escribe un comentario"]') ||
                         searchScope.querySelector('div[contenteditable="true"][aria-label*="Write a comment"]') ||
                         searchScope.querySelector('div[contenteditable="true"][placeholder*="Escribe"]') ||
                         searchScope.querySelector('div[contenteditable="true"][data-testid*="comment"]');
      
      // If not found in searchScope and we have a modal, try entire document
      if (!mainCommentInput && openModal) {
        console.log('[Pajaritos] 🔍 DEBUG: Input not found in modal scope, trying entire document...');
        mainCommentInput = document.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') ||
                          document.querySelector('div[contenteditable="true"][aria-label*="Escribe un comentario"]') ||
                          document.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') ||
                          document.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') ||
                          // Check for "Responder como..." but only if it's NOT in a comment reply structure
                          (() => {
                            const responderInputs = document.querySelectorAll('div[contenteditable="true"][aria-label*="Responder como"], div[contenteditable="true"][aria-placeholder*="Responder como"]');
                            for (const input of responderInputs) {
                              const isInReply = input.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== input &&
                                               input.closest('div[data-testid*="comment_replies"]') !== null;
                              const parentArticle = input.closest('div[role="article"]');
                              const isNestedInComment = parentArticle && 
                                                       Array.from(document.querySelectorAll('div[role="article"]')).some(article => 
                                                         article !== parentArticle && article.contains(parentArticle)
                                                       );
                              if (!isInReply && !isNestedInComment) {
                                console.log('[Pajaritos] ✅ Found "Responder como..." input that is NOT in a comment reply structure - treating as main post input');
                                return input;
                              }
                            }
                            return null;
                          })();
      }
      
      // Last resort: any contenteditable div that's likely a comment input (not in a comment reply)
      if (!mainCommentInput) {
        const searchArea = openModal ? document : searchScope; // Search entire document if modal detected
        const allInputs = searchArea.querySelectorAll('div[contenteditable="true"]');
        console.log('[Pajaritos] 🔍 DEBUG: Fallback search - checking', allInputs.length, 'contenteditable div(s)');
        for (const input of allInputs) {
          // Check if it's in a comment reply structure (nested inside another comment)
          const isInReply = input.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== input &&
                           input.closest('div[data-testid*="comment_replies"]') !== null;
          // Check if it's nested inside another article (likely a comment)
          const parentArticle = input.closest('div[role="article"]');
          const isNestedInComment = parentArticle && 
                                   Array.from(searchArea.querySelectorAll('div[role="article"]')).some(article => 
                                     article !== parentArticle && article.contains(parentArticle)
                                   );
          
          // Skip if it's in a reply structure
          if (isInReply || isNestedInComment) continue;
          
          // If it's in the modal and not in a reply, it's likely the main input
          const placeholder = input.getAttribute('aria-label') || input.getAttribute('aria-placeholder') || input.getAttribute('placeholder') || '';
          // "Responder como..." can be main post input if it's NOT in a comment reply structure
          if (placeholder.toLowerCase().includes('escribe') || 
              placeholder.toLowerCase().includes('write') || 
              placeholder.toLowerCase().includes('responder como')) {
            mainCommentInput = input;
            console.log('[Pajaritos] ✅ Found input via fallback search:', placeholder.substring(0, 50));
            break;
          }
        }
      }
      
      console.log('[Pajaritos] 🔍 Main comment input found:', mainCommentInput ? 'YES' : 'NO', openModal ? '(in modal)' : '');
      if (mainCommentInput) {
        const inputLabel = mainCommentInput.getAttribute('aria-label') || mainCommentInput.getAttribute('aria-placeholder') || mainCommentInput.getAttribute('placeholder') || 'no label';
        console.log('[Pajaritos] 🔍 Comment input label:', inputLabel.substring(0, 50));
      } else if (openModal) {
        console.log('[Pajaritos] ⚠️ DEBUG: Comment input NOT found with standard selectors. Check the DEBUG logs above to see all contenteditable divs.');
      }
      
      if (mainCommentInput) {
        // Find the post container that contains this input - try multiple levels up
        let mainPost = mainCommentInput.closest('div[role="article"]');
        
        if (!mainPost) {
          mainPost = mainCommentInput.closest('div[data-ad-preview="message"]');
        }
        if (!mainPost) {
          mainPost = mainCommentInput.closest('div[data-ad-comet-preview="message"]');
        }
        if (!mainPost) {
          mainPost = mainCommentInput.closest('div[data-pagelet*="FeedUnit"]');
        }
        if (!mainPost) {
          // Try going up multiple levels
          let parent = mainCommentInput.parentElement;
          let levels = 0;
          while (parent && levels < 10) {
            if (parent.getAttribute('role') === 'article' || 
                parent.getAttribute('data-ad-preview') === 'message' ||
                parent.getAttribute('data-ad-comet-preview') === 'message' ||
                parent.getAttribute('data-pagelet')?.includes('FeedUnit')) {
              mainPost = parent;
              break;
            }
            parent = parent.parentElement;
            levels++;
          }
        }
        
        if (mainPost) {
          console.log('[Pajaritos] 🔍 Found post container via comment input:', mainPost.tagName, mainPost.className?.substring(0, 50));
          logPostMetadata(mainPost, 'Post found via comment input');
          if (isMainPost(mainPost)) {
            console.log('[Pajaritos] ✅ Found main post via comment input');
            posts = [mainPost];
          } else {
            console.log('[Pajaritos] ⚠️ Post container found but isMainPost() returned false');
          }
        } else {
          console.log('[Pajaritos] ⚠️ Could not find post container for comment input');
          
          // NEW APPROACH: Add button directly near the comment input
          // Only if this is the main post input (not a comment reply input)
          const inputLabel = mainCommentInput.getAttribute('aria-label') || 
                            mainCommentInput.getAttribute('aria-placeholder') || 
                            mainCommentInput.getAttribute('placeholder') || '';
          // "Responder como..." can be main post input if it's NOT in a comment reply structure
          const isReplyInput = mainCommentInput.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== mainCommentInput &&
                              mainCommentInput.closest('div[data-testid*="comment_replies"]') !== null;
          const isMainInput = !isReplyInput && (
                             inputLabel.toLowerCase().includes('escribe una respuesta') ||
                             inputLabel.toLowerCase().includes('escribe un comentario') ||
                             inputLabel.toLowerCase().includes('comentario público') ||
                             inputLabel.toLowerCase().includes('public comment') ||
                             inputLabel.toLowerCase().includes('write a response') ||
                             inputLabel.toLowerCase().includes('responder como'));
          
          if (isMainInput) {
            console.log('[Pajaritos] 🎯 Trying new approach: Adding button near main comment input...');
            const buttonAdded = addButtonNearCommentInput(mainCommentInput);
            if (buttonAdded) {
              console.log('[Pajaritos] ✅ Button added near comment input successfully!');
              return; // Exit early - we've added the button
            }
          } else {
            console.log('[Pajaritos] ⚠️ Comment input is not the main post input, skipping button addition');
          }
          
          // Try to find the modal/dialog container and search within it
          let modalContainer = mainCommentInput.closest('[role="dialog"]') ||
                              mainCommentInput.closest('[data-testid*="modal"]') ||
                              mainCommentInput.closest('[data-testid*="Dialog"]') ||
                              mainCommentInput.closest('div[aria-modal="true"]') ||
                              mainCommentInput.closest('div[aria-label*="Publicación"]') ||
                              mainCommentInput.closest('div[aria-label*="Post"]');
          
          if (modalContainer) {
            console.log('[Pajaritos] 🔍 Found modal container, searching within it...');
            
            // Look for article elements within the modal
            const articlesInModal = Array.from(modalContainer.querySelectorAll('div[role="article"]'));
            console.log('[Pajaritos] 🔍 Found', articlesInModal.length, 'article(s) in modal');
            
            // FIRST: Find the article that contains the comment input
            let articleWithInput = null;
            for (const article of articlesInModal) {
              if (article.contains(mainCommentInput)) {
                articleWithInput = article;
                console.log('[Pajaritos] ✅ Found article containing comment input in modal');
                logPostMetadata(article, 'Article in modal (contains input)');
                break;
              }
            }
            
            // If we found an article with the input, use it (even if isMainPost returns false, it's still the right one)
            if (articleWithInput) {
              // Check if it's a main post, but even if not, it's the one with the input so use it
              if (isMainPost(articleWithInput)) {
                console.log('[Pajaritos] ✅ Using article with input (isMainPost=true)');
                posts = [articleWithInput];
              } else {
                // Still use it, but log a warning
                console.log('[Pajaritos] ⚠️ Article with input failed isMainPost check, but using it anyway (it contains the input)');
                posts = [articleWithInput];
              }
            } else {
              // The input is NOT inside any article - it's probably a sibling or in a different structure
              // Find the article that's closest to the input (same parent or nearby)
              console.log('[Pajaritos] ⚠️ Comment input is not inside any article, finding closest article...');
              
              // Strategy 1: Find article that appears BEFORE the input in the DOM
              // Main posts usually come before their comment sections
              console.log('[Pajaritos] 🔍 Strategy 1: Looking for article before input in DOM...');
              let element = mainCommentInput;
              let articleBefore = null;
              let searchDepth = 0;
              
              while (element && searchDepth < 20 && !articleBefore) {
                // Check previous siblings
                let sibling = element.previousElementSibling;
                while (sibling && !articleBefore) {
                  // Check if sibling is an article
                  if (sibling.getAttribute('role') === 'article' && articlesInModal.includes(sibling)) {
                    articleBefore = sibling;
                    console.log('[Pajaritos] ✅ Found article as previous sibling');
                    break;
                  }
                  // Check if sibling contains an article
                  const articleInSibling = sibling.querySelector('div[role="article"]');
                  if (articleInSibling && articlesInModal.includes(articleInSibling)) {
                    articleBefore = articleInSibling;
                    console.log('[Pajaritos] ✅ Found article in previous sibling');
                    break;
                  }
                  sibling = sibling.previousElementSibling;
                }
                
                // Check parent's previous siblings
                if (!articleBefore && element.parentElement) {
                  let parentSibling = element.parentElement.previousElementSibling;
                  while (parentSibling && !articleBefore) {
                    if (parentSibling.getAttribute('role') === 'article' && articlesInModal.includes(parentSibling)) {
                      articleBefore = parentSibling;
                      console.log('[Pajaritos] ✅ Found article as parent\'s previous sibling');
                      break;
                    }
                    const articleInParentSibling = parentSibling.querySelector('div[role="article"]');
                    if (articleInParentSibling && articlesInModal.includes(articleInParentSibling)) {
                      articleBefore = articleInParentSibling;
                      console.log('[Pajaritos] ✅ Found article in parent\'s previous sibling');
                      break;
                    }
                    parentSibling = parentSibling.previousElementSibling;
                  }
                }
                
                element = element.parentElement;
                searchDepth++;
              }
              
              if (articleBefore) {
                logPostMetadata(articleBefore, 'Article before input');
                // Filter out if it's clearly a comment
                const hasReplyButtons = articleBefore.querySelectorAll('[aria-label*="Responder"], [aria-label*="Reply"]').length;
                const hasMainInput = articleBefore.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                                    articleBefore.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') !== null;
                const isLikelyComment = hasReplyButtons > 0 && !hasMainInput;
                
                if (!isLikelyComment) {
                  console.log('[Pajaritos] ✅ Using article before input (not a comment)');
                  posts = [articleBefore];
                } else {
                  console.log('[Pajaritos] ⚠️ Article before input appears to be a comment, trying other strategies...');
                  articleBefore = null; // Reset to try other strategies
                }
              }
              
              // Strategy 2: Find article that shares a common parent with the input
              if (!articleBefore) {
                console.log('[Pajaritos] 🔍 Strategy 2: Looking for article sharing parent with input...');
                let inputParent = mainCommentInput.parentElement;
                let levelsUp = 0;
                
                while (inputParent && levelsUp < 15 && !articleBefore) {
                  // Look for articles that are siblings or children of this parent
                  const nearbyArticles = Array.from(inputParent.querySelectorAll('div[role="article"]'));
                  if (nearbyArticles.length > 0) {
                    // Filter to only articles that are likely the main post (not comments)
                    for (const article of nearbyArticles) {
                      if (!articlesInModal.includes(article)) continue;
                      
                      // Check if it's likely a main post (not a comment)
                      const hasReplyButtons = article.querySelectorAll('[aria-label*="Responder"], [aria-label*="Reply"]').length;
                      const hasMainInput = article.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                                          article.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') !== null;
                      const isLikelyComment = hasReplyButtons > 0 && !hasMainInput;
                      
                      // Also check if it's nested (comments are often nested)
                      const parentArticle = article.closest('div[role="article"]');
                      const isNested = parentArticle && parentArticle !== article;
                      
                      if (!isLikelyComment && !isNested) {
                        articleBefore = article;
                        console.log('[Pajaritos] ✅ Found nearby article (likely main post)');
                        logPostMetadata(article, 'Nearby article (likely main post)');
                        break;
                      }
                    }
                  }
                  
                  inputParent = inputParent.parentElement;
                  levelsUp++;
                }
                
                if (articleBefore) {
                  posts = [articleBefore];
                }
              }
              
              // Strategy 3: Filter all articles and use the first non-comment one
              if (!articleBefore) {
                console.log('[Pajaritos] 🔍 Strategy 3: Filtering all articles to find main post...');
                console.log('[Pajaritos] 🔍 DEBUG: Analyzing', articlesInModal.length, 'articles...');
                
                const articleAnalysis = articlesInModal.map((article, idx) => {
                  const hasReplyButtons = article.querySelectorAll('[aria-label*="Responder"], [aria-label*="Reply"]').length;
                  const hasMainInput = article.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                                      article.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') !== null;
                  const isLikelyComment = hasReplyButtons > 0 && !hasMainInput;
                  
                  // Check if nested (comments are often nested inside main posts)
                  const parentArticle = article.closest('div[role="article"]');
                  const isNested = parentArticle && parentArticle !== article;
                  
                  // Check if it has video/image (main posts often have media)
                  const hasVideo = article.querySelector('video') !== null;
                  const hasImage = article.querySelector('img[src*="scontent"]') !== null; // Facebook image
                  
                  // Check if it's near the comment input (main post should be near the input)
                  const rect = article.getBoundingClientRect();
                  const inputRect = mainCommentInput.getBoundingClientRect();
                  const distance = Math.abs(rect.top - inputRect.top);
                  
                  // Check text content length (main posts are usually longer)
                  const textLength = article.textContent?.length || 0;
                  
                  const analysis = {
                    index: idx + 1,
                    hasReplyButtons,
                    hasMainInput,
                    isLikelyComment,
                    isNested,
                    hasVideo,
                    hasImage,
                    distanceFromInput: Math.round(distance),
                    textLength,
                    isCandidate: !isLikelyComment && !isNested
                  };
                  
                  console.log(`[Pajaritos] 🔍 DEBUG: Article ${idx + 1}:`, analysis);
                  logPostMetadata(article, `Article ${idx + 1} analysis`);
                  
                  return { article, analysis };
                });
                
                // Filter candidates
                const mainPostCandidates = articleAnalysis
                  .filter(({ analysis }) => analysis.isCandidate)
                  .sort((a, b) => {
                    // Prioritize: has media, closer to input, longer text
                    if (a.analysis.hasVideo !== b.analysis.hasVideo) return b.analysis.hasVideo - a.analysis.hasVideo;
                    if (a.analysis.hasImage !== b.analysis.hasImage) return b.analysis.hasImage - a.analysis.hasImage;
                    if (Math.abs(a.analysis.distanceFromInput - b.analysis.distanceFromInput) > 100) {
                      return a.analysis.distanceFromInput - b.analysis.distanceFromInput;
                    }
                    return b.analysis.textLength - a.analysis.textLength;
                  });
                
                console.log('[Pajaritos] 🔍 DEBUG: Found', mainPostCandidates.length, 'candidate(s) after filtering');
                
                if (mainPostCandidates.length > 0) {
                  const firstCandidate = mainPostCandidates[0].article;
                  console.log('[Pajaritos] ✅ Using best candidate article (Strategy 3)');
                  logPostMetadata(firstCandidate, 'Best candidate article');
                  posts = [firstCandidate];
                } else {
                  // Last resort: use the article closest to the input
                  console.log('[Pajaritos] ⚠️ No candidates found, using article closest to input...');
                  const closestByDistance = articleAnalysis
                    .sort((a, b) => a.analysis.distanceFromInput - b.analysis.distanceFromInput);
                  
                  if (closestByDistance.length > 0) {
                    const closest = closestByDistance[0].article;
                    console.log('[Pajaritos] ⚠️ Using closest article to input (last resort)');
                    logPostMetadata(closest, 'Closest article (last resort)');
                    posts = [closest];
                  }
                }
              }
            }
          }
        }
      }
      
      // If we didn't find it via comment input, try finding posts with video (common for main posts)
      // BUT prioritize posts that are visible and within any modal/dialog
      if (posts.length === 0) {
        console.log('[Pajaritos] 🔍 Trying to find post with video or main input...', openModal ? '(searching in modal)' : '(searching entire page)');
        
        // Use the searchScope we determined at the start (modal if exists, otherwise document)
        const allPosts = searchScope.querySelectorAll('div[role="article"], div[data-ad-preview="message"], div[data-ad-comet-preview="message"]');
        
        // If we found the comment input earlier, prioritize posts that contain it
        let postsWithInput = [];
        if (mainCommentInput) {
          postsWithInput = Array.from(allPosts).filter(post => post.contains(mainCommentInput));
          if (postsWithInput.length > 0) {
            console.log('[Pajaritos] ✅ Found', postsWithInput.length, 'post(s) containing the comment input');
            postsWithInput.forEach((post, idx) => {
              logPostMetadata(post, `Post ${idx + 1} (contains input)`);
            });
            // Use these posts directly - they contain the input we found
            posts = postsWithInput;
          }
        }
        
        // If we didn't find posts with the input, try the video/main input filter
        if (posts.length === 0) {
          const postsWithVideo = Array.from(allPosts).filter(post => {
            if (!isMainPost(post)) return false;
            
            // Check if post is visible (not hidden)
            const rect = post.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             window.getComputedStyle(post).display !== 'none' &&
                             window.getComputedStyle(post).visibility !== 'hidden';
            
            if (!isVisible) return false;
            
            // Check if it has the main comment input (most reliable indicator)
            const hasMainInput = post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                                post.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') !== null ||
                                post.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') !== null;
            
            // Also check for video (common for photo/video posts)
            const hasVideo = post.querySelector('video') !== null;
            
            return hasMainInput || hasVideo;
          });
          
          if (postsWithVideo.length > 0) {
            console.log(`[Pajaritos] ✅ Found ${postsWithVideo.length} post(s) with video or main input${openModal ? ' (in modal)' : ''}`);
            postsWithVideo.forEach((post, idx) => {
              logPostMetadata(post, `Post ${idx + 1} (with video/input)`);
            });
            posts = postsWithVideo;
          }
        }
      }
      
      // If still not found, try finding by URL structure
      if (posts.length === 0) {
        const permalinkId = window.location.href.match(/\/permalink\/(\d+)/)?.[1] || 
                           window.location.href.match(/\/posts\/(\d+)/)?.[1];
        
        if (permalinkId) {
          console.log(`[Pajaritos] 🔍 Trying to find post by permalink ID: ${permalinkId}`);
          // Look for elements that might contain the post ID
          const postSelectors = [
            `div[data-pagelet*="${permalinkId}"]`,
            `div[data-testid*="${permalinkId}"]`,
            'div[data-ad-preview="message"]',
            'div[data-ad-comet-preview="message"]'
          ];
          
          for (const selector of postSelectors) {
            const found = searchScope.querySelectorAll(selector);
            const filtered = Array.from(found).filter(post => {
              if (!isMainPost(post)) return false;
              // Check if it has video or is likely the main post
              const hasVideo = post.querySelector('video') !== null;
              const hasMainInput = post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null;
              return hasVideo || hasMainInput;
            });
            
            if (filtered.length > 0) {
              console.log(`[Pajaritos] ✅ Found ${filtered.length} post(s) via selector: ${selector}`);
              posts = filtered;
              break;
            }
          }
        }
      }
    }
    
    // Fallback to standard detection if permalink detection didn't work
    // BUT: Only search within modal if one exists
    if (posts.length === 0) {
      console.log('[Pajaritos] 🔍 Fallback: Using standard detection...', openModal ? '(in modal)' : '(entire page)');
      const postSelectors = [
        'div[data-ad-preview="message"]',  // Try this first - most reliable for group posts
        'div[data-ad-comet-preview="message"]',
        'div[data-pagelet*="FeedUnit"]',
        'div[role="article"]',
        'div[data-testid*="post"]'
      ];

      for (const selector of postSelectors) {
        const found = searchScope.querySelectorAll(selector);
        if (found.length > 0) {
          // Filter to only main posts, not comments
          // In modals, we need to be more aggressive about filtering comments
          const filtered = Array.from(found).filter(post => {
            // First check isMainPost
            if (!isMainPost(post)) return false;
            
            // In modals, filter out comments more aggressively
            if (openModal) {
              // Comments have "Responder" buttons but no main input
              const hasReplyButtons = post.querySelectorAll('[aria-label*="Responder"], [aria-label*="Reply"]').length;
              const hasMainInput = post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                                  post.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') !== null ||
                                  post.querySelector('div[contenteditable="true"][aria-label*="Escribe un comentario"]') !== null;
              
              // If it has reply buttons but no main input, it's a comment
              if (hasReplyButtons > 0 && !hasMainInput) {
                return false;
              }
              
              // Check if it's nested inside another article (likely a comment)
              const parentArticle = post.closest('div[role="article"]');
              if (parentArticle && parentArticle !== post) {
                return false;
              }
            }
            
            return true;
          });
          
          if (filtered.length > 0) {
            console.log(`[Pajaritos] ✅ Found ${filtered.length} post(s) via fallback selector: ${selector}`);
            // Log metadata for each found post
            filtered.forEach((post, idx) => {
              logPostMetadata(post, `Fallback post ${idx + 1}`);
            });
            posts = filtered;
            break;
          }
        }
      }
    }

    if (posts.length === 0) {
      // Try a more general approach - look for posts by finding main comment buttons
      // BUT: On permalink pages, prioritize finding the main post via comment input
      // AND: Only search within modal if one exists
      if (isPermalinkPage) {
        console.log('[Pajaritos] 🔍 Permalink: Looking for main post via comment input...', openModal ? '(in modal)' : '');
        const mainCommentInput = searchScope.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') ||
                                 searchScope.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') ||
                                 searchScope.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]');
        
        if (mainCommentInput) {
          // Go up the DOM tree to find the post
          let post = mainCommentInput.closest('div[role="article"]');
          if (!post) {
            let parent = mainCommentInput.parentElement;
            let levels = 0;
            while (parent && levels < 15) {
              if (parent.getAttribute('role') === 'article' || 
                  parent.getAttribute('data-ad-preview') === 'message' ||
                  parent.getAttribute('data-ad-comet-preview') === 'message') {
                post = parent;
                break;
              }
              parent = parent.parentElement;
              levels++;
            }
          }
          
          if (post && isMainPost(post)) {
            console.log('[Pajaritos] ✅ Found main post via comment input (fallback method)');
            posts = [post];
          }
        }
      }
      
      // If still not found, try finding by comment buttons (but be very strict)
      if (posts.length === 0) {
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
            return; // Skip comment reply buttons
          }
          
          // Check if button is near a main post comment input (not a reply input)
          const nearbyInput = btn.closest('div[role="article"]')?.querySelector('div[contenteditable="true"][aria-label*="comentario público"]');
          if (!nearbyInput) {
            return; // Skip if no main post input nearby
          }
          
          // Find the post container (go up the DOM tree)
          let post = btn.closest('div[role="article"]') || 
                     btn.closest('div[data-pagelet*="FeedUnit"]') ||
                     btn.closest('div[data-testid*="post"]') ||
                     btn.closest('div[data-ad-preview="message"]') ||
                     btn.closest('div[data-ad-comet-preview="message"]');
          
          // Make sure it's a main post and has the main comment input
          if (post && isMainPost(post) && post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') && !post.querySelector('.pajaritos-reply-btn')) {
            posts.push(post);
          }
        });
      }
    }
    
    if (posts.length === 0) {
      console.log('[Pajaritos] ⚠️ No posts detected on page');
      
      // LAST RESORT: If we have a modal but couldn't find posts, try to find comment input in entire document
      // This handles cases where modal structure is different (e.g., group page modals)
      if (openModal) {
        console.log('[Pajaritos] 🔍 Last resort: Searching entire document for comment input (modal detected but no posts found)...');
        
        // Search entire document for comment input (not just modal)
        const fallbackInput = document.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') ||
                             document.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') ||
                             document.querySelector('div[contenteditable="true"][aria-label*="public comment"]') ||
                             document.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') ||
                             document.querySelector('div[contenteditable="true"][aria-label*="Write a response"]') ||
                             document.querySelector('div[contenteditable="true"][aria-label*="Escribe un comentario"]') ||
                             document.querySelector('div[contenteditable="true"][aria-label*="Write a comment"]') ||
                             document.querySelector('div[contenteditable="true"][placeholder*="Escribe un comentario"]') ||
                             document.querySelector('div[contenteditable="true"][placeholder*="Write a comment"]');
        
        if (fallbackInput && fallbackInput.offsetParent !== null) {
          const inputLabel = fallbackInput.getAttribute('aria-label') || 
                            fallbackInput.getAttribute('aria-placeholder') || 
                            fallbackInput.getAttribute('placeholder') || '';
          
          // "Responder como..." can be main post input if it's NOT in a comment reply structure
          const isReplyInput = fallbackInput.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== fallbackInput &&
                              fallbackInput.closest('div[data-testid*="comment_replies"]') !== null;
          const isMainInput = !isReplyInput && (
                             inputLabel.toLowerCase().includes('escribe una respuesta') ||
                             inputLabel.toLowerCase().includes('escribe un comentario') ||
                             inputLabel.toLowerCase().includes('comentario público') ||
                             inputLabel.toLowerCase().includes('public comment') ||
                             inputLabel.toLowerCase().includes('write a response') ||
                             inputLabel.toLowerCase().includes('write a comment') ||
                             inputLabel.toLowerCase().includes('responder como'));
          
          if (isMainInput) {
            console.log('[Pajaritos] ✅ Found comment input in document (last resort), label:', inputLabel.substring(0, 50));
            console.log('[Pajaritos] 🎯 Using addButtonNearCommentInput approach...');
            const buttonAdded = addButtonNearCommentInput(fallbackInput);
            if (buttonAdded) {
              console.log('[Pajaritos] ✅ Button added near comment input (last resort method)!');
              return; // Exit early - we've added the button
            }
          } else {
            console.log('[Pajaritos] ⚠️ Found input but it\'s not the main post input, label:', inputLabel.substring(0, 50));
          }
        } else {
          console.log('[Pajaritos] ⚠️ No visible comment input found in entire document either');
        }
      }
      
      // If we still haven't found anything, return
      return;
    }
    
    console.log(`[Pajaritos] 📊 Found ${posts.length} post(s) on page`);
    
    // Filter out suggested posts, sponsored posts, and other non-main content
    // Prioritize posts that are likely the main focus
    let mainPosts = posts.filter(post => {
      // Check if it's a suggested post or ad
      const isSuggested = post.querySelector('[data-testid*="suggested"]') !== null ||
                          post.querySelector('[aria-label*="sugerencia"]') !== null ||
                          post.querySelector('[aria-label*="suggested"]') !== null ||
                          post.textContent?.includes('Sugerencia') ||
                          post.textContent?.includes('Suggested');
      
      // Check if it's a sponsored post
      const isSponsored = post.querySelector('[data-testid*="sponsored"]') !== null ||
                          post.textContent?.includes('Patrocinado') ||
                          post.textContent?.includes('Sponsored');
      
      // Check if it's in the main feed area (not sidebar)
      const isInSidebar = post.closest('[role="complementary"]') !== null ||
                          post.closest('[data-pagelet*="RightRail"]') !== null;
      
      // STRICT: Check if it's a comment (has "Responder" button but not main post input)
      const hasReplyButton = post.querySelector('[aria-label*="Responder"]') !== null ||
                            post.querySelector('[aria-label*="Reply"]') !== null ||
                            post.textContent?.includes('Responder') ||
                            post.textContent?.includes('Reply');
      const hasMainPostInput = post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                               post.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') !== null;
      const isComment = hasReplyButton && !hasMainPostInput;
      
      // Check if it's in a comments section (nested in comment structure)
      const inCommentSection = post.closest('[data-testid*="comment"]') !== null &&
                               !post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]');
      
      // On permalink pages, ONLY accept posts with main comment input
      if (isPermalinkPage && !hasMainPostInput) {
        return false; // Reject posts without main input on permalink pages
      }
      
      return !isSuggested && !isSponsored && !isInSidebar && !isComment && !inCommentSection;
    });
    
    // On permalink pages, be very strict - only keep posts with main comment input
    if (isPermalinkPage && mainPosts.length > 1) {
      console.log('[Pajaritos] 🔍 Permalink page detected, applying strict filtering...');
      
      // First, try to find the post that contains the main comment input
      const mainCommentInput = document.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') ||
                               document.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]');
      
      if (mainCommentInput) {
        console.log('[Pajaritos] 🔍 Main comment input found, finding containing post...');
        // Find which post contains this input
        const postWithInput = mainPosts.find(post => post.contains(mainCommentInput));
        if (postWithInput) {
          console.log('[Pajaritos] ✅ Found main post via comment input field');
          mainPosts = [postWithInput];
        } else {
          console.log('[Pajaritos] ⚠️ Comment input not found in any detected post, filtering by input presence...');
          // If not found, filter by having the input
          const postsWithMainInput = mainPosts.filter(post => {
            return post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null ||
                   post.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') !== null;
          });
          
          if (postsWithMainInput.length > 0) {
            console.log(`[Pajaritos] ✅ Found ${postsWithMainInput.length} post(s) with main comment input`);
            mainPosts = postsWithMainInput;
          } else {
            console.log('[Pajaritos] ⚠️ No posts with main comment input found, trying video filter...');
            // If no posts have the input, try filtering by video
            const postsWithVideo = mainPosts.filter(post => post.querySelector('video') !== null);
            if (postsWithVideo.length > 0) {
              console.log(`[Pajaritos] ✅ Filtered to ${postsWithVideo.length} post(s) with video`);
              mainPosts = postsWithVideo;
            }
          }
        }
      } else {
        console.log('[Pajaritos] ⚠️ Main comment input not found on page, trying video filter...');
        // If no main input found, prioritize posts with video
        const postsWithVideo = mainPosts.filter(post => post.querySelector('video') !== null);
        if (postsWithVideo.length > 0) {
          console.log(`[Pajaritos] ✅ Filtered to ${postsWithVideo.length} post(s) with video`);
          mainPosts = postsWithVideo;
        }
      }
    }
    
    // If we still have multiple posts, try to find the one in the main content area
    if (mainPosts.length > 1) {
      const mainContentArea = document.querySelector('[role="main"]') || 
                             document.querySelector('div[data-pagelet*="MainFeed"]') ||
                             document.querySelector('div[data-pagelet*="FeedUnit"]')?.closest('div');
      
      if (mainContentArea) {
        const postsInMainArea = mainPosts.filter(post => mainContentArea.contains(post));
        if (postsInMainArea.length > 0) {
          console.log(`[Pajaritos] ✅ Filtered to ${postsInMainArea.length} post(s) in main content area`);
          mainPosts = postsInMainArea;
        }
      }
    }
    
    // If we filtered out some posts, use the filtered list
    const postsToProcess = mainPosts.length > 0 ? mainPosts : posts;
    
    console.log(`[Pajaritos] 📊 After filtering: ${postsToProcess.length} main post(s)`);
    console.log(`[Pajaritos] 📊 mainPosts.length: ${mainPosts.length}, posts.length: ${posts.length}`);
    if (postsToProcess.length === 0 && posts.length > 0) {
      console.warn('[Pajaritos] ⚠️ All posts were filtered out! This might indicate a filtering issue.');
      console.log('[Pajaritos] 🔍 Debug: Checking why posts were filtered...');
      posts.slice(0, 3).forEach((p, idx) => {
        const hasMainInput = p.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null;
        const isMain = isMainPost(p);
        console.log(`[Pajaritos] 🔍 Post ${idx + 1}: isMainPost=${isMain}, hasMainInput=${hasMainInput}`);
      });
    }
    
    if (postsToProcess.length > 1) {
      console.log('[Pajaritos] 🔍 Debug: Multiple posts detected. Post details:');
      postsToProcess.forEach((post, idx) => {
        const hasMainInput = post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') !== null;
        const hasReplyBtn = post.querySelector('[aria-label*="Responder"]') !== null;
        const textPreview = post.textContent?.substring(0, 50) || 'no text';
        console.log(`  Post ${idx + 1}: hasMainInput=${hasMainInput}, hasReplyBtn=${hasReplyBtn}, preview="${textPreview}..."`);
      });
    }
    
    if (postsToProcess.length === 0) {
      console.warn('[Pajaritos] ⚠️ No posts to process after filtering!');
      return;
    }
    
    // Show button on posts that have the main comment input (the actual main post)
    // On permalink pages, prioritize the post with main comment input
    // On feed pages, show button on all main posts
    postsToProcess.forEach((post, index) => {
      console.log(`[Pajaritos] 🔍 Processing post ${index + 1}/${postsToProcess.length}...`);
      logPostMetadata(post, `Post ${index + 1} (to process)`);
      
      
      // PRIORITY 1: Check for "Responder como..." input FIRST (this is the preferred location)
      // PRIORITY 2: Fallback to "Comentar" button only if input not found
      console.log(`[Pajaritos] 🔍 Post ${index + 1}: Searching for main comment input (PRIORITY 1: "Responder como...")...`);
      const mainInputInPost =
        // Standard main comment input
        post.querySelector('div[contenteditable="true"][aria-label*="comentario público"]') ||
        post.querySelector('div[contenteditable="true"][aria-placeholder*="comentario público"]') ||
        post.querySelector('div[contenteditable="true"][aria-label*="public comment"]') ||
        // Group/feed style: "Escribe un comentario..."
        post.querySelector('div[contenteditable="true"][aria-label*="Escribe un comentario"]') ||
        post.querySelector('div[contenteditable="true"][aria-placeholder*="Escribe un comentario"]') ||
        post.querySelector('div[contenteditable="true"][placeholder*="Escribe un comentario"]') ||
        // Generic English variants
        post.querySelector('div[contenteditable="true"][aria-label*="Write a comment"]') ||
        post.querySelector('div[contenteditable="true"][aria-placeholder*="Write a comment"]') ||
        post.querySelector('div[contenteditable="true"][placeholder*="Write a comment"]') ||
        // Additional variations for different Facebook UI versions
        post.querySelector('div[contenteditable="true"][aria-label*="Escribe una respuesta"]') ||
        post.querySelector('div[contenteditable="true"][aria-label*="Write a response"]') ||
        post.querySelector('div[contenteditable="true"][data-testid*="comment"]') ||
        // IMPORTANT: "Responder como..." can be main post input OR comment reply input
        // We need to check if it's NOT nested in a comment reply structure
        (() => {
          const responderInputs = post.querySelectorAll('div[contenteditable="true"][aria-label*="Responder como"], div[contenteditable="true"][aria-placeholder*="Responder como"]');
          for (const input of responderInputs) {
            // Check if it's in a comment reply structure (nested inside another comment)
            const isInReply = input.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== input &&
                             input.closest('div[data-testid*="comment_replies"]') !== null;
            // Check if it's nested inside another article (likely a comment)
            const parentArticle = input.closest('div[role="article"]');
            const postArticle = post.closest('div[role="article"]') || post;
            const isNestedInComment = parentArticle && parentArticle !== postArticle && 
                                     postArticle.contains(parentArticle);
            
            // If it's NOT in a reply structure and NOT nested in a comment, it's the main post input
            if (!isInReply && !isNestedInComment) {
              console.log(`[Pajaritos] ✅ Post ${index + 1}: Found "Responder como..." input that is NOT in a comment reply structure - treating as main post input`);
              return input;
            }
          }
          return null;
        })() ||
        // Fallback: any contenteditable that's not in a reply structure
        (() => {
          const allInputs = post.querySelectorAll('div[contenteditable="true"]');
          for (const input of allInputs) {
            // Skip if it's in a reply structure
            const isInReply = input.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== input &&
                             input.closest('div[data-testid*="comment_replies"]') !== null;
            if (isInReply) continue;
            
            // Check if it has a placeholder that suggests it's a main comment input
            const label = (input.getAttribute('aria-label') || 
                          input.getAttribute('aria-placeholder') || 
                          input.getAttribute('placeholder') || '').toLowerCase();
            if (label.includes('escribe') || label.includes('write') || label.includes('comentario') || label.includes('comment') || label.includes('responder como')) {
              // Double-check it's not nested in a comment
              const parentArticle = input.closest('div[role="article"]');
              const postArticle = post.closest('div[role="article"]') || post;
              const isNestedInComment = parentArticle && parentArticle !== postArticle && 
                                       postArticle.contains(parentArticle);
              if (!isNestedInComment) {
                return input;
              }
            }
          }
          return null;
        })();
      
      // Check if input is actually visible (not hidden)
      const hasMainInput = mainInputInPost !== null && mainInputInPost.offsetParent !== null;
      console.log(`[Pajaritos] 🔍 Post ${index + 1}: mainInputInPost=${mainInputInPost ? 'FOUND' : 'NOT FOUND'}, hasMainInput=${hasMainInput}`);
      if (mainInputInPost) {
        const inputLabel = mainInputInPost.getAttribute('aria-label') || 
                          mainInputInPost.getAttribute('aria-placeholder') || 
                          mainInputInPost.getAttribute('placeholder') || 'no label';
        const isVisible = mainInputInPost.offsetParent !== null;
        const rect = mainInputInPost.getBoundingClientRect();
        console.log(`[Pajaritos] 📋 Post ${index + 1} input details:`, {
          label: inputLabel.substring(0, 50),
          visible: isVisible,
          position: `(${Math.round(rect.left)}, ${Math.round(rect.top)})`,
          size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
        });
      }
      
      // ALWAYS check for "Comentar" button, even if input is not found
      // This is important because some Facebook UIs don't show the input until "Comentar" is clicked
      console.log(`[Pajaritos] 🔍 Post ${index + 1}: Searching for "Comentar" button...`);
      const commentButton = findCommentButton(post);
      let canOpenInput = false;
      
      if (commentButton) {
        const btnLabel = commentButton.getAttribute('aria-label') || commentButton.textContent?.substring(0, 30) || 'no label';
        const btnRect = commentButton.getBoundingClientRect();
        const isVisible = btnRect.width > 0 && btnRect.height > 0;
        console.log(`[Pajaritos] ✅ Post ${index + 1}: "Comentar" button found:`, {
          label: btnLabel,
          visible: isVisible,
          position: `(${Math.round(btnRect.left)}, ${Math.round(btnRect.top)})`
        });
        canOpenInput = true; // We can click this to open the input
      } else {
        console.log(`[Pajaritos] ⚠️ Post ${index + 1}: "Comentar" button not found`);
        // Log all buttons in post to help debug
        const allButtons = post.querySelectorAll('button, [role="button"]');
        console.log(`[Pajaritos] 🔍 Post ${index + 1}: Found ${allButtons.length} button(s) in post, checking for comment button...`);
        allButtons.forEach((btn, btnIdx) => {
          const btnText = btn.textContent?.toLowerCase() || '';
          const btnAria = btn.getAttribute('aria-label')?.toLowerCase() || '';
          if (btnText.includes('comentar') || btnText.includes('comment') || btnAria.includes('comentar') || btnAria.includes('comment')) {
            console.log(`[Pajaritos] 🔍 Post ${index + 1}: Button ${btnIdx + 1} might be comment button:`, {
              text: btn.textContent?.substring(0, 30),
              ariaLabel: btn.getAttribute('aria-label')?.substring(0, 50),
              className: btn.className?.substring(0, 50)
            });
          }
        });
      }
      
      // If input exists but is not visible, we already have canOpenInput from above
      if (mainInputInPost && mainInputInPost.offsetParent === null && canOpenInput) {
        console.log(`[Pajaritos] ℹ️ Post ${index + 1}: Comment input exists but is hidden, "Comentar" button found - can open it`);
      }
      
      // Also check if the post contains the main comment input we found earlier (if we found one)
      // OR if the comment input is near this post (same parent structure)
      let containsKnownInput = false;
      let isNearKnownInput = false;
      
      if (isPermalinkPage && mainCommentInput) {
        // Check if post contains the input
        if (post.contains(mainCommentInput)) {
          containsKnownInput = true;
          console.log('[Pajaritos] ✅ Post contains the known main comment input');
        } else {
          // Check if input is near the post (same parent or sibling structure)
          // Get the input's position
          const inputRect = mainCommentInput.getBoundingClientRect();
          const postRect = post.getBoundingClientRect();
          
          // Check if they're close vertically (input should be below the post)
          const verticalDistance = inputRect.top - postRect.bottom;
          const horizontalOverlap = !(inputRect.right < postRect.left || inputRect.left > postRect.right);
          
          // If input is within 500px below the post and horizontally aligned, they're related
          if (verticalDistance >= 0 && verticalDistance < 500 && horizontalOverlap) {
            isNearKnownInput = true;
            console.log('[Pajaritos] ✅ Post is near the known comment input (distance:', Math.round(verticalDistance), 'px)');
          }
          
          // Also check if they share a common parent (more reliable)
          let inputParent = mainCommentInput.parentElement;
          let postParent = post.parentElement;
          let commonParent = null;
          let levels = 0;
          
          while (inputParent && levels < 10) {
            if (post.contains(inputParent) || inputParent.contains(post)) {
              commonParent = inputParent;
              break;
            }
            inputParent = inputParent.parentElement;
            levels++;
          }
          
          if (commonParent && !post.contains(mainCommentInput)) {
            // They share a parent but post doesn't contain input
            // Check if post is the main article in that parent
            const articlesInParent = Array.from(commonParent.querySelectorAll('div[role="article"]'));
            if (articlesInParent.length > 0 && articlesInParent[0] === post) {
              isNearKnownInput = true;
              console.log('[Pajaritos] ✅ Post is the first article in shared parent with comment input');
            }
          }
        }
      }
      
      // Only show button if input is visible OR can be opened via "Comentar" button
      let shouldShowButton = hasMainInput || canOpenInput || containsKnownInput || isNearKnownInput;
      
      console.log(`[Pajaritos] 📋 Post ${index + 1} FINAL CHECK:`, {
        hasMainInput,
        canOpenInput,
        containsKnownInput,
        isNearKnownInput,
        shouldShowButton,
        isPermalinkPage,
        postHasButton: post.querySelector('.pajaritos-reply-btn') !== null
      });
      
      // On permalink pages, ONLY show button on posts with main input (the actual post being viewed)
      if (isPermalinkPage) {
        if (!shouldShowButton) {
          // FALLBACK 1: Check for "Comentar" button even if input not detected
          console.log(`[Pajaritos] 🔍 Post ${index + 1}: Permalink page, input not detected, checking for "Comentar" button...`);
          const permalinkCommentButton = findCommentButton(post);
          if (permalinkCommentButton) {
            const btnLabel = permalinkCommentButton.getAttribute('aria-label') || permalinkCommentButton.textContent?.substring(0, 30) || 'no label';
            console.log(`[Pajaritos] ✅ Post ${index + 1}: Found "Comentar" button on permalink - label: ${btnLabel}`);
            shouldShowButton = true;
            canOpenInput = true;
            console.log(`[Pajaritos] ✅ Post ${index + 1}: Overriding shouldShowButton=true (found "Comentar" button on permalink)`);
          } else {
            // FALLBACK 2: Check if it's in a modal (permalink pages often open in modals)
            const isInModal = post.closest('[role="dialog"]') !== null || 
                             post.closest('[aria-modal="true"]') !== null;
            if (isInModal && postsToProcess.length === 1) {
              console.log('[Pajaritos] ⚠️ Permalink page: Input not detected and no "Comentar" button, but it\'s the only post in modal - showing button anyway (fallback)');
              shouldShowButton = true;
            } else if (postsToProcess.length === 1) {
              // FALLBACK 3: If this is the only post on a permalink page, it's definitely the main post
              // Some users have different Facebook UI where inputs aren't detected immediately
              console.log('[Pajaritos] ⚠️ Permalink page: Input not detected and no "Comentar" button, but this is the only post - showing button anyway (fallback)');
              shouldShowButton = true;
            } else {
              // Multiple posts - this might be a background/suggested post
              const existingBtn = post.querySelector('.pajaritos-reply-btn');
              if (existingBtn) {
                console.log('[Pajaritos] 🗑️ Removing button from background post (no main input)');
                existingBtn.remove();
              }
              console.log(`[Pajaritos] ⏭️ Skipping post ${index + 1} (no main input on permalink page)`);
              return; // Skip posts without main input on permalink pages
            }
          }
        }
      }
      
      // On feed pages, also check if input is visible or can be opened
      if (!isPermalinkPage && !hasMainInput && !canOpenInput) {
        // FALLBACK: Even if input not found, check if "Comentar" button exists
        // This handles cases where input is lazy-loaded or has different structure
        console.log(`[Pajaritos] 🔍 Post ${index + 1}: Input not found, checking for "Comentar" button as fallback...`);
        const fallbackCommentButton = findCommentButton(post);
        if (fallbackCommentButton) {
          const btnLabel = fallbackCommentButton.getAttribute('aria-label') || fallbackCommentButton.textContent?.substring(0, 30) || 'no label';
          console.log(`[Pajaritos] ✅ Post ${index + 1}: Found "Comentar" button (fallback) - label: ${btnLabel}`);
          // Override canOpenInput - we can click this button to open the input
          canOpenInput = true;
          shouldShowButton = true;
          console.log(`[Pajaritos] ✅ Post ${index + 1}: Overriding shouldShowButton=true (found "Comentar" button)`);
        } else {
          // LAST RESORT: If it's a modal and only one post, show button anyway
          // The post is definitely the main one in a modal
          const isInModal = post.closest('[role="dialog"]') !== null || 
                           post.closest('[aria-modal="true"]') !== null;
          if (isInModal && postsToProcess.length === 1) {
            console.log(`[Pajaritos] ⚠️ Post ${index + 1}: No input or "Comentar" button found, but it's the only post in modal - showing button anyway (last resort)`);
            shouldShowButton = true;
          } else {
            console.log(`[Pajaritos] ⏭️ Skipping post ${index + 1} (comment input not visible and cannot be opened)`);
            return; // Skip posts where comment section is not open and cannot be opened
          }
        }
      }
      
      // PRIORITY 1: If we found the "Responder como..." input, use it FIRST
      // Only fall back to "Comentar" button if input is not found
      let buttonAdded = false;
      
      // Check if we have a main input in this post - use it FIRST
      if (mainInputInPost && hasMainInput) {
        console.log(`[Pajaritos] 🎯 Post ${index + 1}: Found "Responder como..." input - using it as FIRST option`);
        const inputLabel = mainInputInPost.getAttribute('aria-label') || 
                          mainInputInPost.getAttribute('aria-placeholder') || '';
        if (inputLabel.toLowerCase().includes('responder como')) {
          // Use addButtonNearCommentInput to place button right next to input
          buttonAdded = addButtonNearCommentInput(mainInputInPost);
          if (buttonAdded) {
            console.log(`[Pajaritos] ✅ Post ${index + 1}: Button added next to "Responder como..." input (PRIORITY 1)`);
            // Mark post as processed
            post.dataset.pajaritosProcessed = 'true';
            return; // Skip the rest - we're done with this post
          }
        }
      }
      
      // PRIORITY 2: Fallback to "Comentar" button only if input approach didn't work
      // Check if button already exists (more thorough check)
      const existingBtn = post.querySelector('.pajaritos-reply-btn') || 
                         post.closest('div[role="article"]')?.querySelector('.pajaritos-reply-btn');
      
      if (!existingBtn && post.dataset.pajaritosProcessed !== 'true' && !buttonAdded) {
        console.log(`[Pajaritos] 🔄 Post ${index + 1}: No input found or input approach failed, trying "Comentar" button as FALLBACK`);
        const result = createReplyButton(post);
        if (!result) {
          console.error(`[Pajaritos] ❌ Post ${index + 1}: createReplyButton returned false - button was NOT created`);
          // Log post structure to help debug
          const postRect = post.getBoundingClientRect();
          console.log(`[Pajaritos] 🔍 Post ${index + 1} structure:`, {
            position: `(${Math.round(postRect.left)}, ${Math.round(postRect.top)})`,
            size: `${Math.round(postRect.width)}x${Math.round(postRect.height)}`,
            hasCommentButton: findCommentButton(post) !== null,
            hasActionButtons: post.querySelector('div[role="group"]') !== null || post.querySelector('div[role="toolbar"]') !== null,
            childrenCount: post.children.length
          });
        } else {
          console.log(`[Pajaritos] ✅ Post ${index + 1}: createReplyButton returned true - button should be created`);
          // Verify button was actually added - check in post and parent containers
          setTimeout(() => {
            // Search more broadly - button might be in parent containers
            let addedBtn = post.querySelector('.pajaritos-reply-btn');
            if (!addedBtn) {
              // Check parent elements (button might be inserted in parent)
              let parent = post.parentElement;
              let levels = 0;
              while (parent && levels < 3 && !addedBtn) {
                addedBtn = parent.querySelector('.pajaritos-reply-btn');
                if (addedBtn) {
                  // Verify it's related to this post (check if post contains the button's container)
                  const btnContainer = addedBtn.closest('div[role="article"]') || 
                                      addedBtn.closest('div[data-ad-preview="message"]');
                  if (btnContainer && (btnContainer === post || post.contains(btnContainer))) {
                    break; // Found it
                  } else {
                    addedBtn = null; // Not related to this post
                  }
                }
                parent = parent.parentElement;
                levels++;
              }
            }
            
            // Also check document-wide but near the post
            if (!addedBtn) {
              const postRect = post.getBoundingClientRect();
              const allButtons = document.querySelectorAll('.pajaritos-reply-btn');
              for (const btn of allButtons) {
                const btnRect = btn.getBoundingClientRect();
                const distance = Math.abs(btnRect.top - postRect.bottom);
                // If button is within 300px of the post, consider it related
                if (distance < 300 && Math.abs(btnRect.left - postRect.left) < 500) {
                  addedBtn = btn;
                  console.log(`[Pajaritos] ✅ Post ${index + 1}: Found button in nearby container (distance: ${Math.round(distance)}px)`);
                  break;
                }
              }
            }
            
            if (addedBtn) {
              const btnRect = addedBtn.getBoundingClientRect();
              console.log(`[Pajaritos] ✅ Post ${index + 1}: Button verified in DOM at position (${Math.round(btnRect.left)}, ${Math.round(btnRect.top)})`);
            } else {
              console.error(`[Pajaritos] ❌ Post ${index + 1}: Button NOT found in DOM after createReplyButton returned true!`);
              console.error(`[Pajaritos] 🔍 Debug: Post element:`, {
                tagName: post.tagName,
                className: post.className?.substring(0, 50),
                hasChildren: post.children.length,
                textPreview: post.textContent?.substring(0, 50)
              });
              // Check if button exists anywhere in document
              const allButtons = document.querySelectorAll('.pajaritos-reply-btn');
              console.error(`[Pajaritos] 🔍 Debug: Found ${allButtons.length} button(s) total in document`);
            }
          }, 300); // Increased delay to 300ms
        }
      } else {
        console.log(`[Pajaritos] ℹ️ Post ${index + 1}: Button already exists on this post`);
      }
    });
    
    // Cleanup: Remove duplicate buttons and buttons incorrectly placed
    const allButtons = document.querySelectorAll('.pajaritos-reply-btn');
    console.log(`[Pajaritos] 🧹 Cleanup: Found ${allButtons.length} button(s) total`);
    
    // Track buttons by their post to remove duplicates
    const buttonsByPost = new Map();
    
    allButtons.forEach(btn => {
      // Find the post/article this button belongs to
      const post = btn.closest('div[role="article"]') || 
                   btn.closest('div[data-ad-preview="message"]') ||
                   btn.closest('div[data-ad-comet-preview="message"]');
      
      if (post) {
        if (!buttonsByPost.has(post)) {
          buttonsByPost.set(post, []);
        }
        buttonsByPost.get(post).push(btn);
      }
    });
    
    // Remove duplicate buttons (keep only the first one per post)
    buttonsByPost.forEach((buttons, post) => {
      if (buttons.length > 1) {
        console.log(`[Pajaritos] 🗑️ Removing ${buttons.length - 1} duplicate button(s) from post`);
        // Keep the first button, remove the rest
        for (let i = 1; i < buttons.length; i++) {
          buttons[i].remove();
        }
      }
    });
    
    // Also check for buttons incorrectly placed in comment replies
    allButtons.forEach(btn => {
      // Find the nearest input field
      const modal = btn.closest('[role="dialog"]');
      if (!modal) return;
      
      // Check if button is near a comment reply input (not main post input)
      const nearbyInput = btn.parentElement?.querySelector('div[contenteditable="true"]') ||
                         btn.previousElementSibling?.querySelector('div[contenteditable="true"]') ||
                         btn.nextElementSibling?.querySelector('div[contenteditable="true"]');
      
      if (nearbyInput) {
        // Check if this input is a reply input (not main post input)
        const isReplyInput = nearbyInput.closest('[aria-label*="Responder"], [aria-label*="Reply"]') !== nearbyInput &&
                            (nearbyInput.closest('div[data-testid*="comment_replies"]') !== null ||
                             nearbyInput.closest('div[data-testid*="comment_reply"]') !== null);
        
        const inputLabel = nearbyInput.getAttribute('aria-label') || 
                          nearbyInput.getAttribute('aria-placeholder') || '';
        // "Responder como..." can be main post input if it's NOT in a comment reply structure
        const isMainInput = !isReplyInput && (
                           inputLabel.toLowerCase().includes('escribe una respuesta') ||
                           inputLabel.toLowerCase().includes('escribe un comentario') ||
                           inputLabel.toLowerCase().includes('comentario público') ||
                           inputLabel.toLowerCase().includes('public comment') ||
                           inputLabel.toLowerCase().includes('write a response') ||
                           inputLabel.toLowerCase().includes('responder como'));
        
        if (isReplyInput || !isMainInput) {
          console.log('[Pajaritos] 🗑️ Removing button from comment reply input (not main post)');
          btn.remove();
        }
      }
    });
    
    // RETRY LOGIC FOR PERMALINK PAGES: If no button was added and we're on a permalink page,
    // retry after a delay to catch lazy-loaded inputs
    if (isPermalinkPage && permalinkRetryCount < MAX_PERMALINK_RETRIES) {
      const hasButton = document.querySelector('.pajaritos-reply-btn');
      if (!hasButton) {
        permalinkRetryCount++;
        const retryDelay = permalinkRetryCount * 1000; // 1s, 2s, 3s
        console.log(`[Pajaritos] 🔄 Permalink page: No button found, retrying in ${retryDelay}ms (attempt ${permalinkRetryCount}/${MAX_PERMALINK_RETRIES})`);
        
        if (permalinkRetryTimer) {
          clearTimeout(permalinkRetryTimer);
        }
        permalinkRetryTimer = setTimeout(() => {
          addButtonsToPosts();
        }, retryDelay);
        return; // Exit early, will retry
      } else {
        // Button found, reset retry count
        permalinkRetryCount = 0;
        if (permalinkRetryTimer) {
          clearTimeout(permalinkRetryTimer);
          permalinkRetryTimer = null;
        }
      }
    } else if (!isPermalinkPage) {
      // Reset retry count when not on permalink page
      permalinkRetryCount = 0;
    }
    } catch (error) {
      console.error('[Pajaritos] Error in addButtonsToPosts:', error);
    } finally {
      isAddingButtons = false;
    }
  }

  // Debounce function to prevent excessive calls
  let debounceTimer = null;
  function debouncedAddButtons() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      addButtonsToPosts();
    }, 500); // Wait 500ms after last mutation before processing
  }

  // Observer for new posts - debounced to prevent performance issues
  const observer = new MutationObserver((mutations) => {
    // Skip if we're already adding buttons (prevents loop)
    if (isAddingButtons) {
      return;
    }
    
    // Add a small delay to let any button additions complete
    let hasOurButtons = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this mutation is from our button
            if (node.classList?.contains('pajaritos-reply-btn') || 
                node.querySelector?.('.pajaritos-reply-btn') ||
                node.closest?.('.pajaritos-reply-btn')) {
              hasOurButtons = true;
              break;
            }
          }
        }
      }
    });
    
    // If mutations are from our buttons, ignore them completely
    if (hasOurButtons) {
      return;
    }
    
    // Filter out mutations caused by our own button additions
    const hasRelevantChanges = mutations.some(mutation => {
      if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) {
        return false;
      }
      // Check if any added node is our button or contains our button
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Skip if this mutation is from our button
          if (node.classList?.contains('pajaritos-reply-btn') || 
              node.querySelector?.('.pajaritos-reply-btn')) {
            return false;
          }
        }
      }
      return true;
    });
    
    if (hasRelevantChanges) {
      debouncedAddButtons();
    }
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

  // Periodic check - reduced frequency to prevent performance issues
  setInterval(() => {
    // Skip if already running (prevents loop)
    if (!isAddingButtons) {
      addButtonsToPosts();
    }
  }, 5000); // Increased from 3000ms to 5000ms

  // Initial check after a delay
  setTimeout(() => {
    console.log('[Voluntarios de Guardia] Running initial post scan...');
    addButtonsToPosts();
  }, 2000);

  console.log('[Voluntarios de Guardia] Content script loaded - Manual mode');
  console.log('[Pajaritos] Current URL:', window.location.href);
  console.log('[Pajaritos] Ready to add reply buttons to posts');
})();
