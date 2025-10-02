import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * Handles PATCH requests to update the fileName of a specific resume.
 */
export async function PATCH(
    req: NextRequest
    // We are removing the second 'context' parameter to avoid the build error
    // and will get the ID from the URL instead.
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // FIX: Get the ID directly from the request URL
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const resumeId = pathSegments[pathSegments.length - 1];

        const { newFileName } = await req.json();

        if (!newFileName || typeof newFileName !== 'string' || newFileName.trim() === '') {
            return NextResponse.json({ error: 'Invalid file name provided.' }, { status: 400 });
        }

        const originalResume = await prisma.resume.findUnique({
            where: { id: resumeId },
        });

        if (!originalResume) {
            return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
        }

        if (originalResume.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden. You do not own this resume.' }, { status: 403 });
        }

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