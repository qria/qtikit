import React from 'react';
import {MediaInteractionCharacteristics as MediaInteractionProps} from '@qtikit/model/lib/qti2_2';

import {classNameForInteraction} from '../../utils/style';

const MediaInteraction: React.FC<MediaInteractionProps | any> = props => {
  return <div className={classNameForInteraction('media')}>{props.children}</div>;
};

export default MediaInteraction;
