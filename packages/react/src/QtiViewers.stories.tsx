import {UserInput} from '@qtikit/model/lib/user-input';
import React, {useEffect, useState} from 'react';

import QtiViewer, {QtiViewerProps} from './QtiViewer';
import {getPathName} from './utils/url';

function verifyUrl(url: string) {
  return /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
    url
  );
}

function urlize(url: string) {
  const urlized = /^(http|https):\/\//.test(url) ? url : `https://${url}`;
  if (!verifyUrl(urlized)) {
    throw new Error(`Invalid URL: ${urlized}`);
  }

  return urlized;
}

const QtiViewerContainer = ({assessmentItemSrc, inputState, onChange}: QtiViewerProps) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
  }, [assessmentItemSrc]);

  return (
    <>
      <h2>
        QTI: <a href={assessmentItemSrc}>{getPathName(assessmentItemSrc)}</a>
      </h2>
      {!error ? (
        <QtiViewer
          assessmentItemSrc={assessmentItemSrc}
          inputState={inputState}
          onChange={onChange}
          onError={setError}
        />
      ) : (
        <div>{error}</div>
      )}
    </>
  );
};

export const Viewers = () => {
  const [assessmentItems, setAssessmentItems] = useState([]);
  const [error, setError] = useState(null);
  const [inputState, setInputState] = useState<UserInput>({});
  const [urls, setUrls] = useState('');

  const updateUrls = (value: string) => {
    try {
      setUrls(value);
      setAssessmentItems(value.trim().split('\n').map(urlize));
      setError(null);
    } catch (e) {
      setError(e.toString());
    }
  };

  const onChange = ({target: {value}}) => updateUrls(value);

  useEffect(() => updateUrls(new URL(location.href).searchParams.get('src') ?? ''), []);

  return (
    <>
      <h1>Input Assessment Urls</h1>
      <div>
        <textarea value={urls} onChange={onChange} rows={5} style={{width: '100%', height: '100%'}} />
      </div>
      <div>{error && <span>{error}</span>}</div>
      <div>
        {assessmentItems.map((assessmentItemSrc, index) => (
          <QtiViewerContainer
            key={index}
            assessmentItemSrc={assessmentItemSrc}
            inputState={inputState}
            onChange={setInputState}
          />
        ))}
      </div>
    </>
  );
};

export default {
  title: 'Tests/Viewers',
};
