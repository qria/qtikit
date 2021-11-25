import React from 'react';
import {
  MatchInteractionCharacteristics as MatchInteractionProps,
  SimpleAssociableChoiceCharacteristics,
} from '@qtikit/model/lib/qti2_2';
import Prompt from 'src/components/Prompt';
import {createStyle} from 'src/utils/style';
import {getPropsByElement} from 'src/utils/node';

import {useInteractionState} from '../InteractionState';

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
  children: any;
};

const SEPARATOR = ' ';

function getAssociableChoice(choice: Element): SimpleAssociableChoice {
  const {matchMax, identifier} = getPropsByElement(choice);
  return {
    identifier: identifier as string,
    matchMax: Number(matchMax),
    textContent: choice.textContent?.trim(),
    matchCount: 0,
    children: {},
  };
}

type ChoiceIdentifier = Record<string, SimpleAssociableChoice>;

interface ChoiceTable {
  rows: string[];
  cols: string[];
  identifiers: ChoiceIdentifier;
}

function getChoices(element: Element): ChoiceTable {
  const matchSet = [...element.querySelectorAll('simpleMatchSet')]
    .sort((rows, cols) => rows.children.length - cols.children.length)
    .map(set => Array.from(set.children));

  const identifiers: ChoiceIdentifier = {};

  const getElement = (choice: Element) => {
    const props = getAssociableChoice(choice);
    identifiers[props.identifier] = props;
    return props.identifier;
  };

  const rows = matchSet[1].map(getElement);
  const cols = matchSet[0].map(getElement);

  return {rows, cols, identifiers};
}

const MatchInteraction: React.FC<MatchInteractionProps | any> = ({
  responseIdentifier,
  maxAssociations,
  elementChildren,
}) => {
  const getKey = (id: number) => `qti-component-${responseIdentifier}-${id}`;
  const [interactionState, setInteractionState] = useInteractionState({
    responseIdentifier,
    encode: userInput =>
      userInput.reduce((interactionState, indentifier) => ({...interactionState, [indentifier]: true}), {}),
    decode: interactionState =>
      Object.entries(interactionState)
        .filter(([, checked]) => checked)
        .map(([identifier]) => identifier),
  });
  const prompt = elementChildren.querySelector('prompt');
  const [choices, setChoices] = React.useState(getChoices(elementChildren));

  console.log('interactionState', interactionState);
  console.log('choices', choices);

  const isChecked = (identifier: string) => interactionState[identifier] === true;

  const handleClick: React.PointerEventHandler<HTMLInputElement> = event => {
    event.preventDefault();

    const {
      dataset: {identifier},
    } = event.currentTarget;

    if (!identifier) {
      return;
    }

    const [row, col] = identifier.split(SEPARATOR).map(identifier => choices.identifiers[identifier]);
    const checked = isChecked(identifier);

    if (!checked) {
      if (maxAssociations === 0 || Object.keys(interactionState).length >= maxAssociations) {
        console.log('Rejected from over max association');
        return;
      }

      if (row.matchCount + 1 > row.matchMax || col.matchCount + 1 > col.matchMax) {
        console.log('Rejected from over match count', row, col);
        return;
      }
    }

    row.matchCount += !checked ? 1 : -1;
    col.matchCount += !checked ? 1 : -1;

    setInteractionState({
      ...interactionState,
      [identifier]: !checked,
    });

    setChoices({
      ...choices,
      identifiers: {
        ...choices.identifiers,
        [row.identifier]: row,
        [col.identifier]: col,
      },
    });
  };

  interface RowProp {
    choices: ChoiceTable;
  }

  const HeaderRow: React.FC<RowProp> = ({choices}) => (
    <tr>
      <th></th>
      {choices.cols.map((col, index) => (
        <td style={cellStyle} key={getKey(index)}>
          {choices.identifiers[col].textContent}
        </td>
      ))}
    </tr>
  );

  const BodyRow: React.FC<RowProp> = ({choices}) => (
    <>
      {choices.rows.map((row, rowIndex) => (
        <tr key={getKey(rowIndex)}>
          <th style={cellStyle}>{choices.identifiers[row].textContent}</th>
          {choices.cols.map((col, colIndex: number) => (
            <td style={cellStyle} key={getKey(colIndex)}>
              <input
                defaultChecked={isChecked(
                  `${choices.identifiers[row].identifier} ${choices.identifiers[col].identifier}`
                )}
                type="checkbox"
                data-identifier={`${choices.identifiers[row].identifier} ${choices.identifiers[col].identifier}`}
                onClick={handleClick}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div>
      {prompt && <Prompt>{prompt?.textContent}</Prompt>}
      <table style={tableStyle}>
        <tbody>
          <HeaderRow choices={choices} />
          <BodyRow choices={choices} />
        </tbody>
      </table>
    </div>
  );
};

export default MatchInteraction;
