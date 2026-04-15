import { redirect } from 'next/navigation';

// Legacy route – redirects to the default form builder
export default function OldBuilderPage() {
  redirect('/forms/default/builder');
}
