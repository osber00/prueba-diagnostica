interface GuiaLecturaProps {
  mood?: "greeting" | "cheering" | "celebrating";
  className?: string;
}

export function GuiaLectura({ mood = "greeting", className }: GuiaLecturaProps) {
  const alt = mood === "celebrating"
    ? "Libro y lápiz celebrando el final de la prueba"
    : "Libro, lupa y lápiz para buscar pistas en la lectura";

  return <img src="/illustrations/guia-lectura.png" alt={alt} className={className} draggable={false} />;
}
