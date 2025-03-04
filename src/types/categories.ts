export interface MainCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  path: string; // Ruta a la que navegar al seleccionar esta categoría
}
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}
