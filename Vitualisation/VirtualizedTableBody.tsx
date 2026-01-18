// src/components/ui/DataTable/VirtualizedTableBody.tsx

"use client";

import { useRef, useCallback, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import TruncatedCell from './TruncatedCell'
import { 
  VirtualizedTableBodyProps, 
  ScrollPositionIndicatorProps,
  ColumnState 
} from './types'

// ============================================================================
// COMPOSANT D'INDICATEUR DE POSITION
// ============================================================================

/**
 * Affiche la position actuelle dans le scroll
 * Exemple : "Lignes 150-170 sur 5000"
 * 
 * Ce composant apparaît brièvement lors du scroll pour aider
 * l'utilisateur à se repérer dans un grand ensemble de données.
 */
function ScrollPositionIndicator({ 
  startIndex, 
  endIndex, 
  totalRows, 
  visible 
}: ScrollPositionIndicatorProps) {
  if (!visible || totalRows === 0) return null

  return (
    <div 
      className={`
        absolute top-2 right-2 z-10
        bg-gray-800 dark:bg-gray-700 
        text-white text-xs 
        px-3 py-1.5 rounded-full
        shadow-lg
        transition-opacity duration-300
        ${visible ? 'opacity-90' : 'opacity-0'}
      `}
    >
      Lignes {startIndex + 1}-{Math.min(endIndex + 1, totalRows)} sur {totalRows}
    </div>
  )
}

// ============================================================================
// COMPOSANT LIGNE VIRTUALISÉE
// ============================================================================

/**
 * Composant pour une ligne individuelle du tableau virtualisé
 * Mémoïsé pour éviter les re-renders inutiles lors du scroll
 */
interface VirtualizedRowProps<T> {
  item: T
  index: number
  columns: ColumnState[]
  style: React.CSSProperties
  onRowClick?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (id: number) => void
  showActions: boolean
  allowDelete: boolean
  allowEdit: boolean
  allowClick: boolean
  isDeleting: boolean
  getRowPrefetchProps?: (item: T) => Record<string, unknown>
}

function VirtualizedRow<T extends { id: number }>({
  item,
  index,
  columns,
  style,
  onRowClick,
  onEdit,
  onDelete,
  showActions,
  allowDelete,
  allowEdit,
  allowClick,
  isDeleting,
  getRowPrefetchProps,
}: VirtualizedRowProps<T>) {
  // Props de prefetch si configuré
  const prefetchProps = getRowPrefetchProps ? getRowPrefetchProps(item) : {}

  // Gestionnaire de clic sur la ligne
  const handleRowClick = useCallback(() => {
    if (allowClick && onRowClick) {
      onRowClick(item)
    }
  }, [allowClick, onRowClick, item])

  // Gestionnaire d'édition
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Empêche le clic sur la ligne
    if (onEdit) onEdit(item)
  }, [onEdit, item])

  // Gestionnaire de suppression
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Empêche le clic sur la ligne
    if (onDelete) onDelete(item.id)
  }, [onDelete, item.id])

  return (
    <tr 
      style={style}
      className={`
        border-b border-gray-200 dark:border-gray-700 
        ${allowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
        ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}
        ${isDeleting ? 'opacity-50' : ''}
      `}
      onClick={handleRowClick}
      {...prefetchProps}
    >
      {/* Cellules de données */}
      {columns.filter(col => col.visible).map((column) => {
        // Récupération de la valeur brute
        const rawValue = (item as Record<string, unknown>)[column.key]
        
        // Rendu personnalisé ou valeur par défaut
        const cellContent = column.render 
          ? column.render(item) 
          : (rawValue !== null && rawValue !== undefined ? String(rawValue) : '-')

        return (
          <td 
            key={column.key}
            className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
            style={{ 
              width: column.width ? `${column.width}px` : 'auto',
              minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
              maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
            }}
          >
            <TruncatedCell content={cellContent} />
          </td>
        )
      })}

      {/* Colonne des actions */}
      {showActions && (
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {/* Bouton Modifier */}
            {allowEdit && onEdit && (
              <button
                onClick={handleEdit}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Modifier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Bouton Supprimer */}
            {allowDelete && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                title="Supprimer"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 dark:border-red-400 border-t-transparent" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL - CORPS DU TABLEAU VIRTUALISÉ
// ============================================================================

/**
 * VirtualizedTableBody - Gère le rendu virtualisé des lignes du tableau
 * 
 * FONCTIONNEMENT :
 * 1. Calcule quelles lignes sont visibles dans la zone de scroll
 * 2. Ne rend QUE ces lignes + un buffer (overscan)
 * 3. Utilise des spacers pour maintenir la hauteur totale du scroll
 * 4. Recycle les éléments DOM lors du scroll
 * 
 * AVANTAGES :
 * - DOM léger même avec 5000+ lignes
 * - Scroll fluide
 * - Mémoire optimisée
 * 
 * INTÉGRATION AVEC INFINITE LOADING :
 * - Détecte quand l'utilisateur approche de la fin des données chargées
 * - Appelle onNearEnd() pour déclencher le chargement de la page suivante
 */
function VirtualizedTableBody<T extends { id: number }>({
  data,
  columns,
  virtualizationConfig,
  containerHeight,
  onRowClick,
  onEdit,
  onDelete,
  showActions = false,
  allowDelete = false,
  allowEdit = false,
  allowClick = false,
  deletingId = null,
  onNearEnd,
  hasMore = false,
  isLoadingMore = false,
  totalItems = 0,
  getRowPrefetchProps,
}: VirtualizedTableBodyProps<T>) {
  
  // ==========================================
  // RÉFÉRENCES ET ÉTAT
  // ==========================================
  
  // Référence vers le conteneur scrollable
  const parentRef = useRef<HTMLDivElement>(null)
  
  // État pour l'affichage de l'indicateur de position
  const [showIndicator, setShowIndicator] = useState(false)
  const indicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ==========================================
  // CONFIGURATION DU VIRTUALIZER
  // ==========================================
  
  /**
   * useVirtualizer de @tanstack/react-virtual
   * 
   * Paramètres clés :
   * - count : nombre total d'éléments
   * - getScrollElement : retourne l'élément scrollable
   * - estimateSize : retourne la hauteur estimée de chaque ligne
   * - overscan : nombre de lignes à pré-rendre hors de la vue
   */
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => virtualizationConfig.rowHeight,
    overscan: virtualizationConfig.overscan,
  })

  // Récupère les éléments virtuels (lignes à rendre)
  const virtualRows = virtualizer.getVirtualItems()
  
  // Hauteur totale de tous les éléments (pour le scroll)
  const totalSize = virtualizer.getTotalSize()

  // ==========================================
  // DÉTECTION DE FIN DE SCROLL (INFINITE LOADING)
  // ==========================================
  
  /**
   * Vérifie si on approche de la fin des données chargées
   * et déclenche le chargement de la page suivante si nécessaire
   */
  useEffect(() => {
    if (!onNearEnd || !hasMore || isLoadingMore) return

    const lastVirtualRow = virtualRows[virtualRows.length - 1]
    if (!lastVirtualRow) return

    // Si on est proche de la fin (selon le seuil configuré)
    const threshold = virtualizationConfig.scrollThreshold
    const isNearEnd = lastVirtualRow.index >= data.length - threshold

    if (isNearEnd) {
      onNearEnd()
    }
  }, [virtualRows, data.length, onNearEnd, hasMore, isLoadingMore, virtualizationConfig.scrollThreshold])

  // ==========================================
  // GESTION DE L'INDICATEUR DE POSITION
  // ==========================================
  
  /**
   * Affiche l'indicateur lors du scroll et le cache après un délai
   */
  const handleScroll = useCallback(() => {
    if (!virtualizationConfig.showScrollIndicator) return

    // Afficher l'indicateur
    setShowIndicator(true)

    // Annuler le timeout précédent
    if (indicatorTimeoutRef.current) {
      clearTimeout(indicatorTimeoutRef.current)
    }

    // Cacher après 1.5 secondes d'inactivité
    indicatorTimeoutRef.current = setTimeout(() => {
      setShowIndicator(false)
    }, 1500)
  }, [virtualizationConfig.showScrollIndicator])

  // Attacher l'écouteur de scroll
  useEffect(() => {
    const scrollElement = parentRef.current
    if (!scrollElement) return

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Nettoyage du timeout
  useEffect(() => {
    return () => {
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current)
      }
    }
  }, [])

  // ==========================================
  // CALCUL DES INDICES VISIBLES
  // ==========================================
  
  const firstVisibleIndex = virtualRows[0]?.index ?? 0
  const lastVisibleIndex = virtualRows[virtualRows.length - 1]?.index ?? 0

  // ==========================================
  // RENDU
  // ==========================================

  // Cas : aucune donnée
  if (data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 dark:text-gray-400"
        style={{ height: containerHeight }}
      >
        Aucune donnée à afficher
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Indicateur de position dans le scroll */}
      <ScrollPositionIndicator
        startIndex={firstVisibleIndex}
        endIndex={lastVisibleIndex}
        totalRows={totalItems > 0 ? totalItems : data.length}
        visible={showIndicator && data.length > 50}
      />

      {/* Conteneur scrollable */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        {/* Tableau avec hauteur virtuelle */}
        <table className="w-full" style={{ height: totalSize }}>
          <tbody
            className="relative"
            style={{
              height: totalSize,
              width: '100%',
            }}
          >
            {virtualRows.map((virtualRow) => {
              const item = data[virtualRow.index]
              if (!item) return null

              return (
                <VirtualizedRow
                  key={item.id}
                  item={item}
                  index={virtualRow.index}
                  columns={columns}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'table-row',
                  }}
                  onRowClick={onRowClick}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  showActions={showActions}
                  allowDelete={allowDelete}
                  allowEdit={allowEdit}
                  allowClick={allowClick}
                  isDeleting={deletingId === item.id}
                  getRowPrefetchProps={getRowPrefetchProps}
                />
              )
            })}
          </tbody>
        </table>

        {/* Indicateur de chargement en cours */}
        {isLoadingMore && (
          <div className="sticky bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-3 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Chargement des données...
            </div>
          </div>
        )}
      </div>

      {/* Compteur en bas du tableau */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          <span className="font-medium">{data.length}</span> éléments chargés
          {totalItems > 0 && totalItems > data.length && (
            <span> sur <span className="font-medium">{totalItems}</span> au total</span>
          )}
          {!hasMore && data.length > 0 && (
            <span className="ml-2 text-green-600 dark:text-green-400">• Tout chargé</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default VirtualizedTableBody
