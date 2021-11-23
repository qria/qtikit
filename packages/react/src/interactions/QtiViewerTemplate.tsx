import React from 'react';
import {ComponentStory} from '@storybook/react';

import QtiViewer from '../';

export const QtiViewerTemplate: ComponentStory<typeof QtiViewer> = args => {
  const [inputState, setInputState] = React.useState({});

  args.assessmentItemSrc = `/tests/${args.assessmentItemSrc}`;
  args.inputState = inputState;
  args.onChange = (value: any) => {
    setInputState(value);
  };

  return <QtiViewer {...args} />;
};
