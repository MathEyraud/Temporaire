/**
 * HOOK useTableViews
 * ==================
 * 
 * Hook personnalisé pour gérer les vues de tableaux personnalisées.
 * Utilise React Query pour le cache et les mutations.
 * 
 * FONCTIONNALITÉS :
 * - Chargement automatique des vues de l'utilisateur
 * - Sélection de la vue par défaut au chargement
 * - CRUD complet (Create, Read, Update, Delete)
 * - Gestion des états de chargement et d'erreur
 * - Détection des modifications non sauvegardées
 * 
 * USAGE :
 * ```tsx
 * const {
 *   views,
 *   currentView,
 *   isLoading,
 *   selectView,
 *   createView,
 *   updateView,
 *   deleteView,
 * } = useTableViews(EntityType.MONDES)
 * ```
 * 
 * @file useTableViews.ts
 * @version 1.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  EntityType,
  TableView,
  TableViewsListResponse,
  CreateTableViewDto,
  UpdateTableViewDto,
  UseTableViewsReturn,
} from '@/types/table-views'

// ============================================================================
// CONSTANTES
// ============================================================================

/** Endpoint de base pour l'API des vues */
const TABLE_VIEWS_ENDPOINT = '/table-views'

/** Préfixe pour les clés de cache React Query */
const QUERY_KEY_PREFIX = 'table-views'

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook pour gérer les vues de tableaux personnalisées
 * 
 * @param entityType - Type d'entité pour lequel charger les vues
 * @param options - Options supplémentaires
 * @returns Objet contenant les données et fonctions de gestion des vues
 */
