/** Llama Repsol (logo de marca, ver ref. index.html del compañero). Decorativa: usar con aria-hidden. */
export default function RepsolFlame({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden focusable="false">
      <path d="M16 2C9 7 4 14 4 20C4 26.627 9.373 32 16 32C22.627 32 28 26.627 28 20C28 14 23 7 16 2Z" fill="#FF5A00" />
      <path d="M16 7C11.5 10.5 8 15 8 19.5C8 23.918 11.582 27.5 16 27.5C20.418 27.5 24 23.918 24 19.5C24 15 20.5 10.5 16 7Z" fill="#E4002B" />
      <path d="M16 13C13.8 15.5 12 18 12 20.5C12 22.709 13.791 24.5 16 24.5C18.209 24.5 20 22.709 20 20.5C20 18 18.2 15.5 16 13Z" fill="#FFD000" />
    </svg>
  );
}
