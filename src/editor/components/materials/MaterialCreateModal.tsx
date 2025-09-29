import React, { useCallback } from 'react';
import { FiEdit3, FiGrid } from 'react-icons/fi';

import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { InternalTabs, useInternalTabs } from '@/editor/components/shared/InternalTabs';
import { Modal } from '@/editor/components/shared/Modal';
import { MaterialActions } from './components/MaterialActions';
import { MaterialNameForm } from './components/MaterialNameForm';
import { ScratchMaterialForm } from './components/ScratchMaterialForm';
import { TemplateSelectionForm } from './components/TemplateSelectionForm';
import { useMaterialCreation } from './hooks/useMaterialCreation';
import { useMaterialForm } from './hooks/useMaterialForm';
import { useTemplateSelection } from './hooks/useTemplateSelection';

export interface IMaterialCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (material: IMaterialDefinition) => void;
  templateMaterialId?: string;
}

export const MaterialCreateModal: React.FC<IMaterialCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  templateMaterialId,
}) => {
  const [formState, formActions] = useMaterialForm();
  const [templateState, templateActions] = useTemplateSelection();
  const materialCreation = useMaterialCreation();
  const { activeTab, changeTab } = useInternalTabs('scratch');

  const resetForm = useCallback(() => {
    formActions.resetForm();
    templateActions.resetSelection();
  }, [formActions, templateActions]);

  const handleNameChange = useCallback((name: string) => {
    formActions.setMaterialName(name);

    if (name.trim()) {
      const baseId = materialCreation.slugify(name);
      const uniqueId = materialCreation.generateUniqueId(baseId);
      formActions.setMaterialId(uniqueId);
    } else {
      formActions.setMaterialId('');
    }
  }, [formActions, materialCreation]);

  const handleSubmit = useCallback(async () => {
    if (!materialCreation.validateForm(formState, activeTab, templateState.selectedTemplate)) {
      return;
    }

    let newMaterial: IMaterialDefinition;

    if (activeTab === 'scratch') {
      newMaterial = materialCreation.createMaterialFromScratch(formState);
    } else {
      const template = templateActions.getSelectedTemplateData();
      if (!template) return;

      newMaterial = materialCreation.createMaterialFromTemplate(
        formState,
        template,
        templateMaterialId
      );
    }

    try {
      await onCreate(newMaterial);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create material:', error);
      alert('Failed to create material. Please try again.');
    }
  }, [materialCreation, formState, activeTab, templateState.selectedTemplate, templateActions, templateMaterialId, onCreate, onClose, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const isCreateDisabled = useCallback(() => {
    return !materialCreation.validateForm(formState, activeTab, templateState.selectedTemplate);
  }, [materialCreation, formState, activeTab, templateState.selectedTemplate]);

  const tabs = [
    {
      id: 'scratch',
      label: 'From Scratch',
      icon: <FiEdit3 size={16} />,
      content: (
        <ScratchMaterialForm
          formState={formState}
          formActions={formActions}
          previewMaterial={formActions.createPreviewMaterial()}
        />
      ),
    },
    {
      id: 'template',
      label: 'From Template',
      icon: <FiGrid size={16} />,
      content: (
        <TemplateSelectionForm
          searchTerm={templateState.searchTerm}
          onSearchChange={templateActions.setSearchTerm}
          filteredTemplates={templateState.filteredTemplates}
          selectedTemplate={templateState.selectedTemplate}
          onTemplateSelect={templateActions.setSelectedTemplate}
        />
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Material"
      size="lg"
      maxHeight="h-[80dvh]"
      scrollBody={false}
    >
      <div className="flex flex-col h-full min-h-0">
        <MaterialNameForm
          materialName={formState.materialName}
          materialId={formState.materialId}
          onNameChange={handleNameChange}
          onIdChange={formActions.setMaterialId}
        />

        <div className="flex-1 min-h-0">
          <InternalTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={changeTab}
            variant="underline"
            scrollContent={true}
            className="h-full"
          />
        </div>

        <MaterialActions
          onClose={handleClose}
          onSubmit={handleSubmit}
          isCreateDisabled={isCreateDisabled()}
        />
      </div>
    </Modal>
  );
};
