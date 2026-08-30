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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await connectToDB();
    const formData = await req.formData();

    const type = formData.get('type') as string;
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
      body.logo = await uploadLogo(logoFile);
    }
    // no new logo submitted → leave the existing one untouched (don't overwrite with undefined)

    const updated = await Listing.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
    return NextResponse.json({ message: 'Listing updated.', listing: updated });
  } catch (err) {
    console.error('Update listing error:', err);
    return NextResponse.json({ message: 'Failed to update listing.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await connectToDB();
    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: 'Listing not found.' }, { status: 404 });
    return NextResponse.json({ message: 'Listing deleted.' });
  } catch (err) {
    console.error('Delete listing error:', err);
    return NextResponse.json({ message: 'Failed to delete listing.' }, { status: 500 });
  }
}