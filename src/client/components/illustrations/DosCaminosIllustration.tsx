interface IllustrationProps {
  className?: string;
}

export function DosCaminosIllustration({ className }: IllustrationProps) {
  return <img src="/illustrations/dos-caminos.png" alt="Dos caminos hacia la escuela: El Bajo inundado y La Loma transitable" className={className} draggable={false} />;
}
