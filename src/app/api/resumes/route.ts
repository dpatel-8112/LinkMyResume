// src/app/api/resumes/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const resumes = await prisma.resume.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc', // Show the newest resumes first
            },
        });

        return NextResponse.json(resumes, { status: 200 });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        return NextResponse.json({ error: 'Failed to fetch resumes.' }, { status: 500 });
    }
}