import React from 'react';

/**
 * Animated Research Robot Mascot Component
 * Features pure CSS 3D rotation, floating levitation, orbiting tech rings,
 * glowing neon scanner eyes, and animated antennae.
 *
 * Props:
 * - size: 'sm' (header/avatar 40px), 'md' (flight deck 80px), 'lg' (hero/empty state 160px)
 * - isThinking: boolean (activates turbo spin and scanner laser)
 */
export default function CopilotRobot({ size = 'md', isThinking = false }) {
  return (
    <div className={`copilot-robot-wrapper size-${size} ${isThinking ? 'thinking' : ''}`}>
      {/* 3D Orbiting Gyroscopic Rings */}
      <div className="robot-orbit-ring ring-outer" />
      <div className="robot-orbit-ring ring-middle" />
      <div className="robot-orbit-ring ring-inner" />

      {/* Floating Particles / Data Sparks */}
      <div className="robot-particle p-1" />
      <div className="robot-particle p-2" />
      <div className="robot-particle p-3" />
      <div className="robot-particle p-4" />

      {/* Robot Core Body */}
      <div className="robot-chassis">
        {/* Antenna / Radar */}
        <div className="robot-antenna">
          <div className="antenna-stem" />
          <div className="antenna-beacon" />
          <div className="antenna-pulse" />
        </div>

        {/* Robot Head */}
        <div className="robot-head">
          {/* Ear pods */}
          <div className="robot-ear ear-left" />
          <div className="robot-ear ear-right" />

          {/* Visor / Face Display */}
          <div className="robot-visor">
            <div className="robot-eye eye-left">
              <div className="eye-pupil" />
            </div>
            <div className="robot-scanner-beam" />
            <div className="robot-eye eye-right">
              <div className="eye-pupil" />
            </div>
          </div>

          {/* Smile / Frequency bar */}
          <div className="robot-mouth">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* Floating Torso (for medium & large sizes) */}
        {size !== 'sm' && (
          <div className="robot-torso">
            <div className="torso-core-reactor">
              <div className="core-gear" />
              <div className="core-glow" />
            </div>
            <div className="robot-arm arm-left" />
            <div className="robot-arm arm-right" />
          </div>
        )}

        {/* Hover Propulsion Jet */}
        {size !== 'sm' && (
          <div className="robot-propulsion">
            <div className="jet-flame" />
            <div className="jet-ring" />
          </div>
        )}
      </div>
    </div>
  );
}
