import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Listing } from '@/models/Listing';
import { requireRole } from '@/lib/session';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

async function uploadLogo(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'dealo/listings', resource_type: 'image' }, (err, result) => {
      if (err || !result) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

export async function GET(req: NextRequest) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const type = req.nextUrl.searchParams.get('type');
  const query = type ? { type } : {};
  const listings = await Listing.find(query).sort({ createdAt: -1 });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDB();
    const formData = await req.formData();

    const type = formData.get('type') as string;
    if (!['scholarship', 'enrollment', 'job'].includes(type)) {
      return NextResponse.json({ message: 'Valid type is required.' }, { status: 400 });
    }

    const body: Record<string, unknown> = {
      type,
      organizationName: formData.get('organizationName') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      externalUrl: formData.get('externalUrl') as string,
      category: (formData.get('category') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined,
      status: (formData.get('status') as string) || 'published',
    };

    if (!body.title || !body.description || !body.externalUrl || !body.organizationName) {
      return NextResponse.json({ message: 'Title, description, organization name, and link are required.' }, { status: 400 });
    }

    // type-specific fields
    if (type === 'scholarship') {
      body.funding = formData.get('funding') || undefined;
      body.studyLevel = formData.get('studyLevel') || undefined;
    }
    if (type === 'enrollment') {
      body.school = formData.get('school') || undefined;
      body.program = formData.get('program') || undefined;
      body.tuitionFee = formData.get('tuitionFee') || undefined;
      body.intake = formData.get('intake') || undefined;
    }
    if (type === 'job') {
      body.employmentType = formData.get('employmentType') || undefined;
      body.salary = formData.get('salary') || undefined;
      body.experienceLevel = formData.get('experienceLevel') || undefined;
      body.workMode = formData.get('workMode') || undefined;
    }

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      if (!logoFile.type.startsWith('image/')) {
        return NextResponse.json({ message: 'Logo must be an image.' }, { status: 400 });
      }
      body.logo = await uploadLogo(logoFile);
    }

    const listing = await Listing.create(body);
    return NextResponse.json({ message: 'Listing created.', listing }, { status: 201 });
  } catch (err) {
    console.error('Create listing error:', err);
    return NextResponse.json({ message: 'Failed to create listing.' }, { status: 500 });
  }
}