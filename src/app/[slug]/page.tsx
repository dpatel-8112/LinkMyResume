// src/app/[slug]/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// const prisma = new PrismaClien();

// This tells Next.js to revalidate this page on-demand
export const revalidate = 0;

async function getResume(slug: string) {
    const resume = await prisma.resume.findUnique({
        where: { shareableSlug: slug },
    });
    return resume;
}

export default async function ResumeViewer({ params }: { params: { slug: string } }) {
    const resume = await getResume(params.slug);

    if (!resume) {
        notFound(); // This will render the not-found.tsx page
    }

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <iframe
                src={resume.fileUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={resume.fileName}
            />
        </div>
    );
}