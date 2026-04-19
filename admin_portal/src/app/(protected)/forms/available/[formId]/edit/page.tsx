import { FormBuilderPage } from '@/components/forms/FormBuilderPage';

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  return <FormBuilderPage mode="edit" formId={formId} />;
} 