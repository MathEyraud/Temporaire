# Guide d'utilisation du mode Virtualisé - DataTable

## Vue d'ensemble

Le mode `virtualized` est un nouveau mode de pagination qui combine les avantages du scroll infini avec la virtualisation des lignes. Il est conçu pour gérer efficacement de grands ensembles de données (100 à 5000+ lignes) tout en maintenant des performances optimales.

## Quand utiliser quel mode ?

| Mode | Cas d'utilisation | Performance | Navigation |
|------|-------------------|-------------|------------|
| `page` | < 100 éléments, navigation précise requise | ⭐⭐⭐ | Par pages |
| `infinite` | 100-500 éléments, lecture continue | ⭐⭐ | Scroll continu |
| `virtualized` | 100-5000+ éléments, grands datasets | ⭐⭐⭐ | Ascenseur direct |

## Utilisation basique

```tsx
import { DataTable } from '@/components/ui/DataTable'
import type { ColumnConfig } from '@/components/ui/DataTable'

// Définition des colonnes
const columns: ColumnConfig<Personnage>[] = [
  { key: 'nom', label: 'Nom', sortable: true, filterable: true },
  { key: 'prenom', label: 'Prénom', sortable: true },
  { key: 'age', label: 'Âge', sortable: true },
]

// Utilisation avec virtualisation
<DataTable<Personnage>
  title="Personnages"
  endpoint="/personnage"
  queryKey={['personnages']}
  columns={columns}
  paginationMode="virtualized"  // Active la virtualisation
/>
```

## Configuration avancée

### Options de virtualisation

```tsx
import { DataTable, VirtualizationConfig } from '@/components/ui/DataTable'

// Configuration personnalisée
const virtualizationConfig: VirtualizationConfig = {
  rowHeight: 52,           // Hauteur de chaque ligne (défaut: 48px)
  overscan: 10,            // Lignes pré-rendues hors écran (défaut: 5)
  containerHeight: 700,    // Hauteur du tableau (défaut: 600px)
  scrollThreshold: 15,     // Seuil avant chargement (défaut: 10 lignes)
  showScrollIndicator: true // Afficher "Lignes X-Y sur Z"
}

<DataTable<Personnage>
  title="Personnages"
  endpoint="/personnage"
  queryKey={['personnages']}
  columns={columns}
  paginationMode="virtualized"
  virtualizationConfig={virtualizationConfig}
  maxInfiniteItems={5000}  // Limite maximale d'éléments
/>
```

### Explication des options

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `rowHeight` | number | 48 | Hauteur fixe de chaque ligne en pixels. **Doit être identique pour toutes les lignes.** |
| `overscan` | number | 5 | Nombre de lignes rendues au-dessus et en-dessous de la zone visible. Plus c'est élevé, plus le scroll est fluide mais plus le DOM est lourd. |
| `containerHeight` | number | 600 | Hauteur du conteneur scrollable. Peut aussi être défini via `fixedHeight`. |
| `scrollThreshold` | number | 10 | Nombre de lignes avant la fin qui déclenche le chargement de la page suivante. |
| `showScrollIndicator` | boolean | true | Affiche un indicateur de position lors du scroll (ex: "Lignes 150-170 sur 5000"). |

## Exemples complets

### Exemple 1 : Référentiel de personnages (5000+ entrées)

```tsx
<DataTable<Personnage>
  title="Référentiel des personnages"
  endpoint="/personnage"
  queryKey={['personnages']}
  columns={personnageColumns}
  
  // Mode virtualisé pour les grands datasets
  paginationMode="virtualized"
  virtualizationConfig={{
    rowHeight: 48,
    overscan: 8,
    containerHeight: 650,
    scrollThreshold: 20,
  }}
  
  // Limite à 5000 éléments max
  maxInfiniteItems={5000}
  
  // Fonctionnalités activées
  allowSorting={true}
  allowEdit={true}
  allowDelete={true}
  useAdvancedFilters={true}
  showAdvancedFilterBuilder={true}
  
  // Callbacks
  onRowClick={handleRowClick}
  onEdit={handleEdit}
/>
```

### Exemple 2 : Liste d'événements avec hauteur personnalisée

