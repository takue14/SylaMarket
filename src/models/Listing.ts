import mongoose, { Schema, Model, Document } from 'mongoose';

export type ListingType = 'scholarship' | 'enrollment' | 'job';
export type ListingStatus = 'draft' | 'published' | 'archived';

export interface ListingBaseDoc extends Document {
  organizationId?: string;
  organizationName: string;
  title: string;
  description: string;
  type: ListingType;
  category: string;
  logo?: string;
  location?: string;
  deadline?: Date;
  externalUrl: string;
  requirements?: string[];
  tags?: string[];
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<ListingBaseDoc>(
  {
    organizationId: { type: String },
    organizationName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['scholarship', 'enrollment', 'job'], required: true },
    category: { type: String },
    logo: { type: String },
    location: { type: String },
    deadline: { type: Date },
    externalUrl: { type: String, required: true },
    requirements: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  },
  { timestamps: true, discriminatorKey: 'type' }
);

export const Listing: Model<ListingBaseDoc> =
  mongoose.models.Listing || mongoose.model<ListingBaseDoc>('Listing', listingSchema);

// ---- Scholarship ----
export interface ScholarshipDoc extends ListingBaseDoc {
  funding?: string;
  studyLevel?: string;
  eligibleCountries?: string[];
}
const scholarshipSchema = new Schema<ScholarshipDoc>({
  funding: { type: String },
  studyLevel: { type: String },
  eligibleCountries: { type: [String], default: [] },
});
export const Scholarship =
  mongoose.models.scholarship || Listing.discriminator<ScholarshipDoc>('scholarship', scholarshipSchema);

// ---- Enrollment ----
export interface EnrollmentDoc extends ListingBaseDoc {
  school?: string;
  program?: string;
  studyLevel?: string;
  tuitionFee?: string;
  intake?: string;
}
const enrollmentSchema = new Schema<EnrollmentDoc>({
  school: { type: String },
  program: { type: String },
  studyLevel: { type: String },
  tuitionFee: { type: String },
  intake: { type: String },
});
export const Enrollment =
  mongoose.models.enrollment || Listing.discriminator<EnrollmentDoc>('enrollment', enrollmentSchema);

// ---- Job ----
export interface JobDoc extends ListingBaseDoc {
  employmentType?: string;
  salary?: string;
  experienceLevel?: string;
  workMode?: string;
}
const jobSchema = new Schema<JobDoc>({
  employmentType: { type: String },
  salary: { type: String },
  experienceLevel: { type: String },
  workMode: { type: String },
});
export const Job = mongoose.models.job || Listing.discriminator<JobDoc>('job', jobSchema);