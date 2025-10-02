// src/app/api/resumes/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    // 1. Check for user authentication
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const resumeId = params.id;
        const { newFileName } = await req.json();

        if (!newFileName || typeof newFileName !== 'string') {
            return NextResponse.json({ error: 'Invalid file name provided.' }, { status: 400 });
        }

        // 2. Find the original resume to verify ownership
        const originalResume = await prisma.resume.findUnique({
            where: { id: resumeId },
        });

        if (!originalResume) {
            return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
        }

        // 3. CRITICAL: Ensure the logged-in user owns this resume
        if (originalResume.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 4. Update the resume with the new file name
        const updatedResume = await prisma.resume.update({
            where: { id: resumeId },
            data: {
                fileName: newFileName,
            },
        });

        return NextResponse.json(updatedResume, { status: 200 });
    } catch (error) {
        console.error('Error updating resume:', error);
        return NextResponse.json({ error: 'Failed to update resume.' }, { status: 500 });
    }
}