import React, { ReactNode } from 'react';

import { isComponentRemovable } from '@/core/lib/ecs/ComponentRegistry';
import { InspectorSection } from '@/editor/components/shared/InspectorSection';

export interface IGenericComponentSectionProps {
  title: string;
  icon: ReactNode;
  headerColor: 'green' | 'cyan' | 'red' | 'purple' | 'orange';
  componentId: string;
  onRemove?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export const GenericComponentSection: React.FC<IGenericComponentSectionProps> = ({
  title,
  icon,
  headerColor,
  componentId,
  onRemove,
  collapsible = true,
  defaultCollapsed = false,
  children,
}) => {
  const removable = isComponentRemovable(componentId);

  return (
    <InspectorSection
      title={title}
      icon={icon}
      headerColor={headerColor}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      removable={removable}
      onRemove={onRemove}
    >
      <div className="space-y-1">{children}</div>
    </InspectorSection>
  );
};
