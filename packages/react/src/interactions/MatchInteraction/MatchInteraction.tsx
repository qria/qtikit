import React from 'react';
import {
  MatchInteractionCharacteristics as MatchInteractionProps,
  SimpleAssociableChoiceCharacteristics,
} from '@qtikit/model/lib/qti2_2';
import Prompt from 'src/components/Prompt';
import {createStyle} from 'src/utils/style';
import {getPropsByElement} from 'src/utils/node';

const tableStyle = createStyle({
  tableLayout: 'fixed',
  width: '100%',
  borderCollapse: 'collapse',
  border: '3px solid black',
});

const cellStyle = createStyle({
  border: '1px solid #444444',
});

type SimpleAssociableChoice = SimpleAssociableChoiceCharacteristics & Element;

interface MaxMatch {
  max: number;
  checked: number;
}

class MatchState {
  private maxMatchSet: {[key: string]: MaxMatch} = {};
  private responses: string[] = [];
  constructor(
    public matchSet: SimpleAssociableChoice[][],
    public maxAssociations: number = 0,
    public minAssociations: number = 0 // public selected: string[] = []
  ) {
    if (maxAssociations < minAssociations) {
      throw new Error('maxAssociations must be greater than or equal to minAssociations');
    }

    // FIXME, cannot be a member
    console.log('maxAssociations', maxAssociations);

    for (const match of matchSet) {
      for (const choice of match) {
        const props = {...getPropsByElement(choice)};
        this.maxMatchSet[props.identifier as string] = {
          max: Number(props.matchMax),
          checked: 0,
        };
      }
    }

    console.log('this.maxMatchSet', this.maxMatchSet);

    this.isAddable.bind(this);
    this.canBeSubmitted.bind(this);
    this.submitResponse.bind(this);
    this.removeResponse.bind(this);
    this.isSubmitted.bind(this);
    this.check.bind(this);
    this.uncheck.bind(this);
  }

  isAddable(identifiers: string): boolean {
    const maxMatch = this.maxMatchSet[identifiers];
    return !(maxMatch.max === 0 || maxMatch.checked >= maxMatch.max);
  }

  canBeSubmitted(): boolean {
    console.log(
      'this.maxAssociations === 0 || this.responses.length < this.maxAssociations;',
      this.maxAssociations,
      this.responses.length,
      this
    );
    return this.maxAssociations === 0 || this.responses.length < this.maxAssociations;
  }

  submitResponse(identifier: string) {
    this.responses.push(identifier);
  }

  removeResponse(identifier: string) {
    const index = this.responses.indexOf(identifier);
    if (index > -1) {
      this.responses.splice(index, 1);
    }
  }

  isSubmitted(identifier: string): boolean {
    return this.responses.indexOf(identifier) > -1;
  }

  check(identifier: string): boolean {
    const ids = identifier.split(' ');
    if (this.canBeSubmitted() && this.isAddable(ids[0]) && this.isAddable(ids[1])) {
      this.maxMatchSet[ids[0]].checked++;
      this.maxMatchSet[ids[1]].checked++;
      return true;
    }

    return false;
  }

  uncheck(identifier: string) {
    const ids = identifier.split(' ');
    this.maxMatchSet[ids[0]].checked--;
    this.maxMatchSet[ids[1]].checked--;

    this.removeResponse(identifier);
  }
}

const MatchInteraction: React.FC<MatchInteractionProps | any> = ({
  responseIdentifier,
  maxAssociations,
  minAssociations,
  node,
}) => {
  const getKey = (id: number) => `qti-component-${responseIdentifier}-${id}`;
  const prompt = node.querySelector('prompt');
  const matchSet = [...node.querySelectorAll('simpleMatchSet')]
    .map(matchSet => [...matchSet.children])
    .sort((f, s) => f.length - s.length);
  const associations = {
    max: maxAssociations ?? 0,
    min: Math.min(minAssociations ?? 0, maxAssociations ?? 0),
  };
  console.log('maxAssociations', maxAssociations, maxAssociations ?? 0, associations.max);
  const matchState = new MatchState(matchSet, associations.max, associations.min);

  const handleClick: React.PointerEventHandler<HTMLInputElement> = event => {
    const {
      dataset: {identifier},
    } = event.currentTarget;
    if (!matchState.isSubmitted(identifier as string)) {
      if (!matchState.check(identifier as string)) {
        console.log('rejected', identifier);
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      console.log('submited', identifier);
    } else {
      matchState.uncheck(identifier as string);
      console.log('removed', identifier);
    }

    console.log('matchState', matchState);
    // TODO send response
  };

  const HeaderColums = (choices: SimpleAssociableChoice[]) => {
    return (
      <tr>
        <th></th>
        {choices.map((choice, index) => (
          <td style={cellStyle} key={getKey(index)}>
            {choice.textContent}
          </td>
        ))}
      </tr>
    );
  };

  const ChoiceColums = (firstChoices: SimpleAssociableChoice[], secondChoices: SimpleAssociableChoice[]) => {
    return firstChoices.map((first, rowIndex) => {
      const firstProps = {...getPropsByElement(first)};
      return (
        <tr key={`qti-component-${firstProps.identifier}-${rowIndex}`}>
          <th style={cellStyle}>{first.textContent}</th>
          {secondChoices.map((second, colIndex) => {
            const secondProps = {...getPropsByElement(second)};
            return (
              <td style={cellStyle} key={getKey(colIndex)}>
                <input
                  data-identifier={`${firstProps.identifier} ${secondProps.identifier}`}
                  type="checkbox"
                  onClick={handleClick}
                />
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return (
    <div>
      {prompt && <Prompt>{prompt?.textContent}</Prompt>}
      <table style={tableStyle}>
        <tbody>
          {HeaderColums(matchSet[0])}
          {ChoiceColums(matchSet[1], matchSet[0])}
        </tbody>
      </table>
    </div>
  );
};

export default MatchInteraction;
