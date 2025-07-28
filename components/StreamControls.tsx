'use client'

import { useState } from 'react'
import { 
  Play, 
  Square, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor,
  MonitorOff,
  Settings
} from 'lucide-react'
import { StreamControlsProps } from '@/types'

export default function StreamControls({
  isStreaming,
  streamConfig,
  onStartStream,
  onStopStream,
  onConfigChange
}: StreamControlsProps) {
  const [showSettings, setShowSettings] = useState(false)

  const toggleVideo = () => {
    onConfigChange({
      ...streamConfig,
      video: !streamConfig.video
    })
  }

  const toggleAudio = () => {
    onConfigChange({
      ...streamConfig,
      audio: !streamConfig.audio
    })
  }

  const toggleScreen = () => {
    onConfigChange({
      ...streamConfig,
      screen: !streamConfig.screen
    })
  }

  const handleQualityChange = (quality: string) => {
    onConfigChange({
      ...streamConfig,
      quality: quality as any
    })
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Stream Controls</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="control-button control-button-secondary p-2"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-4 mb-6">
        {/* Start/Stop Stream */}
        {!isStreaming ? (
          <button
            onClick={onStartStream}
            className="control-button bg-green-600 text-white hover:bg-green-700 px-6 py-3 text-base"
            disabled={!streamConfig.video && !streamConfig.audio && !streamConfig.screen}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Stream
          </button>
        ) : (
          <button
            onClick={onStopStream}
            className="control-button control-button-destructive px-6 py-3 text-base"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop Stream
          </button>
        )}

        {/* Media Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVideo}
            className={`control-button p-3 ${
              streamConfig.video 
                ? 'control-button-primary' 
                : 'control-button-secondary'
            }`}
            title={streamConfig.video ? 'Turn off camera' : 'Turn on camera'}
          >
            {streamConfig.video ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={toggleAudio}
            className={`control-button p-3 ${
              streamConfig.audio 
                ? 'control-button-primary' 
                : 'control-button-secondary'
            }`}
            title={streamConfig.audio ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {streamConfig.audio ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={toggleScreen}
            className={`control-button p-3 ${
              streamConfig.screen 
                ? 'control-button-primary' 
                : 'control-button-secondary'
            }`}
            title={streamConfig.screen ? 'Stop screen share' : 'Share screen'}
          >
            {streamConfig.screen ? (
              <Monitor className="w-5 h-5" />
            ) : (
              <MonitorOff className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Stream Settings */}
      {showSettings && (
        <div className="border-t border-border pt-6">
          <h4 className="font-medium text-foreground mb-4">Stream Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quality Settings */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stream Quality
              </label>
              <select
                value={streamConfig.quality}
                onChange={(e) => handleQualityChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isStreaming}
              >
                <option value="auto">Auto</option>
                <option value="low">Low (360p)</option>
                <option value="medium">Medium (720p)</option>
                <option value="high">High (1080p)</option>
              </select>
            </div>

            {/* Stream Type Info */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stream Type
              </label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                {streamConfig.screen && streamConfig.video 
                  ? 'Camera + Screen Share'
                  : streamConfig.screen 
                  ? 'Screen Share Only'
                  : streamConfig.video 
                  ? 'Camera Only'
                  : 'Audio Only'
                }
              </div>
            </div>
          </div>

          {/* Stream Requirements */}
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h5 className="font-medium text-blue-400 mb-2">Requirements</h5>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• At least one media source must be enabled</li>
              <li>• Camera and microphone permissions required</li>
              <li>• Screen share requires additional browser permission</li>
              <li>• Higher quality settings require more bandwidth</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}