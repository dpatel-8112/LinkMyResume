'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define a type for our resume object
type Resume = {
  id: string;
  fileName: string;
  fileUrl: string;
  shareableSlug: string;
  createdAt: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for the upload form
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the list of resumes
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // State for managing inline editing and copying
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Effect to handle session status changes (fetching data or redirecting)
  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoadingList(true);
      fetch('/api/resumes')
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch resumes");
            return res.json();
          })
          .then((data) => {
            setResumes(data);
          })
          .catch((err) => console.error(err))
          .finally(() => setIsLoadingList(false));

    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCopyLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEditClick = (resume: Resume) => {
    setEditingId(resume.id);
    setNewFileName(resume.fileName);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewFileName('');
  };

  const handleSaveEdit = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFileName }),
      });
      if (!response.ok) throw new Error('Failed to save.');
      const updatedResume = await response.json();
      setResumes(resumes.map(r => r.id === resumeId ? updatedResume : r));
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      alert('Could not save the new name.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const newResume = await response.json();
      if (!response.ok) throw new Error(newResume.error || 'Upload failed.');
      setResumes([newResume, ...resumes]);
      setFile(null);
      const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (status === 'authenticated') {
    return (
        <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-10">
            {/* Upload Section */}
            <div className="w-full p-8 space-y-8 bg-white rounded-xl shadow-lg">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Upload Your Resume</h1>
                <p className="mt-2 text-md text-gray-600">
                  Welcome, {session?.user?.email}!
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                      htmlFor="resume-upload"
                      className="group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-10 px-6 text-center transition-colors hover:border-violet-400 hover:bg-violet-50"
                  >
                    <div className="text-gray-500 transition-colors group-hover:text-violet-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3-3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                    </div>
                    <p className="mt-4 text-lg text-gray-600 transition-colors group-hover:text-violet-700">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      PDF only
                    </p>
                    {file && (
                        <div className="mt-4 rounded-md bg-violet-100 py-2 px-4 text-sm font-medium text-violet-800">
                          Selected: {file.name}
                        </div>
                    )}
                  </label>
                  <input
                      id="resume-upload"
                      name="resume"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                  />
                </div>
                <button
                    type="submit"
                    disabled={isUploading || !file}
                    className="w-full inline-flex justify-center items-center gap-x-2 rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-75"
                >
                  {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Uploading...
                      </>
                  ) : (
                      'Upload & Get Link'
                  )}
                </button>
                {error && <p className="mt-2 text-sm text-center text-red-600">{error}</p>}
              </form>
            </div>

            {/* List Section with New Design */}
            <div className="w-full p-8 bg-white rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900">Your Uploaded Resumes</h2>
              <div className="mt-6">
                {isLoadingList ? (<p className="text-center text-gray-500">Loading your resumes...</p>) : resumes.length === 0 ? (<p className="text-center text-gray-500">You haven&apos;t uploaded any resumes yet..</p>) : (
                    <ul className="divide-y divide-gray-200">
                      {resumes.map((resume) => (
                          <li key={resume.id} className="py-4">
                            {editingId === resume.id ? (
                                // EDIT MODE
                                <div className="flex items-center gap-2">
                                  <input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="block w-full px-3 py-1.5 border border-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm" autoFocus />
                                  <button onClick={() => handleSaveEdit(resume.id)} className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500">Save</button>
                                  <button onClick={handleCancelEdit} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                                </div>
                            ) : (
                                // DISPLAY MODE
                                <div className="flex items-center justify-between">
                                  <div className="flex min-w-0 flex-col">
                                    {/* NEW: Wrapper for the name and icon */}
                                    <div className="flex items-center gap-2">
                                      <a href={`/${resume.shareableSlug}`} target="_blank"
                                         rel="noopener noreferrer"
                                         className="truncate text-base font-medium text-gray-800 hover:text-violet-600">{resume.fileName}</a>
                                      {/* MOVED: The edit icon button is now here */}
                                      <button onClick={() => handleEditClick(resume)}
                                              className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                                        <svg xmlns="http://www.w3.org/2000/svg"
                                             viewBox="0 0 20 20" fill="currentColor"
                                             className="h-4 w-4">
                                          <path
                                              d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                                          <path
                                              d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25-1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
                                        </svg>
                                      </button>
                                    </div>
                                    <p className="truncate text-sm text-gray-500">Uploaded
                                      on: {new Date(resume.createdAt).toLocaleString()}</p>
                                  </div>
                                  <div className="flex-shrink-0 flex items-center space-x-2">
                                    {/* NEW: Redesigned Buttons */}
                                    <button
                                        onClick={() => handleCopyLink(resume.shareableSlug, resume.id)}
                                        className={`inline-flex items-center gap-x-1.5 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors ${copiedId === resume.id ? 'bg-green-100 text-green-700' : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}>
                                      {copiedId === resume.id ? (
                                          <svg xmlns="http://www.w3.org/2000/svg"
                                               viewBox="0 0 20 20" fill="currentColor"
                                               className="h-5 w-5">
                                            <path fillRule="evenodd"
                                                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                                                  clipRule="evenodd"/>
                                          </svg>) : (<svg xmlns="http://www.w3.org/2000/svg"
                                                          viewBox="0 0 20 20" fill="currentColor"
                                                          className="h-5 w-5 text-gray-400">
                                        <path
                                            d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.121A1.5 1.5 0 0117 6.621V16.5a1.5 1.5 0 01-1.5 1.5h-8A1.5 1.5 0 016 16.5v-10A1.5 1.5 0 017 5V3.5z"/>
                                        <path
                                            d="M4 6.5A1.5 1.5 0 015.5 5h1A1.5 1.5 0 018 6.5v10A1.5 1.5 0 016.5 18h-1A1.5 1.5 0 014 16.5v-10z" /></svg>)}
                                      {copiedId === resume.id ? 'Copied' : 'Copy'}
                                    </button>
                                    <a href={`/${resume.shareableSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-x-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                                      View
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mr-0.5 h-5 w-5"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" /><path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.19a.75.75 0 00-.053 1.06z" clipRule="evenodd" /></svg>
                                    </a>
                                  </div>
                                </div>
                            )}
                          </li>
                      ))}
                    </ul>
                )}
              </div>
            </div>
          </div>
        </main>
    );
  }

  return null;
}