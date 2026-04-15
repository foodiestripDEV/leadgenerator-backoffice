'use client';

import { use } from 'react';
import { FormProvider } from '@/context/FormContext';

export default function FormLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <FormProvider slug={slug}>
      {children}
    </FormProvider>
  );
}
