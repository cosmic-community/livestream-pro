'use client'

import { useState } from 'react'
import { useStreamCategories } from '@/hooks/useStreamCategories'
import { StreamCategory } from '@/lib/cms-types'
import { Tag, Grid, List } from 'lucide-react'

interface StreamCategoriesProps {
  onCategorySelect?: (category: StreamCategory | null) => void
  selectedCategory?: StreamCategory | null
  showInactive?: boolean
  layout?: 'grid' | 'list' | 'pills'
  limit?: number
}

export default function StreamCategories({
  onCategorySelect,
  selectedCategory,
  showInactive = false,
  layout = 'pills',
  limit
}: StreamCategoriesProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(layout === 'pills' ? 'grid' : layout)
  
  const { categories, isLoading, error, getActiveCategories } = useStreamCategories(
    showInactive ? {} : { is_active: true },
    { limit: limit || 20, sort: 'title' }
  )

  const displayCategories = showInactive ? categories : getActiveCategories()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Categories</h3>
        </div>
        {layout === 'pills' ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted/50 rounded-full h-8 w-20"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-16"></div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">Failed to load categories: {error}</p>
      </div>
    )
  }

  if (displayCategories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No categories available</p>
      </div>
    )
  }

  const handleCategoryClick = (category: StreamCategory) => {
    if (onCategorySelect) {
      // If same category is clicked, deselect it
      if (selectedCategory?.id === category.id) {
        onCategorySelect(null)
      } else {
        onCategorySelect(category)
      }
    }
  }

  if (layout === 'pills') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Categories</h3>
          </div>
          {onCategorySelect && selectedCategory && (
            <button
              onClick={() => onCategorySelect(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((category) => {
            const isSelected = selectedCategory?.id === category.id
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-muted/50 hover:bg-muted text-foreground hover:shadow-md'
                }`}
                style={
                  !isSelected && category.metadata.color
                    ? {
                        backgroundColor: `${category.metadata.color}20`,
                        borderColor: `${category.metadata.color}40`,
                        color: category.metadata.color
                      }
                    : undefined
                }
              >
                {category.metadata.icon?.imgix_url && (
                  <img
                    src={`${category.metadata.icon.imgix_url}?w=32&h=32&fit=crop&auto=format,compress`}
                    alt={category.metadata.name}
                    className="w-4 h-4 object-cover rounded"
                  />
                )}
                <span>{category.metadata.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Stream Categories</h3>
          <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
            {displayCategories.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCategories.map((category) => {
            const isSelected = selectedCategory?.id === category.id
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-border hover:border-border/60 bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {category.metadata.icon?.imgix_url ? (
                    <img
                      src={`${category.metadata.icon.imgix_url}?w=64&h=64&fit=crop&auto=format,compress`}
                      alt={category.metadata.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: category.metadata.color || '#6b7280' }}
                    >
                      {category.metadata.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{category.metadata.name}</h4>
                    {category.metadata.color && (
                      <div
                        className="w-12 h-1 rounded-full mt-1"
                        style={{ backgroundColor: category.metadata.color }}
                      />
                    )}
                  </div>
                </div>
                {category.metadata.description && (
                  <p className="text-sm text-muted-foreground">{category.metadata.description}</p>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {displayCategories.map((category) => {
            const isSelected = selectedCategory?.id === category.id
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-border hover:border-border/60 bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {category.metadata.icon?.imgix_url ? (
                  <img
                    src={`${category.metadata.icon.imgix_url}?w=96&h=96&fit=crop&auto=format,compress`}
                    alt={category.metadata.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: category.metadata.color || '#6b7280' }}
                  >
                    {category.metadata.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{category.metadata.name}</h4>
                    {!category.metadata.is_active && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {category.metadata.description && (
                    <p className="text-sm text-muted-foreground">{category.metadata.description}</p>
                  )}
                  {category.metadata.color && (
                    <div
                      className="w-16 h-1 rounded-full mt-2"
                      style={{ backgroundColor: category.metadata.color }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}