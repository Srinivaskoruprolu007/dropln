// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

// Define a type for your file/folder items
type Item = {
  id: string;
  name: string;
  isFolder: boolean;
  type: string; // Mime type for files, or 'folder'
  size?: number; // Optional, for files
  fileUrl?: string; // Optional, for files
  thumbnailUrl?: string | null; // Optional
  parentId: string | null;
  createdAt: string; // Assuming API returns this or we can add it
  updatedAt: string; // Assuming API returns this or we can add it
  userId: string;
  isStarred: boolean;
  isDeleted: boolean;
  path: string;
};

const DashboardPage = () => {
  const { userId, getToken } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Store a history of parent IDs for breadcrumbs and back navigation
  const [folderHistory, setFolderHistory] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "My Files" }]);

  // currentParentId will now be derived from the last item in folderHistory
  const currentParentId = folderHistory[folderHistory.length - 1]?.id || null;
  // const currentFolderName = folderHistory[folderHistory.length - 1]?.name || 'My Files'; // Not directly used in UI, breadcrumbs handle this

  const fetchData = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      let apiUrl = `/api/files?userId=${userId}`;
      if (currentParentId) {
        apiUrl += `&parentId=${currentParentId}`;
      }
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch data");
      }
      const data: Item[] = await response.json();
      setItems(data.filter((item) => !item.isDeleted)); // Filter out deleted items client-side for immediate feedback
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, getToken, currentParentId]);

  // Placeholder functions for actions
  const handleCreateFolder = async (folderName: string) => {
    if (!userId || !folderName.trim()) return;
    setIsLoading(true); // Indicate loading state
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/folders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: folderName,
          userId,
          parentId: currentParentId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create folder");
      }
      // Re-fetch data to show the new folder
      const fetchData = async () => {
        let apiUrl = `/api/files?userId=${userId}`;
        if (currentParentId) {
          apiUrl += `&parentId=${currentParentId}`;
        }
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to re-fetch data");
        setItems(await res.json());
      };
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!userId || !file) return;
    // For now, require a parentId for uploads based on API structure
    if (!currentParentId) {
      setError("Please select a folder to upload files into.");
      return;
    }
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("parentId", currentParentId); // API requires parentId

    try {
      const token = await getToken();
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          // Content-Type is set automatically for FormData
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }
      // Re-fetch data to show the new file
      const fetchData = async () => {
        let apiUrl = `/api/files?userId=${userId}`;
        if (currentParentId) {
          apiUrl += `&parentId=${currentParentId}`;
        }
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to re-fetch data");
        setItems(await res.json());
      };
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-gray-600">Authenticating...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Loading your files and folders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-6 text-red-600">Error</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb">
          <ol className="flex space-x-2 text-gray-600">
            {folderHistory.map((folder, index) => (
              <li key={folder.id || "root"} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                <button
                  onClick={() => handleNavigateToBreadcrumb(index)}
                  className={`hover:underline ${
                    index === folderHistory.length - 1
                      ? "font-semibold text-gray-800"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  {folder.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const folderName = prompt("Enter folder name:");
              if (folderName) handleCreateFolder(folderName);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create Folder
          </button>
          <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                  e.target.value = ""; // Reset file input
                }
              }}
            />
          </label>
        </div>
      </div>

      {currentParentId && (
        <button
          onClick={() => setCurrentParentId(null)} // This needs to be smarter to go to actual parent
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Back to Root
        </button>
      )}

      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">
            This folder is empty or you have no files yet.
          </p>
          <p className="text-gray-400 mt-2">
            Start by uploading a file or creating a folder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer ${
                item.isFolder ? "border-blue-500" : "border-gray-300"
              } border-2`}
              onClick={() => item.isFolder && handleNavigateToFolder(item)}
            >
              <div className="flex items-center mb-2">
                {/* Basic Icon Placeholder */}
                <span className="mr-2 text-xl">
                  {item.isFolder ? "📁" : "📄"}
                </span>
                <h2
                  className="text-lg font-medium text-gray-700 truncate"
                  title={item.name}
                >
                  {item.name}
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                Type: {item.isFolder ? "Folder" : item.type}
              </p>
              {!item.isFolder && item.size && (
                <p className="text-xs text-gray-500">
                  Size: {(item.size / 1024).toFixed(2)} KB
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Modified:{" "}
                {new Date(
                  item.updatedAt || item.createdAt
                ).toLocaleDateString()}
              </p>
              {/* Action buttons */}
              <div className="mt-3 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStar(item.id);
                  }}
                  className={`p-1 rounded hover:bg-gray-200 ${
                    item.isStarred ? "text-yellow-500" : "text-gray-400"
                  }`}
                  title={item.isStarred ? "Unstar" : "Star"}
                >
                  {item.isStarred ? "🌟" : "⭐"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(`Are you sure you want to delete "${item.name}"?`)
                    )
                      handleDelete(item.id);
                  }}
                  className="p-1 rounded text-red-500 hover:bg-red-100"
                  title="Delete"
                >
                  🗑️
                </button>
                {/* Add download button for files if needed */}
                {!item.isFolder && item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded text-blue-500 hover:bg-blue-100"
                    title="Download"
                  >
                    💾
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
