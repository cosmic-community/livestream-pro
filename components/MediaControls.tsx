'use client'

import { useState } from 'react'
import { StreamConfig } from '@/types'
import WebcamCapture from './WebcamCapture'
import ScreenShare from './ScreenShare'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs'

interface MediaControlsProps {
  streamConfig: StreamConfig
  onConfigChange: (config: StreamConfig) => void
  onStreamChange: (webcamStream: MediaStream | null, screenStream: MediaStream | null) => void
}

export default function MediaControls({
  streamConfig,
  onConfigChange,
  onStreamChange
}: MediaControlsProps) {
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [activeTab, setActiveTab] = useState<'webcam' | 'screen'>('webcam')

  const handleWebcamToggle = () => {
    const newConfig = { ...streamConfig, video: !streamConfig.video }
    onConfigChange(newConfig)
  }

  const handleScreenShareToggle = () => {
    const newConfig = { ...streamConfig, screen: !streamConfig.screen }
    onConfigChange(newConfig)
  }

  const handleWebcamStreamChange = (stream: MediaStream | null) => {
    setWebcamStream(stream)
    onStreamChange(stream, screenStream)
  }

  const handleScreenStreamChange = (stream: MediaStream | null) => {
    setScreenStream(stream)
    onStreamChange(webcamStream, stream)
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4">Media Sources</h3>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'webcam' | 'screen')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="webcam" className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${streamConfig.video ? 'bg-green-500' : 'bg-gray-400'}`} />
            Webcam
          </TabsTrigger>
          <TabsTrigger value="screen" className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${streamConfig.screen ? 'bg-blue-500' : 'bg-gray-400'}`} />
            Screen Share
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="webcam" className="mt-4">
          <WebcamCapture
            isEnabled={streamConfig.video}
            onStreamChange={handleWebcamStreamChange}
            onToggle={handleWebcamToggle}
          />
        </TabsContent>
        
        <TabsContent value="screen" className="mt-4">
          <ScreenShare
            isEnabled={streamConfig.screen}
            onStreamChange={handleScreenStreamChange}
            onToggle={handleScreenShareToggle}
          />
        </TabsContent>
      </Tabs>

      {/* Combined Stream Info */}
      {(streamConfig.video || streamConfig.screen) && (
        <div className="mt-4 p-3 bg-background/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">Active Sources</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            {streamConfig.video && <div>• Webcam: {webcamStream ? 'Active' : 'Connecting...'}</div>}
            {streamConfig.screen && <div>• Screen Share: {screenStream ? 'Active' : 'Connecting...'}</div>}
            {streamConfig.video && streamConfig.screen && (
              <div className="text-yellow-600 dark:text-yellow-400 mt-2">
                Note: Both webcam and screen share are active. Screen share will be the primary video source.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}