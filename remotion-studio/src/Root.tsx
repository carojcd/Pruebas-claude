import { Composition } from 'remotion';
import { Prueba } from './pieces/prueba/Prueba';

// Registro de piezas: cada pieza nueva va en src/pieces/<nombre>/ y se añade aquí.
export const RemotionRoot = () => (
  <>
    <Composition id="prueba" component={Prueba} durationInFrames={60} fps={30} width={1920} height={1080} />
  </>
);
