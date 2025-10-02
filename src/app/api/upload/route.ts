// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from '@/lib/prisma';

// S3 client configuration
const s3Client = new S3Client({
    region: 'ap-south-1',
    endpoint: `https://hsuajcyxqvlcpeqtjwml.supabase.co/storage/v1/s3`,
    credentials: {
        accessKeyId: process.env.S3_BUCKET_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_BUCKET_ACCESS_KEY!,
    },
    // FIX: Add this line
    forcePathStyle: true,
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('resume') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
        const bucketName = process.env.S3_BUCKET_NAME!;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: file.type || 'application/pdf',
        });

        await s3Client.send(command);

        const projectUrl = process.env.SUPABASE_URL!;
        const publicUrl = `${projectUrl}/storage/v1/object/public/${bucketName}/${fileName}`;

        const newResume = await prisma.resume.create({
            data: {
                userId: session.user.id,
                fileName: file.name,
                fileKey: fileName,
                fileUrl: publicUrl,
            },
        });

        return NextResponse.json(newResume, { status: 200 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal server error during upload.' }, { status: 500 });
    }
}