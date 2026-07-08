import React from 'react';

import { MarkdownEditorField } from '../../../../components/ui';
import { TemplateButton } from '../../../../types/components';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  templateButtons?: TemplateButton[];
  onAppendTemplate?: (textToAppend: string) => void;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  value,
  onChange,
  disabled = false,
  templateButtons = [],
  onAppendTemplate,
}) => (
  <MarkdownEditorField
    value={value}
    onChange={onChange}
    id='notes'
    label='Explanation / Notes'
    placeholder='Enter explanation or additional notes...'
    disabled={disabled}
    templateButtons={templateButtons}
    onAppendTemplate={onAppendTemplate}
  />
);
