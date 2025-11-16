"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface Group {
  id: string;
  name: string;
}

interface Post {
  id: string;
  message?: string;
  created_time: string;
  from?: {
    name: string;
    id: string;
  };
}

interface DashboardProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      id?: string;
    };
    accessToken?: string;
  };
}

export default function Dashboard({ session }: DashboardProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Comment from URL feature
  const [postUrl, setPostUrl] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchPosts(selectedGroup);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/facebook/groups");
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else if (data.data) {
        setGroups(data.data);
      }
    } catch (err) {
      setError("Failed to fetch groups");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/facebook/posts?groupId=${groupId}`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else if (data.data) {
        setPosts(data.data);
      }
    } catch (err) {
      setError("Failed to fetch posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const postComment = async (postId: string, message: string) => {
    try {
      const response = await fetch("/api/facebook/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, message }),
      });
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert("Comment posted successfully!");
        if (selectedGroup) {
          fetchPosts(selectedGroup);
        }
      }
    } catch (err) {
      alert("Failed to post comment");
      console.error(err);
    }
  };

  const postCommentFromUrl = async () => {
    if (!postUrl.trim() || !commentText.trim()) {
      alert("Please provide both a post URL and comment text");
      return;
    }

    setCommenting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/facebook/comment-from-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postUrl: postUrl.trim(), message: commentText.trim() }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        const errorMsg = data.error + (data.hint ? `\n\nTip: ${data.hint}` : "");
        setError(data.error);
        alert(errorMsg);
      } else {
        alert("Comment posted successfully!");
        setPostUrl("");
        setCommentText("");
      }
    } catch (err) {
      const errorMsg = "Failed to post comment";
      setError(errorMsg);
      alert(errorMsg);
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pajaritos Contesta
              </h1>
              <p className="text-sm text-gray-600">
                Logged in as: {session.user?.name || session.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">
              Make sure you have the required permissions and your app is
              properly configured.
            </p>
          </div>
        )}

        {/* Groups Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Facebook Groups</h2>
          {loading && !groups.length ? (
            <p className="text-gray-600">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="text-gray-600">
              No groups found. Make sure you have admin access to groups.
            </p>
          ) : (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a group...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Posts Section */}
        {selectedGroup && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
            {loading ? (
              <p className="text-gray-600">Loading posts...</p>
            ) : posts.length === 0 ? (
              <p className="text-gray-600">No posts found in this group.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {post.from?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(post.created_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">
                      {post.message || "(No message)"}
                    </p>
                    <button
                      onClick={() => {
                        const message = prompt("Enter your comment:");
                        if (message) {
                          postComment(post.id, message);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Comment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comment from URL Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Comment on Any Post</h2>
          <p className="text-sm text-gray-600 mb-4">
            Paste a Facebook group post URL and write a comment to post it automatically.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Post URL
              </label>
              <input
                type="text"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://www.facebook.com/groups/123456789/posts/987654321/"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the direct URL of the Facebook post (not share URLs). To get it: Open the post → Click timestamp → Copy URL
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Share URLs (facebook.com/share/p/...) don't work. Use direct post URLs.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment Text
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={postCommentFromUrl}
              disabled={commenting || !postUrl.trim() || !commentText.trim()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {commenting ? "Posting Comment..." : "Post Comment"}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            How it works:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Each admin user logs in with their Facebook account</li>
            <li>Your access token is stored securely in your session</li>
            <li>All API calls use your personal access token</li>
            <li>Multiple users can use the same app with their own tokens</li>
            <li>Paste any Facebook post URL and comment directly</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

