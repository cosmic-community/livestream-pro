'use client'

import { useEffect } from 'react'

interface LiveChatProps {
  widgetId: string
  streamId: string
}

export default function LiveChat({ widgetId, streamId }: LiveChatProps) {
  useEffect(() => {
    if (!widgetId || widgetId === '12345678') {
      // Don't load LiveChat with default/demo widget ID
      return
    }

    // Load LiveChat widget
    const script = document.createElement('script')
    script.innerHTML = `
      window.__lc = window.__lc || {};
      window.__lc.license = ${widgetId};
      window.__lc.group = '${streamId}';
      (function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))
    `
    document.head.appendChild(script)

    return () => {
      // Cleanup LiveChat widget
      if (window.LiveChatWidget) {
        window.LiveChatWidget.call('destroy')
      }
    }
  }, [widgetId, streamId])

  if (!widgetId || widgetId === '12345678') {
    return (
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-3">Live Chat</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-muted-foreground text-sm">
            LiveChat widget not configured. Add your widget ID in site settings to enable live chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-3">Live Chat</h3>
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">
          LiveChat widget is loading...
        </p>
      </div>
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    LiveChatWidget?: any
    __lc?: any
  }
}