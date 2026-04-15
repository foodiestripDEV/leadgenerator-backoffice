import { redirect } from 'next/navigation';

// Legacy route – redirects to the default form leads
export default function OldLeadsPage() {
  redirect('/forms/default/leads');
}
