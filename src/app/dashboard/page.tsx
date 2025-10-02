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

    // NEW: State to track which link was just copied
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Fetch resumes when the component mounts
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await fetch('/api/resumes');
                if (!response.ok) throw new Error('Failed to fetch resumes');
                const data = await response.json();
                setResumes(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingList(false);
            }
        };

        if (status === 'authenticated') {
            fetchResumes();
        }
    }, [status]);

    // Redirect if unauthenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // NEW: Function to handle copying the link
    const handleCopyLink = async (slug: string, id: string) => {
        const url = `${window.location.origin}/${slug}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy link.');
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
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const newResume = await response.json();
            if (!response.ok) throw new Error(newResume.error || 'Something went wrong');

            setResumes([newResume, ...resumes]);
            setFile(null);
            const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = "";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (status === 'loading' || status === 'unauthenticated') {
        return <div className="flex min-h-screen items-center justify-center bg-gray-100">Loading...</div>;
    }

    return (
        <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-10">
                {/* Upload Section */}
                <div className="w-full p-8 space-y-8 bg-white rounded-xl shadow-lg">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Upload Your Resume</h1>
                        <p className="mt-2 text-md text-gray-600">Welcome, {session?.user?.email}!</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="resume-upload" className="group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-10 px-6 text-center transition-colors hover:border-violet-400 hover:bg-violet-50">
                                <div className="text-gray-500 transition-colors group-hover:text-violet-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3-3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                                </div>
                                <p className="mt-4 text-lg text-gray-600 transition-colors group-hover:text-violet-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="mt-1 text-sm text-gray-500">PDF only</p>
                                {file && <div className="mt-4 rounded-md bg-violet-100 py-2 px-4 text-sm font-medium text-violet-800">Selected: {file.name}</div>}
                            </label>
                            <input id="resume-upload" name="resume" type="file" accept="application/pdf" onChange={handleFileChange} className="sr-only" />
                        </div>
                        <button type="submit" disabled={isUploading || !file} className="w-full inline-flex justify-center items-center gap-x-2 rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-75">
                            {isUploading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Uploading...</>) : ('Upload & Get Link')}
                        </button>
                        {error && <p className="mt-2 text-sm text-center text-red-600">{error}</p>}
                    </form>
                </div>

                {/* List Section with Copy Button */}
                <div className="w-full p-8 bg-white rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900">Your Uploaded Resumes</h2>
                    <div className="mt-6">
                        {isLoadingList ? (<p className="text-center text-gray-500">Loading your resumes...</p>) : resumes.length === 0 ? (<p className="text-center text-gray-500">You haven't uploaded any resumes yet.</p>) : (
                            <ul className="divide-y divide-gray-200">
                                {resumes.map((resume) => (
                                    <li key={resume.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                        <div className="flex min-w-0 flex-col">
                                            <a href={`/${resume.shareableSlug}`} target="_blank" rel="noopener noreferrer" className="truncate text-base font-medium text-violet-600 hover:text-violet-800 hover:underline">
                                                {resume.fileName}
                                            </a>
                                            <p className="text-sm text-gray-500">Uploaded on: {new Date(resume.createdAt).toLocaleString()}</p>
                                        </div>
                                        {/* NEW: Action buttons group */}
                                        <div className="flex-shrink-0 flex items-center space-x-2">
                                            <button
                                                onClick={() => handleCopyLink(resume.shareableSlug, resume.id)}
                                                className={`inline-block rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                                                    copiedId === resume.id
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {copiedId === resume.id ? 'Copied!' : 'Copy Link'}
                                            </button>
                                            <a href={`/${resume.shareableSlug}`} target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50">
                                                View
                                            </a>
                                        </div>
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