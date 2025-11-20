import { BackButton } from '@/components/back-button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      {showBackButton && <BackButton />}
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
