// src/components/ui/DataTable/DataTable.tsx

"use client";

// ==========================================
// IMPORTS
// ==========================================
import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react'
import { useGetPaginatedData, useDeleteData } from '@/hooks/useApi'
import { useInfiniteData } from '@/hooks/useInfiniteData'
import { PaginationParams, FilterGroup } from '@/types/api'

// Composants internes - Chaque composant gère une fonctionnalité spécifique
import TableHeader from './TableHeader'
import TableFilters, { TableRowFilters } from './TableFilters'
import ColumnManager from './ColumnManager'
import TableToolbar from './TableToolbar'
import Pagination from './Pagination'
import InfiniteScroll from './InfiniteScroll'
import VirtualizedTableBody from './VirtualizedTableBody'  // NOUVEAU
import { AdvancedFilterBuilder } from './AdvancedFilterBuilder'
import TruncatedCell from './TruncatedCell'

// Types TypeScript
import { 
  DataTableProps, 
  ColumnState, 
  SortConfig, 
  PaginationMode,
  VirtualizationConfig,
  DEFAULT_VIRTUALIZATION_CONFIG 
} from './types'
import { useTablePrefetch } from '@/hooks/usePrefetch';

/**
 * COMPOSANT PRINCIPAL DATATABLE
 * 
 * Ce composant est le cœur du système de tableau. Il gère :
 * - L'état global de toutes les fonctionnalités
 * - La coordination entre les sous-composants
 * - Les appels API pour récupérer les données
 * - La synchronisation des filtres, tri et pagination
 * 
 * MODES DE PAGINATION :
 * - 'page' (défaut) : Navigation classique avec boutons de page
 * - 'infinite' : Scroll infini avec chargement automatique
 * - 'virtualized' : Scroll infini avec virtualisation (recommandé pour 100+ lignes)
 * 
 * Le composant utilise des génériques TypeScript (<T extends { id: number }>)
 * pour être réutilisable avec différents types de données.
 */
