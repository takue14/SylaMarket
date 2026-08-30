import { redirect } from 'next/navigation';
export default function Page() {
  redirect('/auth?role=seller&mode=signin');
}