export function useTableViews(
  entityType: EntityType,
  options?: {
    /** Désactiver le chargement automatique */
    enabled?: boolean
    /** Callback appelé quand la vue change */
    onViewChange?: (view: TableView | null) => void
  }
): UseTableViewsReturn {
  const { enabled = true, onViewChange } = options || {}
  
  // Accès au client React Query pour l'invalidation du cache
  const queryClient = useQueryClient()
  
  // ==========================================
  // ÉTAT LOCAL
  // ==========================================
  
  /** Vue actuellement sélectionnée (null = toutes les colonnes) */
  const [currentView, setCurrentView] = useState<TableView | null>(null)
  
  /** Flag indiquant si les colonnes ont été modifiées depuis la sélection */
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  /** Flag pour savoir si la vue par défaut a déjà été appliquée */
  const [defaultApplied, setDefaultApplied] = useState(false)

  // ==========================================
  // CLÉ DE CACHE REACT QUERY
  // ==========================================
  
  /**
   * Clé de cache unique pour cette combinaison d'entité
   * Format : ['table-views', 'mondes']
   */
  const queryKey = useMemo(
    () => [QUERY_KEY_PREFIX, entityType],
    [entityType]
  )

  // ==========================================
  // QUERY : CHARGEMENT DES VUES
  // ==========================================
  
  /**
   * Query React Query pour charger les vues de l'utilisateur
   * 
   * COMPORTEMENT :
   * - Se déclenche automatiquement au montage (si enabled=true)
   * - Les données sont mises en cache pour éviter les appels redondants
   * - Se rafraîchit automatiquement en cas d'invalidation
   */
  const {
    data: viewsResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<TableViewsListResponse>({
    queryKey,
    queryFn: async () => {
      console.log(`📋 [useTableViews] Chargement des vues pour ${entityType}`)
      
      const response = await apiClient.get<TableViewsListResponse>(
        `${TABLE_VIEWS_ENDPOINT}?entityType=${entityType}`
      )
      
      console.log(`✅ [useTableViews] ${response.total} vue(s) chargée(s)`, response.data)
      return response
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - les vues changent rarement
    refetchOnWindowFocus: false,
  })

  // ==========================================
  // DONNÉES DÉRIVÉES
  // ==========================================
  
  /** Liste des vues (tableau vide si pas encore chargé) */
  const views = useMemo(
    () => viewsResponse?.data || [],
    [viewsResponse]
  )
  
  /** Vue par défaut de l'utilisateur (s'il en a défini une) */
  const defaultView = useMemo(
    () => views.find(v => v.isDefault) || null,
    [views]
  )
  
  /** Message d'erreur formaté */
  const error = useMemo(() => {
    if (!queryError) return null
    return queryError instanceof Error 
      ? queryError.message 
      : 'Une erreur est survenue lors du chargement des vues'
  }, [queryError])

  // ==========================================
  // EFFET : APPLICATION DE LA VUE PAR DÉFAUT
  // ==========================================
  
  /**
   * Applique automatiquement la vue par défaut au premier chargement
   * 
   * COMPORTEMENT :
   * - Se déclenche une seule fois après le chargement initial
   * - Ne se redéclenche pas si l'utilisateur change de vue manuellement
   * - Notifie le parent via onViewChange
   */
  useEffect(() => {
    // Ne rien faire si :
    // - Encore en chargement
    // - La vue par défaut a déjà été appliquée
    // - L'utilisateur a déjà sélectionné une vue manuellement
    if (isLoading || defaultApplied) return
    
    if (defaultView) {
      console.log(`🎯 [useTableViews] Application de la vue par défaut: "${defaultView.name}"`)
      setCurrentView(defaultView)
      onViewChange?.(defaultView)
    }
    
    setDefaultApplied(true)
  }, [isLoading, defaultView, defaultApplied, onViewChange])

  // ==========================================
  // MUTATION : CRÉATION D'UNE VUE
  // ==========================================
  
  const createMutation = useMutation({
    mutationFn: async (data: CreateTableViewDto) => {
      console.log('➕ [useTableViews] Création d\'une vue:', data)
      
      const response = await apiClient.post<TableView>(
        TABLE_VIEWS_ENDPOINT,
        data
      )
      
      console.log('✅ [useTableViews] Vue créée:', response)
      return response
    },
    onSuccess: (newView) => {
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey })
      
      // Sélectionner automatiquement la nouvelle vue
      setCurrentView(newView)
      setHasUnsavedChanges(false)
      onViewChange?.(newView)
    },
    onError: (error) => {
      console.error('❌ [useTableViews] Erreur création:', error)
    },
  })

  // ==========================================
  // MUTATION : MISE À JOUR D'UNE VUE
  // ==========================================
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTableViewDto }) => {
      console.log(`✏️ [useTableViews] Mise à jour de la vue ${id}:`, data)
      
      const response = await apiClient.patch<TableView>(
        `${TABLE_VIEWS_ENDPOINT}/${id}`,
        data
      )
      
      console.log('✅ [useTableViews] Vue mise à jour:', response)
      return response
    },
    onSuccess: (updatedView) => {
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey })
      
      // Mettre à jour la vue courante si c'est celle qui a été modifiée
      if (currentView?.id === updatedView.id) {
        setCurrentView(updatedView)
      }
      
      setHasUnsavedChanges(false)
      onViewChange?.(updatedView)
    },
    onError: (error) => {
      console.error('❌ [useTableViews] Erreur mise à jour:', error)
    },
  })

  // ==========================================
  // MUTATION : SUPPRESSION D'UNE VUE
  // ==========================================
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`🗑️ [useTableViews] Suppression de la vue ${id}`)
      
      await apiClient.delete(`${TABLE_VIEWS_ENDPOINT}/${id}`)
      
      console.log('✅ [useTableViews] Vue supprimée')
      return id
    },
    onSuccess: (deletedId) => {
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey })
      
      // Si la vue supprimée était la vue courante, revenir à "toutes les colonnes"
      if (currentView?.id === deletedId) {
        setCurrentView(null)
        onViewChange?.(null)
      }
    },
    onError: (error) => {
      console.error('❌ [useTableViews] Erreur suppression:', error)
    },
  })

  // ==========================================
  // FONCTIONS EXPOSÉES
  // ==========================================
  
  /**
   * Sélectionner une vue
   * @param view - Vue à sélectionner (null pour "toutes les colonnes")
   */
  const selectView = useCallback((view: TableView | null) => {
    console.log(`👆 [useTableViews] Sélection de la vue:`, view?.name || 'Toutes les colonnes')
    
    setCurrentView(view)
    setHasUnsavedChanges(false)
    onViewChange?.(view)
  }, [onViewChange])

  /**
   * Créer une nouvelle vue
   */
  const createView = useCallback(async (data: CreateTableViewDto): Promise<TableView> => {
    const result = await createMutation.mutateAsync(data)
    return result
  }, [createMutation])

  /**
   * Mettre à jour une vue existante
   */
  const updateView = useCallback(async (id: string, data: UpdateTableViewDto): Promise<TableView> => {
    const result = await updateMutation.mutateAsync({ id, data })
    return result
  }, [updateMutation])

  /**
   * Supprimer une vue
   */
  const deleteView = useCallback(async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id)
  }, [deleteMutation])

  /**
   * Définir une vue comme vue par défaut
   * Raccourci pour updateView avec isDefault: true
   */
  const setDefaultView = useCallback(async (id: string): Promise<void> => {
    await updateMutation.mutateAsync({ 
      id, 
      data: { isDefault: true } 
    })
  }, [updateMutation])

  /**
   * Marquer que les colonnes ont été modifiées
   * Appelé par le DataTable quand l'utilisateur change la visibilité des colonnes
   */
  const markAsModified = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  /**
   * Réinitialiser le flag de modifications
   */
  const clearModified = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  // ==========================================
  // RETOUR DU HOOK
  // ==========================================
  
  return {
    // Données
    views,
    currentView,
    defaultView,
    hasUnsavedChanges,
    
    // États
    isLoading,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error,
    
    // Actions
    selectView,
    createView,
    updateView,
    deleteView,
    setDefaultView,
    markAsModified,
    clearModified,
    refetch,
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default useTableViews