function DataTable<T extends { id: number }>({
  // ==========================================
  // PROPS DE CONFIGURATION DE BASE
  // ==========================================
  title,
  endpoint,
  queryKey,
  columns,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  
  // ==========================================
  // PROPS DE MODE DE PAGINATION
  // ==========================================
  paginationMode = 'page',
  maxInfiniteItems,
  showInfiniteEndMessage = true,
  
  // ==========================================
  // PROPS DE VIRTUALISATION (NOUVEAU)
  // ==========================================
  virtualizationConfig: virtualizationConfigProp,
  
  // ==========================================
  // PROPS DE FONCTIONNALITÉS OPTIONNELLES
  // ==========================================
  allowDelete = false,
  allowEdit = false,
  allowClick = false,
  allowCreate = false,
  deleteConfirmMessage = "Êtes-vous sûr de vouloir supprimer cet élément ?",
  allowSorting = true,
  allowColumnResize = true,
  allowColumnReorder = true,
  
  // ==========================================
  // PROPS DE FILTRES
  // ==========================================
  showFiltersInTable = true,
  showFiltersInPanel = false,
  useAdvancedFilters = false,
  showAdvancedFilterBuilder = false,
  componentFilters,
  
  // ==========================================
  // PROPS DE TRI
  // ==========================================
  defaultSort,
  
  // ==========================================
  // PROPS D'AFFICHAGE
  // ==========================================
  fixedHeight,
  className,
  
  // ==========================================
  // PROPS DE PREFETCH
  // ==========================================
  prefetchConfig,
  
  // ==========================================
  // CALLBACKS
  // ==========================================
  onRowClick,
  onEdit,
  onCreate,
  onSort,
  onFiltersChange,
}: DataTableProps<T>) {
  
  // ==========================================
  // ÉTAT LOCAL - GESTION DES COLONNES
  // ==========================================
  
  const [columnSettings, setColumnSettings] = useState<ColumnState[]>(() => 
    columns.map((col, index) => ({
      ...col,
      visible: col.defaultVisible !== false,
      order: col.order ?? index,
      width: col.width,
    }))
  )
  
  const [showColumnManager, setShowColumnManager] = useState(false)
  
  // ==========================================
  // ÉTAT LOCAL - SUPPRESSION
  // ==========================================
  
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  // ==========================================
  // ÉTAT LOCAL - FILTRES
  // ==========================================
  
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [userComplexFilters, setUserComplexFilters] = useState<FilterGroup | undefined>()
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSimpleFilters, setShowSimpleFilters] = useState(false)

  // ==========================================
  // ÉTAT LOCAL - TRI ET PAGINATION
  // ==========================================
  
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(defaultSort)
  
  const [paginationParams, setPaginationParams] = useState<PaginationParams>({
    page: 1,
    limit: defaultPageSize,
    filters: {},
    sortBy: defaultSort ? defaultSort.key : undefined,
    sortOrder: defaultSort ? defaultSort.direction : undefined
  })

  // ==========================================
  // RÉFÉRENCES
  // ==========================================
  
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // CONFIGURATION DE VIRTUALISATION FUSIONNÉE
  // ==========================================
  
  /**
   * Fusionne la configuration fournie avec les valeurs par défaut
   * Permet de personnaliser uniquement les valeurs souhaitées
   */
  const virtualizationConfig = useMemo<Required<VirtualizationConfig>>(() => ({
    ...DEFAULT_VIRTUALIZATION_CONFIG,
    ...virtualizationConfigProp,
    containerHeight: virtualizationConfigProp?.containerHeight 
      ?? fixedHeight 
      ?? DEFAULT_VIRTUALIZATION_CONFIG.containerHeight,
  }), [virtualizationConfigProp, fixedHeight])

  // ==========================================
  // PREFETCH
  // ==========================================
  
  const { getRowPrefetchProps, resetPrefetchCache } = useTablePrefetch(prefetchConfig);

  useEffect(() => {
    resetPrefetchCache();
  }, [paginationParams, resetPrefetchCache]);

  // ==========================================
  // CONSTRUCTION DE LA CLÉ DE CACHE
  // ==========================================
  
  const cacheKey = useMemo(() => {
    const key = [...queryKey]
    key.push(useAdvancedFilters ? 'advanced' : 'legacy')
    
    const orderedParams = {
      page: paginationParams.page,
      limit: paginationParams.limit,
      sortBy: paginationParams.sortBy || null,
      sortOrder: paginationParams.sortOrder || null,
      filters: paginationParams.filters || {}
    }
    key.push(JSON.stringify(orderedParams))
    
    if (componentFilters) {
      key.push('comp-filters', JSON.stringify(componentFilters))
    }
    
    if (userComplexFilters) {
      key.push('user-filters', JSON.stringify(userComplexFilters))
    }
    
    return key
  }, [queryKey, paginationParams, componentFilters, userComplexFilters, useAdvancedFilters])

  // ==========================================
  // HOOKS DE DONNÉES - MODE PAGINATION CLASSIQUE
  // ==========================================
  
  const paginatedQuery = useGetPaginatedData<T>(
    cacheKey,
    endpoint,
    paginationParams,
    {
      componentFilters,
      userComplexFilters,
      useAdvancedFilters
    }
  )

  // ==========================================
  // HOOKS DE DONNÉES - MODE INFINITE / VIRTUALIZED
  // ==========================================
  
  /**
   * Ce hook est utilisé à la fois pour le mode 'infinite' et 'virtualized'
   * Les deux modes chargent les données de la même manière (progressivement)
   * La différence est dans le RENDU, pas dans le chargement
   */
  const infiniteQuery = useInfiniteData<T>(
    queryKey,
    endpoint,
    {
      limit: paginationParams.limit,
      filters: paginationParams.filters,
      sortBy: paginationParams.sortBy,
      sortOrder: paginationParams.sortOrder
    },
    {
      componentFilters,
      userComplexFilters,
      useAdvancedFilters,
      maxItems: maxInfiniteItems
    }
  )

  // ==========================================
  // SÉLECTION DES DONNÉES SELON LE MODE
  // ==========================================
  
  /**
   * Détection des différents modes de pagination
   */
  const isInfiniteMode = paginationMode === 'infinite'
  const isVirtualizedMode = paginationMode === 'virtualized'
  const isInfiniteOrVirtualized = isInfiniteMode || isVirtualizedMode
  
  // Données à afficher (unifiées selon le mode)
  const data: T[] = isInfiniteOrVirtualized 
    ? infiniteQuery.data 
    : (paginatedQuery.data?.data || [])
  
  // État de chargement initial
  const isLoading = isInfiniteOrVirtualized 
    ? infiniteQuery.isLoading 
    : paginatedQuery.isLoading
  
  // Erreur éventuelle
  const error = isInfiniteOrVirtualized 
    ? infiniteQuery.error 
    : paginatedQuery.error
  
  // Fonction de rechargement
  const refetch = isInfiniteOrVirtualized 
    ? infiniteQuery.refetch 
    : paginatedQuery.refetch

  // Données paginées (mode page uniquement)
  const paginatedData = paginatedQuery.data

  // ==========================================
  // HOOK DE SUPPRESSION
  // ==========================================
  
  const deleteAuth = useDeleteData(
    (id) => `${endpoint}/${id}`,
    queryKey
  )

  // ==========================================
  // FONCTIONS - GESTION DES COLONNES
  // ==========================================
  
  const toggleColumnVisibility = useCallback((key: string) => {
    setColumnSettings(prev => 
      prev.map(col => 
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    )
  }, [])

  const moveColumn = useCallback((fromKey: string, toKey: string) => {
    setColumnSettings(prev => {
      const fromIndex = prev.findIndex(col => col.key === fromKey)
      const toIndex = prev.findIndex(col => col.key === toKey)
      
      if (fromIndex === -1 || toIndex === -1) return prev
      
      const newColumns = [...prev]
      const [removed] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, removed)
      
      return newColumns.map((col, index) => ({ ...col, order: index }))
    })
  }, [])

  const resetColumns = useCallback(() => {
    setColumnSettings(
      columns.map((col, index) => ({
        ...col,
        visible: col.defaultVisible !== false,
        order: col.order ?? index,
        width: col.width,
      }))
    )
  }, [columns])

  // ==========================================
  // FONCTIONS - TRI
  // ==========================================
  
  const handleSort = useCallback((key: string) => {
    if (!allowSorting) return
    
    setSortConfig(prev => {
      const newDirection = prev?.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC'
      const newConfig = { key, direction: newDirection as 'ASC' | 'DESC' }
      
      onSort?.(newConfig)
      
      return newConfig
    })
  }, [allowSorting, onSort])

  // Synchroniser le tri avec les paramètres de pagination
  useEffect(() => {
    setPaginationParams(prev => ({
      ...prev,
      page: 1,
      sortBy: sortConfig?.key,
      sortOrder: sortConfig?.direction
    }))
  }, [sortConfig])

  // ==========================================
  // FONCTIONS - PAGINATION
  // ==========================================
  
  const handlePageChange = useCallback((page: number) => {
    setPaginationParams(prev => ({ ...prev, page }))
  }, [])

  const handlePageSizeChange = useCallback((limit: number) => {
    setPaginationParams(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  // ==========================================
  // FONCTIONS - FILTRES
  // ==========================================
  
  const handleFilterChange = useCallback((key: string, value: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      if (value) {
        newFilters[key] = value
      } else {
        delete newFilters[key]
      }
      onFiltersChange?.(newFilters)
      return newFilters
    })
  }, [onFiltersChange])

  // Synchroniser les filtres avec les paramètres de pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPaginationParams(prev => ({
        ...prev,
        page: 1,
        filters: columnFilters
      }))
    }, 300) // Debounce

    return () => clearTimeout(timeoutId)
  }, [columnFilters])

  // ==========================================
  // FONCTIONS - SUPPRESSION
  // ==========================================
  
  const handleDeleteConfirm = useCallback(async (id: number) => {
    if (!confirm(deleteConfirmMessage)) return
    
    setDeletingId(id)
    try {
      await deleteAuth.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }, [deleteConfirmMessage, deleteAuth])

  // ==========================================
  // COLONNES VISIBLES (TRIÉES)
  // ==========================================
  
  const visibleColumns = useMemo(() => 
    columnSettings
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order),
    [columnSettings]
  )

  // ==========================================
  // RENDU - ÉTATS DE CHARGEMENT ET ERREUR
  // ==========================================

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <TableToolbar
          title={title}
          allowCreate={allowCreate}
          onCreate={onCreate}
          onRefresh={refetch}
          isRefreshing={false}
          showColumnManager={() => setShowColumnManager(true)}
          showFiltersPanel={showFiltersInPanel}
          onToggleFiltersPanel={() => setShowSimpleFilters(!showSimpleFilters)}
          showAdvancedFilterBuilder={showAdvancedFilterBuilder}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          isAdvancedFiltersActive={!!userComplexFilters}
          totalItems={0}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <TableToolbar
          title={title}
          allowCreate={allowCreate}
          onCreate={onCreate}
          onRefresh={refetch}
          isRefreshing={false}
          showColumnManager={() => setShowColumnManager(true)}
          totalItems={0}
        />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">
            Erreur lors du chargement des données. Veuillez réessayer.
          </p>
          <button 
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre d'outils */}
      <TableToolbar
        title={title}
        allowCreate={allowCreate}
        onCreate={onCreate}
        onRefresh={refetch}
        isRefreshing={paginatedQuery.isFetching || infiniteQuery.isFetching}
        showColumnManager={() => setShowColumnManager(true)}
        showFiltersPanel={showFiltersInPanel}
        onToggleFiltersPanel={() => setShowSimpleFilters(!showSimpleFilters)}
        showAdvancedFilterBuilder={showAdvancedFilterBuilder}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        isAdvancedFiltersActive={!!userComplexFilters}
        totalItems={
          isInfiniteOrVirtualized 
            ? infiniteQuery.totalItems 
            : (paginatedData?.total ?? 0)
        }
      />

      {/* Panneau de filtres simples */}
      {showFiltersInPanel && showSimpleFilters && (
        <TableFilters
          columns={visibleColumns}
          filters={columnFilters}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Constructeur de filtres avancés */}
      {showAdvancedFilterBuilder && showAdvancedFilters && (
        <AdvancedFilterBuilder
          columns={visibleColumns}
          onFiltersChange={setUserComplexFilters}
          initialFilters={userComplexFilters}
        />
      )}

      {/* Message si aucune donnée */}
      {data.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Aucune donnée
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aucun élément ne correspond à vos critères.
            </p>
            {allowCreate && onCreate && (
              <button
                onClick={onCreate}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Créer un élément
              </button>
            )}
          </div>
        </div>
      )}

      {/* Container du tableau */}
      {data.length > 0 && (
        <div 
          ref={tableContainerRef}
          className={`
            bg-white dark:bg-gray-900 
            rounded-lg shadow 
            border border-gray-200 dark:border-gray-700
            ${!isVirtualizedMode ? 'overflow-x-auto' : 'overflow-hidden'}
          `}
        >
          {/* ==========================================
              MODE STANDARD (page et infinite)
              ========================================== */}
          {!isVirtualizedMode && (
            <div 
              style={fixedHeight ? { maxHeight: fixedHeight, overflowY: 'auto' } : undefined}
            >
              <table className="w-full">
                {/* En-têtes avec tri et filtres */}
                <TableHeader
                  columns={visibleColumns}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  allowSorting={allowSorting}
                  allowColumnResize={allowColumnResize}
                  allowColumnReorder={allowColumnReorder}
                  onColumnResize={(key, width) => {
                    setColumnSettings(prev => 
                      prev.map(col => col.key === key ? { ...col, width } : col)
                    )
                  }}
                  onColumnReorder={moveColumn}
                  showFilters={showFiltersInTable}
                  filters={columnFilters}
                  onFilterChange={handleFilterChange}
                  showActions={allowDelete || allowEdit}
                />

                {/* Corps du tableau */}
                <tbody>
                  {data.map((item, index) => (
                    <tr 
                      key={item.id}
                      className={`
                        border-b border-gray-200 dark:border-gray-700 
                        ${allowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                        ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}
                      `}
                      onClick={() => allowClick && onRowClick?.(item)}
                      {...getRowPrefetchProps(item)}
                    >
                      {visibleColumns.map((column) => {
                        const rawValue = (item as Record<string, unknown>)[column.key]
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
                      {(allowDelete || allowEdit) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {allowEdit && onEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(item)
                                }}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Modifier"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            
                            {allowDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteConfirm(item.id)
                                }}
                                disabled={deletingId === item.id}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deletingId === item.id ? (
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
                  ))}
                </tbody>
              </table>

              {/* Infinite Scroll (mode infinite seulement) */}
              {isInfiniteMode && (
                <InfiniteScroll
                  onLoadMore={() => infiniteQuery.fetchNextPage()}
                  hasMore={infiniteQuery.hasNextPage}
                  isLoading={infiniteQuery.isFetchingNextPage}
                  showEndMessage={showInfiniteEndMessage}
                  loadingText="Chargement des données..."
                  endText={`${infiniteQuery.loadedItems} éléments chargés sur ${infiniteQuery.totalItems}`}
                />
              )}
            </div>
          )}

          {/* ==========================================
              MODE VIRTUALISÉ
              ========================================== */}
          {isVirtualizedMode && (
            <>
              {/* En-têtes fixes (hors du scroll) */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHeader
                    columns={visibleColumns}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    allowSorting={allowSorting}
                    allowColumnResize={allowColumnResize}
                    allowColumnReorder={allowColumnReorder}
                    onColumnResize={(key, width) => {
                      setColumnSettings(prev => 
                        prev.map(col => col.key === key ? { ...col, width } : col)
                      )
                    }}
                    onColumnReorder={moveColumn}
                    showFilters={showFiltersInTable}
                    filters={columnFilters}
                    onFilterChange={handleFilterChange}
                    showActions={allowDelete || allowEdit}
                  />
                </table>
              </div>

              {/* Corps virtualisé */}
              <VirtualizedTableBody
                data={data}
                columns={columnSettings}
                virtualizationConfig={virtualizationConfig}
                containerHeight={fixedHeight ?? virtualizationConfig.containerHeight}
                onRowClick={allowClick ? onRowClick : undefined}
                onEdit={allowEdit ? onEdit : undefined}
                onDelete={allowDelete ? handleDeleteConfirm : undefined}
                showActions={allowDelete || allowEdit}
                allowDelete={allowDelete}
                allowEdit={allowEdit}
                allowClick={allowClick}
                deletingId={deletingId}
                onNearEnd={() => infiniteQuery.fetchNextPage()}
                hasMore={infiniteQuery.hasNextPage}
                isLoadingMore={infiniteQuery.isFetchingNextPage}
                totalItems={infiniteQuery.totalItems}
                getRowPrefetchProps={getRowPrefetchProps}
              />
            </>
          )}
        </div>
      )}

      {/* Pagination (mode page uniquement) */}
      {!isInfiniteOrVirtualized && paginatedData && data.length > 0 && (
        <Pagination
          currentPage={paginatedData.page}
          totalPages={paginatedData.totalPages}
          totalItems={paginatedData.total}
          pageSize={paginationParams.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}

      {/* Indicateur de compteur (mode infinite sans virtualisation) */}
      {isInfiniteMode && !isVirtualizedMode && data.length > 0 && !infiniteQuery.isFetchingNextPage && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
            <span className="font-medium">{infiniteQuery.loadedItems}</span> éléments affichés
            {infiniteQuery.totalItems > 0 && (
              <span> sur <span className="font-medium">{infiniteQuery.totalItems}</span> au total</span>
            )}
          </div>
        </div>
      )}

      {/* Gestionnaire de colonnes (Modal) */}
      <ColumnManager
        columns={columnSettings}
        onToggleVisibility={toggleColumnVisibility}
        onMoveColumn={moveColumn}
        onResetColumns={resetColumns}
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />
    </div>
  )
}

// ==========================================
// EXPORT
// ==========================================

export default memo(DataTable) as typeof DataTable

export type { 
  DataTableProps, 
  ColumnConfig, 
  SortConfig, 
  PaginationMode,
  VirtualizationConfig 
} from './types'
