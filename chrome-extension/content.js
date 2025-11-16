// Pajaritos Contesta - Auto Reply Content Script
// This script runs on Facebook pages and automatically replies to posts

(function() {
  'use strict';

  // Configuration
  let isEnabled = false;
  let rules = [];
  let delayBetweenActions = 2000; // 2 seconds delay between actions

  // Load settings from storage
  chrome.storage.sync.get(['enabled', 'rules', 'delay'], (result) => {
    isEnabled = result.enabled || false;
    rules = result.rules || [];
    delayBetweenActions = result.delay || 2000;
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.enabled) {
        isEnabled = changes.enabled.newValue;
      }
      if (changes.rules) {
        rules = changes.rules.newValue || [];
      }
      if (changes.delay) {
        delayBetweenActions = changes.delay.newValue || 2000;
      }
    }
  });

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Find comment button for a post
  function findCommentButton(postElement) {
    // Try different selectors for comment button
    const selectors = [
      'div[role="button"][aria-label*="Comment"]',
      'div[role="button"][aria-label*="Comentar"]',
      'span:contains("Comment")',
      'span:contains("Comentar")',
      'a[href*="/comment"]'
    ];

    for (const selector of selectors) {
      const button = postElement.querySelector(selector);
      if (button) return button;
    }

    // Fallback: look for buttons with text "Comment" or "Comentar"
    const buttons = postElement.querySelectorAll('div[role="button"], a, span');
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      if (text.includes('comment') || text.includes('comentar')) {
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
      const input = document.querySelector(selector);
      if (input) return input;
    }

    return null;
  }

  // Check if post matches any rule
  function matchesRule(postText) {
    if (!postText || !rules.length) return null;

    const lowerText = postText.toLowerCase();

    for (const rule of rules) {
      if (!rule.enabled || !rule.keywords || !rule.response) continue;

      // Check if any keyword matches
      const keywordMatches = rule.keywords.some(keyword => {
        const lowerKeyword = keyword.toLowerCase().trim();
        return lowerText.includes(lowerKeyword);
      });

      if (keywordMatches) {
        return rule;
      }
    }

    return null;
  }

  // Post a comment
  async function postComment(commentText) {
    const input = findCommentInput();
    if (!input) {
      console.log('[Pajaritos] Comment input not found');
      return false;
    }

    try {
      // Focus and click the input
      input.focus();
      await wait(500);

      // Set the text content
      if (input.contentEditable === 'true') {
        input.textContent = commentText;
        input.innerText = commentText;
        
        // Trigger input events
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      } else {
        input.value = commentText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      await wait(500);

      // Find and click the submit button
      const submitSelectors = [
        'div[aria-label*="Post"][role="button"]',
        'div[aria-label*="Publicar"][role="button"]',
        'button[type="submit"]'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        submitButton = document.querySelector(selector);
        if (submitButton) break;
      }

      // Fallback: look for button near the input
      if (!submitButton) {
        const parent = input.closest('form') || input.parentElement;
        submitButton = parent?.querySelector('button[type="submit"], div[role="button"]');
      }

      if (submitButton) {
        submitButton.click();
        console.log('[Pajaritos] Comment posted:', commentText);
        return true;
      } else {
        console.log('[Pajaritos] Submit button not found');
        return false;
      }
    } catch (error) {
      console.error('[Pajaritos] Error posting comment:', error);
      return false;
    }
  }

  // Process a single post
  async function processPost(postElement) {
    // Check if already processed
    if (postElement.dataset.pajaritosProcessed === 'true') {
      return;
    }

    // Get post text
    const postText = postElement.textContent || '';
    
    // Check if post matches any rule
    const matchingRule = matchesRule(postText);
    if (!matchingRule) {
      postElement.dataset.pajaritosProcessed = 'true';
      return;
    }

    console.log('[Pajaritos] Post matches rule:', matchingRule.name);

    // Find and click comment button
    const commentButton = findCommentButton(postElement);
    if (!commentButton) {
      console.log('[Pajaritos] Comment button not found for post');
      postElement.dataset.pajaritosProcessed = 'true';
      return;
    }

    // Click comment button
    commentButton.click();
    await wait(delayBetweenActions);

    // Post the comment
    const success = await postComment(matchingRule.response);
    
    if (success) {
      postElement.dataset.pajaritosProcessed = 'true';
      console.log('[Pajaritos] Successfully replied to post');
    }

    await wait(delayBetweenActions);
  }

  // Main observer for new posts
  function observePosts() {
    if (!isEnabled) return;

    // Find all posts on the page
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
      if (post.dataset.pajaritosProcessed !== 'true') {
        processPost(post);
      }
    });
  }

  // Use MutationObserver to watch for new posts
  const observer = new MutationObserver(() => {
    if (isEnabled) {
      observePosts();
    }
  });

  // Start observing when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      observePosts();
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    observePosts();
  }

  // Periodic check (in case observer misses something)
  setInterval(() => {
    if (isEnabled) {
      observePosts();
    }
  }, 5000);

  console.log('[Pajaritos Contesta] Content script loaded');
})();

