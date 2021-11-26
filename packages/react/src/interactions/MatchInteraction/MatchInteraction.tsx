import React from 'react';
import {
  MatchInteractionCharacteristics as MatchInteractionProps,
  SimpleAssociableChoiceCharacteristics,
} from '@qtikit/model/lib/qti2_2';
import Prompt from 'src/components/Prompt';
import {createStyle} from 'src/utils/style';
import {getPropsByElement} from 'src/utils/node';

import InteractionStateContext, {useInteractionState, useInteractionStateContext} from '../InteractionState';

const tableStyle = createStyle({
  tableLayout: 'fixed',
  width: '100%',
  borderCollapse: 'collapse',
  border: '3px solid black',
});

const cellStyle = createStyle({
  border: '1px solid #444444',
});

type SimpleAssociableChoice = Omit<SimpleAssociableChoiceCharacteristics, 'identifier' | 'matchMax'> & {
  identifier: string;
  textContent: any;
  matchMax: number;
  matchCount: number;
};

const SEPARATOR = ' ';

function getAssociableChoice(choice: Element): SimpleAssociableChoice {
  const {matchMax, identifier} = getPropsByElement(choice);
  return {
    identifier: identifier as string,
    matchMax: Number(matchMax),
    textContent: choice.textContent?.trim(),
    matchCount: 0,
  };
}

const useChoiceInteractionState = ({
  rowIdentifier,
  colIdentifier,
  maxAssociations,
  choices,
}: {
  rowIdentifier: string;
  colIdentifier: string;
  maxAssociations: number;
  choices: SimpleAssociableChoice[][];
}): [boolean, () => void] => {
  const {interactionState, setInteractionState} = useInteractionStateContext();

  const isChecked = React.useMemo(
    () => ((interactionState[rowIdentifier] ?? []) as string[]).includes(colIdentifier),
    [colIdentifier, interactionState, rowIdentifier]
  );

  return [
    isChecked,
    React.useCallback(() => {
      const col = choices[0].find(choice => choice.identifier === colIdentifier);
      const row = choices[1].find(choice => choice.identifier === rowIdentifier);
      if (!col || !row) {
        return;
      }
      const cols = (interactionState[rowIdentifier] ?? []) as string[];
      if (!isChecked) {
        const associationCount = Object.values(interactionState).reduce<number>(
          (count, values) => count + (values as string[]).length,
          0
        );
        if (associationCount >= maxAssociations) {
          console.log('rejected, max associations reached');
          return;
        }
        if (col.matchCount + 1 > col.matchMax || row.matchCount + 1 > row.matchMax) {
          console.log('rejected, max associations reached');
          return;
        }
        col.matchCount++;
        row.matchCount++;
        setInteractionState({
          ...interactionState,
          [rowIdentifier]: [...cols, colIdentifier],
        });
      } else {
        col.matchCount--;
        row.matchCount--;
        setInteractionState({
          ...interactionState,
          [rowIdentifier]: [...cols.filter(c => c !== colIdentifier)],
        });
      }
    }, [choices, interactionState, maxAssociations, rowIdentifier, isChecked, colIdentifier, setInteractionState]),
  ];
};

interface ChoiceProps {
  row: string;
  col: string;
  maxAssociations: number;
  choices: SimpleAssociableChoice[][];
}

const Choice: React.FC<ChoiceProps> = ({row, col, choices, maxAssociations}) => {
  const [checked, setChecked] = useChoiceInteractionState({
    rowIdentifier: row,
    colIdentifier: col,
    maxAssociations,
    choices,
  });

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = () => {
    setChecked();
  };

  return <input type="checkbox" checked={checked || false} onChange={handleChange} />;
};

const MatchInteraction: React.FC<MatchInteractionProps | any> = ({
  responseIdentifier,
  maxAssociations,
  elementChildren,
}) => {
  const getKey = (id: number) => `qti-component-${responseIdentifier}-${id}`;

  const [interactionState, setInteractionState] = useInteractionState({
    responseIdentifier,
    encode: userInput => {
      return userInput.reduce((interactionState, input) => {
        const [key, value] = input.split(SEPARATOR);
        const cols = (interactionState[key] ?? []) as string[];
        return {...interactionState, [key]: [...cols, value]};
      }, {} as {[key: string]: string[]});
    },
    decode: interactionState => {
      // FIXME, generate count map
      return Object.entries(interactionState).reduce((response, [key, values]) => {
        (values as string[]).forEach(value => response.push(`${key}${SEPARATOR}${value}`));
        return response;
      }, [] as string[]);
    },
  });

  const prompt = React.useMemo(() => elementChildren.querySelector('prompt'), [elementChildren]);
  const matchSet = React.useMemo(() => {
    return [...elementChildren.querySelectorAll('simpleMatchSet')]
      .sort((rows, cols) => rows.children.length - cols.children.length)
      .map(set => Array.from(set.children).map(child => getAssociableChoice(child as Element)));
  }, [elementChildren]);

  const HeaderRow = () => (
    <tr>
      <th></th>
      {matchSet[0].map(({textContent}, index) => (
        <td style={cellStyle} key={getKey(index)}>
          {textContent}aa
        </td>
      ))}
    </tr>
  );

  const BodyRow = () => (
    <InteractionStateContext.Provider value={{interactionState, setInteractionState}}>
      {matchSet[1].map(({identifier: row, textContent}, rowIndex) => (
        <tr key={getKey(rowIndex)}>
          <th style={cellStyle}>{textContent}</th>
          {matchSet[0].map(({identifier: col}, colIndex) => (
            <td style={cellStyle} key={getKey(colIndex)}>
              <Choice
                {...{
                  row,
                  col,
                  // FIXME, not all of the match data
                  choices: matchSet,
                  maxAssociations,
                }}></Choice>
            </td>
          ))}
        </tr>
      ))}
    </InteractionStateContext.Provider>
  );

  return (
    <div>
      {prompt && <Prompt>{prompt?.textContent}</Prompt>}
      <table style={tableStyle}>
        <tbody>
          <HeaderRow />
          <BodyRow />
        </tbody>
      </table>
    </div>
  );
};

export default MatchInteraction;
