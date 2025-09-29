import { useMemo, useState } from 'react';
import { MATERIAL_TEMPLATES, type IMaterialTemplate } from '../constants/materialTemplates';

export interface ITemplateSelectionState {
  selectedTemplate: string;
  searchTerm: string;
  filteredTemplates: IMaterialTemplate[];
}

export interface ITemplateSelectionActions {
  setSelectedTemplate: (templateId: string) => void;
  setSearchTerm: (term: string) => void;
  getSelectedTemplateData: () => IMaterialTemplate | undefined;
  resetSelection: () => void;
}

export const useTemplateSelection = (): [ITemplateSelectionState, ITemplateSelectionActions] => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredTemplates = useMemo(() => {
    return MATERIAL_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.shader.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.materialType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getSelectedTemplateData = (): IMaterialTemplate | undefined => {
    return MATERIAL_TEMPLATES.find(template => template.id === selectedTemplate);
  };

  const resetSelection = () => {
    setSelectedTemplate('');
    setSearchTerm('');
  };

  const state: ITemplateSelectionState = {
    selectedTemplate,
    searchTerm,
    filteredTemplates,
  };

  const actions: ITemplateSelectionActions = {
    setSelectedTemplate,
    setSearchTerm,
    getSelectedTemplateData,
    resetSelection,
  };

  return [state, actions];
};