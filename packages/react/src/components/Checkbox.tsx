import React from 'react';
import {useInteractionStateContext} from 'src/interactions/InteractionState';

interface CheckboxProps {
  indentifier: string;
}

const Checkbox: React.FC<CheckboxProps> = ({indentifier}) => {
  const {interactionState, setInteractionState} = useInteractionStateContext();

  const handleChange = () => {
    setInteractionState({
      ...interactionState,
      [indentifier]: !(interactionState[indentifier] === true),
    });
  };

  return <input type="checkbox" checked={interactionState[indentifier] === true} onChange={handleChange} />;
};

export default Checkbox;