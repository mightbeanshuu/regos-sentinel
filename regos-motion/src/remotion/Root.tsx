import React from 'react';
import {Composition} from 'remotion';
import {calculateIdeaDeckDuration, IDEA_DECK, RegOSIdeaDeck} from './IdeaDeck';
import {DEMO_VIDEO, RegOSDemoVideo} from './RegOSDemoVideo';
import {PITCH} from './pitch/constants';
import {RegOSFinalPitch} from './pitch/RegOSFinalPitch';
import {GALLERY, RegOSVectorGallery} from './pitch/vector/RegOSVectorGallery';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={PITCH.id}
        component={RegOSFinalPitch}
        durationInFrames={PITCH.durationInFrames}
        fps={PITCH.fps}
        width={PITCH.width}
        height={PITCH.height}
      />
      <Composition
        id={IDEA_DECK.id}
        component={RegOSIdeaDeck}
        durationInFrames={calculateIdeaDeckDuration()}
        fps={IDEA_DECK.fps}
        width={IDEA_DECK.width}
        height={IDEA_DECK.height}
      />
      <Composition
        id={DEMO_VIDEO.id}
        component={RegOSDemoVideo}
        durationInFrames={DEMO_VIDEO.durationInFrames}
        fps={DEMO_VIDEO.fps}
        width={DEMO_VIDEO.width}
        height={DEMO_VIDEO.height}
      />
    </>
  );
};
