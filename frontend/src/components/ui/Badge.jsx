import { cn, getCategoryClass, getDifficultyClass } from '../../lib/utils';
import { useCategories } from '../../context/CategoriesContext';

export default function Badge({ children, className, variant = 'default', ...props }) {
  const baseStyles = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';
  
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    destructive: 'bg-destructive/20 text-destructive'
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const { getColorForCategory } = useCategories();
  
  // Get dynamic color from context with fallback
  let color = '#6b7280'; // default gray
  try {
    color = getColorForCategory(category);
  } catch (err) {
    console.warn(`[CategoryBadge] Could not get color for ${category}, using default`);
  }

  return (
    <span 
      className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', getCategoryClass(category))}
      style={{
        // Apply dynamic color with fallback to CSS classes
        backgroundColor: `${color}20`,
        color: color
      }}
      title={`Category: ${category}`}
    >
      {category}
    </span>
  );
}

export function DifficultyBadge({ difficulty }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', getDifficultyClass(difficulty))}>
      {difficulty}
    </span>
  );
}
