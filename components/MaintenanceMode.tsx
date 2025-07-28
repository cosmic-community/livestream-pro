'use client'

import { SiteSettings } from '@/types'

interface MaintenanceModeProps {
  siteSettings: SiteSettings
}

export default function MaintenanceMode({ siteSettings }: MaintenanceModeProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8 max-w-2xl mx-auto">
        {/* Maintenance Icon */}
        <div className="text-8xl mb-8">🔧</div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-6">
          We'll be back soon!
        </h1>
        
        {/* Maintenance Message */}
        <div className="prose prose-lg dark:prose-invert mx-auto mb-8">
          {siteSettings.metadata.maintenance_message ? (
            <div 
              className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: siteSettings.metadata.maintenance_message 
              }}
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              We're currently performing scheduled maintenance to improve your experience. 
              Please check back in a few hours.
            </p>
          )}
        </div>

        {/* Contact Information */}
        {siteSettings.metadata.contact_email && (
          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
            <p className="text-muted-foreground text-sm mb-3">
              If you have any urgent questions or concerns, please contact us:
            </p>
            <a
              href={`mailto:${siteSettings.metadata.contact_email}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              📧 {siteSettings.metadata.contact_email}
            </a>
          </div>
        )}

        {/* Status Updates */}
        <div className="text-sm text-muted-foreground">
          <p>Follow us for real-time updates:</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
              All systems operational except streaming
            </span>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Estimated completion:</strong> Maintenance typically takes 2-4 hours
          </p>
        </div>
      </div>
    </div>
  )
}