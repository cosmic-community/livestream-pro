import { SiteSettings } from '@/types'

interface MaintenanceModeProps {
  siteSettings: SiteSettings
}

export default function MaintenanceMode({ siteSettings }: MaintenanceModeProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          We'll be back soon!
        </h1>
        <div 
          className="text-muted-foreground mb-6 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: siteSettings.metadata.maintenance_message || 
                    '<p>We\'re performing scheduled maintenance. Please check back in a few hours.</p>' 
          }}
        />
        {siteSettings.metadata.contact_email && (
          <div className="text-sm text-muted-foreground">
            Questions? Contact us at{' '}
            <a 
              href={`mailto:${siteSettings.metadata.contact_email}`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {siteSettings.metadata.contact_email}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}