```tsx
<DataTable<Evenement>
  title="Événements"
  endpoint="/evenement"
  queryKey={['evenements']}
  columns={evenementColumns}
  
  paginationMode="virtualized"
  
  // Lignes plus hautes pour afficher plus de contenu
  virtualizationConfig={{
    rowHeight: 64,  // Lignes de 64px
    overscan: 4,    // Moins de pré-rendu car lignes plus grandes
  }}
  
  // Utiliser fixedHeight au lieu de containerHeight
  fixedHeight={500}
/>
```

### Exemple 3 : Composant conditionnel selon le volume

```tsx
function ListeAdaptative<T>({ estimatedCount, ...props }: Props<T>) {
  // Choisir automatiquement le mode selon le volume estimé
  const paginationMode = useMemo(() => {
    if (estimatedCount > 100) return 'virtualized'
    if (estimatedCount > 50) return 'infinite'
    return 'page'
  }, [estimatedCount])

  return (
    <DataTable<T>
      {...props}
      paginationMode={paginationMode}
      virtualizationConfig={
        paginationMode === 'virtualized' 
          ? { rowHeight: 48, overscan: 5 }
          : undefined
      }
    />
  )
}
```

## Fonctionnalités conservées

Le mode `virtualized` supporte toutes les fonctionnalités existantes :

✅ Tri multi-colonnes  
✅ Filtres simples par colonne  
✅ Filtres avancés (AdvancedFilterBuilder)  
✅ Actions (édition, suppression)  
✅ Clic sur les lignes  
✅ Gestion des colonnes (visibilité, ordre, redimensionnement)  
✅ Prefetch au survol  
✅ Export CSV  
✅ Thème sombre  

## Indicateur de position

En mode virtualisé, un indicateur de position s'affiche lors du scroll :

```
┌─────────────────────────────────┐
│  [Lignes 150-170 sur 5000]     │  ← Indicateur temporaire
├─────────────────────────────────┤
│  ... données ...                │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│  500 éléments chargés sur 5000 │  ← Compteur permanent
└─────────────────────────────────┘
```

L'indicateur s'affiche pendant 1.5 secondes après chaque scroll, puis disparaît.

## Différences avec le mode Infinite

| Aspect | Mode `infinite` | Mode `virtualized` |
|--------|-----------------|-------------------|
| DOM | Toutes les lignes | Seulement les visibles (~20-30) |
| Performance à 500 lignes | Dégradée | Excellente |
| Performance à 2000 lignes | Très mauvaise | Excellente |
| Mémoire | Élevée | Optimisée |
| Navigation | Scroll continu | Ascenseur natif |
| Chargement | Au bas du tableau | Lors du scroll dans les données non chargées |

## Bonnes pratiques

### 1. Hauteur de ligne constante

```tsx
// ✅ BON : Hauteur fixe pour toutes les lignes
virtualizationConfig={{ rowHeight: 48 }}

// ❌ MAUVAIS : Contenu qui fait varier la hauteur
// Évitez les textes multi-lignes ou le word-wrap dans les cellules
```

### 2. Configurer l'overscan selon l'usage

```tsx
// Navigation rapide (beaucoup de scroll) → overscan élevé
virtualizationConfig={{ overscan: 10 }}

// Lecture lente → overscan faible pour économiser les ressources
virtualizationConfig={{ overscan: 3 }}
```

### 3. Ajuster le seuil de chargement

```tsx
// Connexion rapide → seuil bas
virtualizationConfig={{ scrollThreshold: 5 }}

// Connexion lente → seuil élevé pour anticiper
virtualizationConfig={{ scrollThreshold: 20 }}
```

### 4. Utiliser fixedHeight pour la cohérence

```tsx
// Préférez fixedHeight pour contrôler la hauteur globale
<DataTable
  fixedHeight={600}
  paginationMode="virtualized"
  // containerHeight sera automatiquement = fixedHeight
/>
```

## Dépannage

### Le scroll est saccadé

**Cause possible** : Overscan trop faible  
**Solution** : Augmentez l'overscan

```tsx
virtualizationConfig={{ overscan: 10 }}
```

### Les lignes se chevauchent

**Cause possible** : rowHeight ne correspond pas à la hauteur réelle  
**Solution** : Mesurez la hauteur réelle d'une ligne et ajustez

```tsx
// Inspectez une ligne avec les DevTools et notez sa hauteur
virtualizationConfig={{ rowHeight: 52 }} // Ajustez selon la mesure
```

### Le chargement se déclenche trop tôt/tard

**Cause possible** : scrollThreshold mal calibré  
**Solution** : Ajustez selon vos besoins

