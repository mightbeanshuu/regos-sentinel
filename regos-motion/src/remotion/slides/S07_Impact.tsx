import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdBody,
  EdCanvas,
  EdDisplay,
  EdHeader,
  ED_MARGIN,
  ED_TEAL,
  Rise,
} from '../system/editorial';
import {WeeksToMinutesChart} from '../system/editorialArt';

// T5 clone — blue field, big white chart left, giant white title right,
// justified paragraph beneath. The teal bar is the one accent in the deck.
export const S07_Impact: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="blue">
        <EdHeader variant="blue" />

        {/* chart — template's white bar chart slot */}
        <div style={{position: 'absolute', left: ED_MARGIN, top: 200, zIndex: 20}}>
          <WeeksToMinutesChart width={820} height={780} delay={12} />
        </div>

        {/* giant title right */}
        <div style={{position: 'absolute', right: ED_MARGIN - 4, top: 336, zIndex: 20}}>
          <EdDisplay
            variant="blue"
            lines={['WEEKS TO', 'MINUTES']}
            size={186}
            delay={8}
            align="right"
          />
          <Rise delay={24}>
            <div
              style={{
                height: 8,
                width: 380,
                background: ED_TEAL,
                marginTop: 26,
                marginLeft: 'auto',
              }}
            />
          </Rise>
        </div>

        {/* paragraph */}
        <div style={{position: 'absolute', right: ED_MARGIN, top: 764, zIndex: 20}}>
          <EdBody variant="blue" width={820} delay={28} size={25}>
            The signature beat: drop a new SEBI circular into the change-impact
            simulator and watch the live diff — obligations added, controls
            changed, tasks generated, evidence gaps flagged, owners notified. The
            manual impact analysis that consumes a lean compliance team for weeks
            compresses into minutes, with every line traceable to its clause.
          </EdBody>
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
