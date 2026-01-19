# 🎯 Vues de Tableaux Personnalisées - Implémentation Frontend

## 📋 Résumé

Cette implémentation permet aux utilisateurs de créer et gérer des **vues personnalisées** pour les tableaux de l'application. Une vue sauvegarde une configuration de colonnes visibles que l'utilisateur peut réappliquer à tout moment.

## 🏗️ Architecture

```
src/
├── types/
│   └── table-views.ts              # Types TypeScript complets
│
├── hooks/
│   └── useTableViews.ts            # Hook React Query (CRUD + état)
│
└── components/ui/TableViews/
    ├── index.ts                    # Exports centralisés
    ├── ViewSelector.tsx            # Dropdown de sélection des vues
    ├── ViewSaveModal.tsx           # Modal création/édition
    └── ViewDeleteModal.tsx         # Modal confirmation suppression
```

## 🚀 Installation

### 1. Copier les fichiers

```bash
# Types
cp types/table-views.ts → src/types/

# Hook
cp hooks/useTableViews.ts → src/hooks/

# Composants
cp components/ui/TableViews/* → src/components/ui/TableViews/
```

### 2. Vérifier les imports

Les fichiers utilisent ces imports qui doivent exister dans ton projet :
- `@/lib/api-client` → Client Axios singleton
- `@/types/table-views` → Types créés ci-dessus
- `@tanstack/react-query` → React Query v5

## 📖 Utilisation

### Option A : Composition (Recommandée)

Utiliser le hook `useTableViews` dans ton composant métier :

```tsx
import { useTableViews, ViewSelector, ViewSaveModal, ViewDeleteModal, EntityType } from '@/components/ui/TableViews'

function ListeMonde() {
  const {
    views,
    currentView,
    hasUnsavedChanges,
    isLoading,
    selectView,
    createView,
    updateView,
    deleteView,
  } = useTableViews(EntityType.MONDES)

  return (
    <>
      <ViewSelector
        entityType={EntityType.MONDES}
        views={views}
        currentView={currentView}
        hasUnsavedChanges={hasUnsavedChanges}
        isLoading={isLoading}
        onViewChange={selectView}
        onSaveClick={() => setIsSaveModalOpen(true)}
        onEditView={(view) => { /* ... */ }}
        onDeleteView={(view) => { /* ... */ }}
        onSetDefault={(view) => { /* ... */ }}
      />
      
      <DataTable columns={/* colonnes filtrées selon currentView */} />
    </>
  )
}
```

Voir `examples/datatable_monde_with_views.example.tsx` pour un exemple complet.

### Option B : Intégration dans DataTable

Modifier `DataTable.tsx` pour accepter les props de vues et gérer tout en interne.
Cette approche nécessite plus de modifications mais offre une utilisation plus simple.

## 🔧 Modifications requises dans DataTable

Pour que le système fonctionne, le `DataTable` doit exposer un callback quand les colonnes changent :

```typescript
// Dans DataTable/types.ts
interface DataTableProps<T> {
  // ... props existantes ...
  
  /** Callback appelé quand les colonnes sont modifiées */
  onColumnSettingsChange?: (columns: ColumnState[]) => void
}

// Dans DataTable.tsx
useEffect(() => {
  if (onColumnSettingsChange) {
    onColumnSettingsChange(columnSettings)
  }
}, [columnSettings, onColumnSettingsChange])
```

## 🎨 Design UX (Design B)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Mondes                                                                  │
│                                                                             │
│  [Vue: Ma vue complète ▼] [💾 Sauvegarder]    [🔍] [⚙️ Colonnes] [➕] [📥] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Nom          │ Description      │ Statut    │ Actions                      │
```

**Dropdown ouvert :**
```
┌────────────────────────────────────────┐
│ 🔍 Rechercher une vue...               │
├────────────────────────────────────────┤
│ ⭐ Ma vue complète           [✏️] [🗑️] │  ← Vue par défaut
│    Vue minimaliste           [✏️] [🗑️] │
│    Vue export                [✏️] [🗑️] │
├────────────────────────────────────────┤
│ ➕ Nouvelle vue depuis l'actuelle      │
└────────────────────────────────────────┘
```

## ⚡ Fonctionnalités

### Implémentées
- ✅ Chargement automatique des vues
- ✅ Application de la vue par défaut
- ✅ Création de nouvelles vues
- ✅ Mise à jour des vues existantes
- ✅ Suppression avec confirmation
- ✅ Définir une vue par défaut (étoile cliquable)
- ✅ Détection des modifications non sauvegardées
- ✅ Validation côté client
- ✅ États de chargement
- ✅ Support du dark mode
- ✅ Recherche dans les vues (si > 5 vues)

### À venir (évolutions backend)
- 📅 Sauvegarde des filtres dans les vues
- 📅 Sauvegarde du tri
- 📅 Partage de vues entre utilisateurs
- 📅 Vues templates administrateur

## 🔑 API Backend

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/table-views?entityType=X` | Liste des vues |
| GET | `/table-views/:id` | Détails d'une vue |
| POST | `/table-views` | Créer une vue |
| PATCH | `/table-views/:id` | Modifier une vue |
| DELETE | `/table-views/:id` | Supprimer une vue |

## 📝 Types principaux

```typescript
interface TableView {
  id: string
  name: string
  entityType: EntityType
  visibleColumns: string[]
  isDefault: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

enum EntityType {
  MONDES = 'mondes',
  PERSONNAGES = 'personnages',
  EVENEMENTS = 'evenements',
  // ... autres entités
}
```

## ❓ FAQ

**Q: Comment ajouter un nouveau type d'entité ?**
R: Ajouter la valeur dans l'enum `EntityType` (types/table-views.ts) et les colonnes correspondantes dans `AVAILABLE_COLUMNS`.

**Q: Les vues sont-elles partagées entre utilisateurs ?**
R: Non, chaque utilisateur a ses propres vues. Le backend filtre par `userId`.

**Q: Que se passe-t-il si une colonne est supprimée du backend ?**
R: La vue continuera de fonctionner mais la colonne invalide sera ignorée. Une mise à jour de la vue supprimera automatiquement les colonnes invalides.

## 📄 Fichiers fournis

| Fichier | Description |
|---------|-------------|
| `types/table-views.ts` | Types TypeScript complets |
| `hooks/useTableViews.ts` | Hook React Query |
| `components/ui/TableViews/ViewSelector.tsx` | Dropdown de sélection |
| `components/ui/TableViews/ViewSaveModal.tsx` | Modal création/édition |
| `components/ui/TableViews/ViewDeleteModal.tsx` | Modal suppression |
| `components/ui/TableViews/index.ts` | Exports centralisés |
| `examples/datatable_monde_with_views.example.tsx` | Exemple complet |

---

**Version** : 1.0  
**Date** : Janvier 2025  
**Compatibilité** : Next.js 15, React 19, React Query 5