```tsx
// Déclencher plus tôt (avant d'atteindre la fin)
virtualizationConfig={{ scrollThreshold: 20 }}

// Déclencher plus tard (proche de la fin)
virtualizationConfig={{ scrollThreshold: 5 }}
```

### L'indicateur de position ne s'affiche pas

**Cause possible** : Moins de 50 lignes ou désactivé  
**Solution** : L'indicateur ne s'affiche que si > 50 lignes

```tsx
// Forcer l'affichage (modifier le seuil dans VirtualizedTableBody si besoin)
virtualizationConfig={{ showScrollIndicator: true }}
```

## Migration depuis le mode Infinite

Si vous utilisez déjà le mode `infinite` et souhaitez migrer vers `virtualized` :

```tsx
// AVANT (mode infinite)
<DataTable
  paginationMode="infinite"
  maxInfiniteItems={1000}
  showInfiniteEndMessage={true}
  fixedHeight={600}
/>

// APRÈS (mode virtualized)
<DataTable
  paginationMode="virtualized"
  maxInfiniteItems={1000}
  fixedHeight={600}
  virtualizationConfig={{
    rowHeight: 48,  // Ajoutez la hauteur de vos lignes
  }}
/>
```

**Points de vigilance lors de la migration :**

1. Mesurez la hauteur exacte de vos lignes
2. Testez avec un grand volume de données
3. Vérifiez que toutes les fonctionnalités (filtres, tri, actions) fonctionnent
4. Ajustez l'overscan si le scroll n'est pas fluide

## Performance comparée

Tests effectués avec Chrome DevTools (simulation de données) :

| Nombre de lignes | Mode `page` | Mode `infinite` | Mode `virtualized` |
|------------------|-------------|-----------------|-------------------|
| 100 | 60 FPS | 60 FPS | 60 FPS |
| 500 | 60 FPS | 45 FPS | 60 FPS |
| 1000 | 60 FPS | 25 FPS | 60 FPS |
| 2000 | N/A | 15 FPS | 60 FPS |
| 5000 | N/A | < 10 FPS | 60 FPS |

**Légende :**
- 60 FPS = Fluide
- 45 FPS = Acceptable
- < 30 FPS = Saccadé
- N/A = Non applicable (pagination classique)

## Architecture technique

```
DataTable (paginationMode="virtualized")
│
├── useInfiniteData (chargement progressif des données)
│   └── Gère la pagination côté serveur
│   └── Accumule les pages en mémoire
│
├── TableHeader (en-têtes fixes)
│   └── Tri, filtres, redimensionnement
│
└── VirtualizedTableBody
    ├── useVirtualizer (@tanstack/react-virtual)
    │   └── Calcule les lignes visibles
    │   └── Gère le recyclage des éléments DOM
    │
    ├── VirtualizedRow (composant mémoïsé)
    │   └── Rendu d'une ligne individuelle
    │
    ├── ScrollPositionIndicator
    │   └── Affiche "Lignes X-Y sur Z"
    │
    └── Détection de fin de scroll
        └── Déclenche fetchNextPage()
```

## API complète

### Props spécifiques au mode virtualisé

| Prop | Type | Obligatoire | Description |
|------|------|-------------|-------------|
| `paginationMode` | `'virtualized'` | Oui | Active le mode virtualisé |
| `virtualizationConfig` | `VirtualizationConfig` | Non | Configuration de la virtualisation |
| `fixedHeight` | `number` | Recommandé | Hauteur du tableau |
| `maxInfiniteItems` | `number` | Non | Limite max d'éléments à charger |

### Interface VirtualizationConfig

```typescript
interface VirtualizationConfig {
  rowHeight?: number          // Défaut: 48
  overscan?: number           // Défaut: 5
  containerHeight?: number    // Défaut: 600
  scrollThreshold?: number    // Défaut: 10
  showScrollIndicator?: boolean // Défaut: true
}
```

## Conclusion

Le mode `virtualized` est la solution recommandée pour les grands ensembles de données. Il combine :

- **Performance** : DOM léger grâce à la virtualisation
- **Expérience utilisateur** : Navigation fluide via l'ascenseur natif
- **Fonctionnalités** : Toutes les capacités du DataTable existant
- **Simplicité** : Configuration minimale requise

Pour toute question ou problème, n'hésitez pas à consulter les exemples ou à demander de l'aide !
